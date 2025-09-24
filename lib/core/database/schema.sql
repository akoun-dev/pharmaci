-- PharmaCi Database Schema for Supabase

-- Users table
CREATE TABLE users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    phone TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('patient', 'pharmacist', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pharmacies table
CREATE TABLE pharmacies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    website TEXT,
    rating INTEGER CHECK (rating >= 0 AND rating <= 5),
    opening_hours JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drugs table
CREATE TABLE drugs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    molecule TEXT,
    category TEXT,
    dosage TEXT,
    requires_prescription BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pharmacy Stocks table
CREATE TABLE pharmacy_stocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
    drug_id UUID REFERENCES drugs(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    price DECIMAL(10, 2) CHECK (price >= 0),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_available BOOLEAN DEFAULT true,
    UNIQUE(pharmacy_id, drug_id)
);

-- Reservations table
CREATE TABLE reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
    drug_id UUID REFERENCES drugs(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'ready', 'completed', 'cancelled')),
    reservation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pickup_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drug Interactions table
CREATE TABLE drug_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    drug_id_1 UUID REFERENCES drugs(id) ON DELETE CASCADE,
    drug_id_2 UUID REFERENCES drugs(id) ON DELETE CASCADE,
    severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
    description TEXT,
    UNIQUE(drug_id_1, drug_id_2)
);

-- Sync Logs table
CREATE TABLE sync_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
    sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'manual')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
    items_synced INTEGER DEFAULT 0,
    error_message TEXT,
    sync_duration INTEGER, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_pharmacies_location ON pharmacies (latitude, longitude);
CREATE INDEX idx_pharmacy_stocks_pharmacy_drug ON pharmacy_stocks (pharmacy_id, drug_id);
CREATE INDEX idx_reservations_user ON reservations (user_id);
CREATE INDEX idx_reservations_pharmacy ON reservations (pharmacy_id);
CREATE INDEX idx_reservations_status ON reservations (status);
CREATE INDEX idx_drugs_name ON drugs (name);
CREATE INDEX idx_drugs_molecule ON drugs (molecule);

-- Create RLS policies
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Everyone can view pharmacies" ON pharmacies
    FOR SELECT USING (true);

CREATE POLICY "Pharmacists can update their pharmacy" ON pharmacies
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'pharmacist'
        )
    );

CREATE POLICY "Everyone can view drugs" ON drugs
    FOR SELECT USING (true);

CREATE POLICY "Everyone can view pharmacy stocks" ON pharmacy_stocks
    FOR SELECT USING (true);

CREATE POLICY "Pharmacists can update their pharmacy stocks" ON pharmacy_stocks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            JOIN pharmacies ON users.id = pharmacies.id
            WHERE users.id = auth.uid()
            AND users.role = 'pharmacist'
            AND pharmacies.id = pharmacy_stocks.pharmacy_id
        )
    );

CREATE POLICY "Users can view their reservations" ON reservations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create reservations" ON reservations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their reservations" ON reservations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Pharmacies can view reservations for their pharmacy" ON reservations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pharmacies
            WHERE pharmacies.id = reservations.pharmacy_id
            AND pharmacies.user_id = auth.uid()
        )
    );

CREATE POLICY "Everyone can view drug interactions" ON drug_interactions
    FOR SELECT USING (true);

CREATE POLICY "Pharmacists can view their sync logs" ON sync_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pharmacies
            WHERE pharmacies.id = sync_logs.pharmacy_id
            AND pharmacies.user_id = auth.uid()
        )
    );

-- Create function to auto-create user profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, role)
    VALUES (NEW.id, NEW.email, 'patient');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to calculate distance between two points using Haversine formula
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL,
    lon1 DECIMAL,
    lat2 DECIMAL,
    lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    r DECIMAL := 6371; -- Earth's radius in kilometers
    dLat DECIMAL;
    dLon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    dLat := RADIANS(lat2 - lat1);
    dLon := RADIANS(lon2 - lon1);
    a := SIN(dLat / 2) * SIN(dLat / 2) +
        COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
        SIN(dLon / 2) * SIN(dLon / 2);
    c := 2 * ATAN2(SQRT(a), SQRT(1 - a));
    RETURN r * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to find pharmacies within a given radius
CREATE OR REPLACE FUNCTION find_pharmacies_within_radius(
    center_lat DECIMAL,
    center_lon DECIMAL,
    radius_km DECIMAL
) RETURNS TABLE (
    id UUID,
    name TEXT,
    address TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    phone TEXT,
    email TEXT,
    website TEXT,
    rating INTEGER,
    opening_hours JSONB,
    distance DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.name,
        p.address,
        p.latitude,
        p.longitude,
        p.phone,
        p.email,
        p.website,
        p.rating,
        p.opening_hours,
        calculate_distance(center_lat, center_lon, p.latitude, p.longitude) as distance
    FROM pharmacies p
    WHERE p.is_active = true
    AND calculate_distance(center_lat, center_lon, p.latitude, p.longitude) <= radius_km
    ORDER BY distance;
END;
$$ LANGUAGE plpgsql;

-- Function to find pharmacies with specific drug within radius
CREATE OR REPLACE FUNCTION find_pharmacies_with_drug_within_radius(
    center_lat DECIMAL,
    center_lon DECIMAL,
    radius_km DECIMAL,
    drug_id UUID
) RETURNS TABLE (
    pharmacy_id UUID,
    pharmacy_name TEXT,
    pharmacy_address TEXT,
    pharmacy_latitude DECIMAL,
    pharmacy_longitude DECIMAL,
    pharmacy_phone TEXT,
    drug_id UUID,
    drug_name TEXT,
    quantity INTEGER,
    price DECIMAL,
    distance DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id as pharmacy_id,
        p.name as pharmacy_name,
        p.address as pharmacy_address,
        p.latitude as pharmacy_latitude,
        p.longitude as pharmacy_longitude,
        p.phone as pharmacy_phone,
        d.id as drug_id,
        d.name as drug_name,
        ps.quantity,
        ps.price,
        calculate_distance(center_lat, center_lon, p.latitude, p.longitude) as distance
    FROM pharmacies p
    JOIN pharmacy_stocks ps ON p.id = ps.pharmacy_id
    JOIN drugs d ON ps.drug_id = d.id
    WHERE p.is_active = true
    AND d.is_active = true
    AND ps.is_available = true
    AND ps.quantity > 0
    AND d.id = drug_id
    AND calculate_distance(center_lat, center_lon, p.latitude, p.longitude) <= radius_km
    ORDER BY distance;
END;
$$ LANGUAGE plpgsql;

-- Function to find pharmacies by drug name within radius
CREATE OR REPLACE FUNCTION find_pharmacies_by_drug_name_within_radius(
    center_lat DECIMAL,
    center_lon DECIMAL,
    radius_km DECIMAL,
    drug_name TEXT
) RETURNS TABLE (
    pharmacy_id UUID,
    pharmacy_name TEXT,
    pharmacy_address TEXT,
    pharmacy_latitude DECIMAL,
    pharmacy_longitude DECIMAL,
    pharmacy_phone TEXT,
    drug_id UUID,
    drug_name TEXT,
    quantity INTEGER,
    price DECIMAL,
    distance DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id as pharmacy_id,
        p.name as pharmacy_name,
        p.address as pharmacy_address,
        p.latitude as pharmacy_latitude,
        p.longitude as pharmacy_longitude,
        p.phone as pharmacy_phone,
        d.id as drug_id,
        d.name as drug_name,
        ps.quantity,
        ps.price,
        calculate_distance(center_lat, center_lon, p.latitude, p.longitude) as distance
    FROM pharmacies p
    JOIN pharmacy_stocks ps ON p.id = ps.pharmacy_id
    JOIN drugs d ON ps.drug_id = d.id
    WHERE p.is_active = true
    AND d.is_active = true
    AND ps.is_available = true
    AND ps.quantity > 0
    AND LOWER(d.name) LIKE LOWER('%' || drug_name || '%')
    AND calculate_distance(center_lat, center_lon, p.latitude, p.longitude) <= radius_km
    ORDER BY distance;
END;
$$ LANGUAGE plpgsql;