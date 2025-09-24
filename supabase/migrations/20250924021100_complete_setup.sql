-- Migration complète pour la configuration de la base de données PharmaCi
-- Inclut toutes les tables, fonctions, RLS et données de seed

-- Activer l'extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Supprimer tous les triggers
DO $$
BEGIN
    DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
    DROP TRIGGER IF EXISTS set_pharmacies_updated_at ON public.pharmacies;
    DROP TRIGGER IF EXISTS set_drugs_updated_at ON public.drugs;
    DROP TRIGGER IF EXISTS set_pharmacy_stocks_updated_at ON public.pharmacy_stocks;
    DROP TRIGGER IF EXISTS set_reservations_updated_at ON public.reservations;
    DROP TRIGGER IF EXISTS set_payments_updated_at ON public.payments;
    DROP TRIGGER IF EXISTS set_reviews_updated_at ON public.reviews;
    DROP TRIGGER IF EXISTS set_health_assistant_conversations_updated_at ON public.health_assistant_conversations;
    DROP TRIGGER IF EXISTS set_health_assistant_updated_at ON public.health_assistant_conversations;
    DROP TRIGGER IF EXISTS set_sync_logs_updated_at ON public.sync_logs;
EXCEPTION
    WHEN undefined_table THEN
        NULL;
    WHEN undefined_object THEN
        NULL;
END $$;

-- Supprimer toutes les fonctions
DO $$
BEGIN
    DROP FUNCTION IF EXISTS public.handle_updated_at();
    DROP FUNCTION IF EXISTS public.calculate_distance(numeric, numeric, numeric, numeric);
    DROP FUNCTION IF EXISTS public.find_pharmacies_within_radius(numeric, numeric, numeric);
    DROP FUNCTION IF EXISTS public.find_pharmacies_with_drug_within_radius(uuid, numeric, numeric, numeric);
    DROP FUNCTION IF EXISTS public.find_pharmacies_by_drug_name_within_radius(text, numeric, numeric, numeric);
EXCEPTION
    WHEN undefined_function THEN
        NULL;
END $$;

-- Créer les types énumérés
CREATE TYPE public.user_role AS ENUM ('patient', 'pharmacist', 'admin');
CREATE TYPE public.drug_category AS ENUM ('Antidouleur', 'Anti-inflammatoire', 'Antibiotique', 'Antispasmodique', 'Vitamine', 'Diabète', 'Hypertension', 'Antihistaminique');
CREATE TYPE public.reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE public.payment_method AS ENUM ('orange_money', 'mtn', 'wave', 'credit_card', 'bank_transfer', 'cash');
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE public.review_type AS ENUM ('pharmacy', 'drug', 'service', 'delivery');
CREATE TYPE public.sync_type AS ENUM ('full', 'incremental', 'manual');
CREATE TYPE public.sync_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE public.query_type AS ENUM ('drug_info', 'symptoms', 'interaction', 'dosage', 'general');

-- Fonction pour gérer les timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Table users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    role public.user_role NOT NULL DEFAULT 'patient',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger pour users
DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Table pharmacies
CREATE TABLE IF NOT EXISTS public.pharmacies (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    phone TEXT,
    email TEXT,
    website TEXT,
    rating DECIMAL(3, 2),
    opening_hours JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger pour pharmacies
DROP TRIGGER IF EXISTS set_pharmacies_updated_at ON public.pharmacies;
CREATE TRIGGER set_pharmacies_updated_at
    BEFORE UPDATE ON public.pharmacies
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Table drugs
CREATE TABLE IF NOT EXISTS public.drugs (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    molecule TEXT,
    category public.drug_category,
    dosage TEXT,
    requires_prescription BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger pour drugs
DROP TRIGGER IF EXISTS set_drugs_updated_at ON public.drugs;
CREATE TRIGGER set_drugs_updated_at
    BEFORE UPDATE ON public.drugs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Table pharmacy_stocks
CREATE TABLE IF NOT EXISTS public.pharmacy_stocks (
    id UUID PRIMARY KEY,
    pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    drug_id UUID NOT NULL REFERENCES public.drugs(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10, 2),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_available BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(pharmacy_id, drug_id)
);

-- Trigger pour pharmacy_stocks
DROP TRIGGER IF EXISTS set_pharmacy_stocks_updated_at ON public.pharmacy_stocks;
CREATE TRIGGER set_pharmacy_stocks_updated_at
    BEFORE UPDATE ON public.pharmacy_stocks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Table reservations
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    drug_id UUID NOT NULL REFERENCES public.drugs(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    status public.reservation_status NOT NULL DEFAULT 'pending',
    pickup_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger pour reservations
DROP TRIGGER IF EXISTS set_reservations_updated_at ON public.reservations;
CREATE TRIGGER set_reservations_updated_at
    BEFORE UPDATE ON public.reservations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Table payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
    pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method public.payment_method NOT NULL,
    status public.payment_status NOT NULL DEFAULT 'pending',
    payment_date TIMESTAMPTZ,
    transaction_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger pour payments
DROP TRIGGER IF EXISTS set_payments_updated_at ON public.payments;
CREATE TRIGGER set_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Table reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    pharmacy_id UUID REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    drug_id UUID REFERENCES public.drugs(id) ON DELETE CASCADE,
    review_type public.review_type NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    pros TEXT[],
    cons TEXT[],
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger pour reviews
DROP TRIGGER IF EXISTS set_reviews_updated_at ON public.reviews;
CREATE TRIGGER set_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Table health_assistant_conversations
CREATE TABLE IF NOT EXISTS public.health_assistant_conversations (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    query_type public.query_type NOT NULL,
    query_text TEXT NOT NULL,
    response_text TEXT NOT NULL,
    confidence_score DECIMAL(3, 2),
    is_saved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger pour health_assistant_conversations
DROP TRIGGER IF EXISTS set_health_assistant_conversations_updated_at ON public.health_assistant_conversations;
CREATE TRIGGER set_health_assistant_conversations_updated_at
    BEFORE UPDATE ON public.health_assistant_conversations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Table drug_interactions
CREATE TABLE IF NOT EXISTS public.drug_interactions (
    drug_id_1 UUID NOT NULL REFERENCES public.drugs(id) ON DELETE CASCADE,
    drug_id_2 UUID NOT NULL REFERENCES public.drugs(id) ON DELETE CASCADE,
    severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
    description TEXT,
    PRIMARY KEY (drug_id_1, drug_id_2)
);

-- Table sync_logs
CREATE TABLE IF NOT EXISTS public.sync_logs (
    id UUID PRIMARY KEY,
    pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    sync_type public.sync_type NOT NULL,
    status public.sync_status NOT NULL,
    items_synced INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    sync_duration INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger pour sync_logs
DROP TRIGGER IF EXISTS set_sync_logs_updated_at ON public.sync_logs;
CREATE TRIGGER set_sync_logs_updated_at
    BEFORE UPDATE ON public.sync_logs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Fonctions utilitaires pour la géolocalisation
CREATE OR REPLACE FUNCTION public.calculate_distance(
    lat1 DECIMAL,
    lon1 DECIMAL,
    lat2 DECIMAL,
    lon2 DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
    distance DECIMAL;
BEGIN
    distance = 6371 * ACOS(
        COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
        COS(RADIANS(lon2) - RADIANS(lon1)) +
        SIN(RADIANS(lat1)) * SIN(RADIANS(lat2))
    );
    RETURN ROUND(distance, 2);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.find_pharmacies_within_radius(
    center_lat DECIMAL,
    center_lon DECIMAL,
    radius_km DECIMAL
)
RETURNS TABLE (
    pharmacy_id UUID,
    name TEXT,
    address TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    phone TEXT,
    rating DECIMAL,
    distance DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id, p.name, p.address, p.latitude, p.longitude, p.phone, p.rating,
        public.calculate_distance(center_lat, center_lon, p.latitude, p.longitude) as distance
    FROM public.pharmacies p
    WHERE public.calculate_distance(center_lat, center_lon, p.latitude, p.longitude) <= radius_km
    AND p.is_active = true
    ORDER BY distance;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.find_pharmacies_with_drug_within_radius(
    p_drug_id UUID,
    center_lat DECIMAL,
    center_lon DECIMAL,
    radius_km DECIMAL
)
RETURNS TABLE (
    pharmacy_id UUID,
    name TEXT,
    address TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    phone TEXT,
    rating DECIMAL,
    quantity INTEGER,
    price DECIMAL,
    distance DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id, p.name, p.address, p.latitude, p.longitude, p.phone, p.rating,
        ps.quantity, ps.price,
        public.calculate_distance(center_lat, center_lon, p.latitude, p.longitude) as distance
    FROM public.pharmacies p
    JOIN public.pharmacy_stocks ps ON p.id = ps.pharmacy_id
    WHERE ps.drug_id = p_drug_id
    AND ps.quantity > 0
    AND ps.is_available = true
    AND public.calculate_distance(center_lat, center_lon, p.latitude, p.longitude) <= radius_km
    AND p.is_active = true
    ORDER BY distance;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.find_pharmacies_by_drug_name_within_radius(
    p_drug_name TEXT,
    center_lat DECIMAL,
    center_lon DECIMAL,
    radius_km DECIMAL
)
RETURNS TABLE (
    pharmacy_id UUID,
    name TEXT,
    address TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    phone TEXT,
    rating DECIMAL,
    quantity INTEGER,
    price DECIMAL,
    distance DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id, p.name, p.address, p.latitude, p.longitude, p.phone, p.rating,
        ps.quantity, ps.price,
        public.calculate_distance(center_lat, center_lon, p.latitude, p.longitude) as distance
    FROM public.pharmacies p
    JOIN public.pharmacy_stocks ps ON p.id = ps.pharmacy_id
    JOIN public.drugs d ON ps.drug_id = d.id
    WHERE LOWER(d.name) LIKE LOWER(p_drug_name)
    AND ps.quantity > 0
    AND ps.is_available = true
    AND public.calculate_distance(center_lat, center_lon, p.latitude, p.longitude) <= radius_km
    AND p.is_active = true
    ORDER BY distance;
END;
$$ LANGUAGE plpgsql;

-- Politiques RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Pharmacies are viewable by everyone" ON public.pharmacies
    FOR SELECT USING (true);

CREATE POLICY "Pharmacists can manage their pharmacy" ON public.pharmacies
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Drugs are viewable by everyone" ON public.drugs
    FOR SELECT USING (true);

CREATE POLICY "Pharmacy stocks are viewable by everyone" ON public.pharmacy_stocks
    FOR SELECT USING (true);

CREATE POLICY "Pharmacists can manage their stock" ON public.pharmacy_stocks
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.pharmacies p
        WHERE p.id = pharmacy_stocks.pharmacy_id
        AND p.user_id::text = auth.uid()::text
    ));

CREATE POLICY "Users can view own reservations" ON public.reservations
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Pharmacists can manage pharmacy reservations" ON public.reservations
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.pharmacies p
        WHERE p.id = reservations.pharmacy_id
        AND p.user_id::text = auth.uid()::text
    ));

CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Pharmacists can view pharmacy payments" ON public.payments
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.pharmacies p
        WHERE p.id = payments.pharmacy_id
        AND p.user_id::text = auth.uid()::text
    ));

CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own reviews" ON public.reviews
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Health assistant conversations are private" ON public.health_assistant_conversations
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Sync logs are viewable by pharmacists" ON public.sync_logs
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.pharmacies p
        WHERE p.id = sync_logs.pharmacy_id
        AND p.user_id::text = auth.uid()::text
    ));

CREATE POLICY "Pharmacists can manage their sync logs" ON public.sync_logs
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.pharmacies p
        WHERE p.id = sync_logs.pharmacy_id
        AND p.user_id::text = auth.uid()::text
    ));

-- Indexes pour la performance
DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_pharmacies_location ON public.pharmacies USING GIST (point(latitude, longitude));
    CREATE INDEX IF NOT EXISTS idx_pharmacy_stocks_pharmacy_id ON public.pharmacy_stocks(pharmacy_id);
    CREATE INDEX IF NOT EXISTS idx_pharmacy_stocks_drug_id ON public.pharmacy_stocks(drug_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON public.reservations(user_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_pharmacy_id ON public.reservations(pharmacy_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
    CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_reservation_id ON public.payments(reservation_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
    CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_pharmacy_id ON public.reviews(pharmacy_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_drug_id ON public.reviews(drug_id);
    CREATE INDEX IF NOT EXISTS idx_health_assistant_conversations_user_id ON public.health_assistant_conversations(user_id);
    CREATE INDEX IF NOT EXISTS idx_health_assistant_conversations_query_type ON public.health_assistant_conversations(query_type);
    CREATE INDEX IF NOT EXISTS idx_sync_logs_pharmacy_id ON public.sync_logs(pharmacy_id);
    CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON public.sync_logs(status);
    CREATE INDEX IF NOT EXISTS idx_drug_interactions_drug_id_1 ON public.drug_interactions(drug_id_1);
    CREATE INDEX IF NOT EXISTS idx_drug_interactions_drug_id_2 ON public.drug_interactions(drug_id_2);
EXCEPTION
    WHEN duplicate_table THEN
        NULL;
    WHEN duplicate_object THEN
        NULL;
END $$;

-- Données de seed
-- 1. Users (uniquement l'utilisateur réel existant dans auth.users)
INSERT INTO public.users (id, email, first_name, last_name, phone, role, created_at, updated_at)
VALUES
    ('aef60b40-2cf8-45ea-b301-c3a91f4c2eb5', 'aboa.akoun40@gmail.com', 'ABOA AKOUN', 'BERNARD', '0140984943', 'patient', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- Création de l'utilisateur dans auth.users avec mot de passe pour les tests
-- Note: Cette partie doit être exécutée manuellement ou via l'API Supabase
-- Email: aboa.akoun40@gmail.com
-- Mot de passe: test1234
-- ID: aef60b40-2cf8-45ea-b301-c3a91f4c2eb5

-- 2. Pharmacies
INSERT INTO public.pharmacies (id, name, address, latitude, longitude, phone, email, website, rating, opening_hours, is_active, created_at, updated_at)
VALUES
    ('90d38d9c-29ef-4d07-bde0-50f09f54a286', 'Pharmacie de la Paix', 'Boulevard de Marseille, Abidjan', 5.33640000, -4.02670000, '+22521234567', 'contact@pharmacie-paix.ci', 'https://pharmacie-paix.ci', 4, '{"friday": "08:00-18:00", "monday": "08:00-18:00", "sunday": "fermé", "tuesday": "08:00-18:00", "saturday": "08:00-12:00", "thursday": "08:00-18:00", "wednesday": "08:00-18:00"}', true, NOW(), NOW()),
    ('65a0b05c-d2ff-4df7-bf9f-b3377f5aec14', 'Pharmacie Cocody', 'Rue des Jardins, Cocody, Abidjan', 5.34220000, -4.02520000, '+22521765432', 'info@pharmacie-cocody.ci', 'https://pharmacie-cocody.ci', 5, '{"friday": "07:30-19:00", "monday": "07:30-19:00", "sunday": "fermé", "tuesday": "07:30-19:00", "saturday": "08:00-13:00", "thursday": "07:30-19:00", "wednesday": "07:30-19:00"}', true, NOW(), NOW()),
    ('c8211b2a-cbf8-40cb-9b97-bb84e81deead', 'Pharmacie Plateau', 'Avenue Chardy, Plateau, Abidjan', 5.32520000, -4.01940000, '+22521987654', 'contact@pharmacie-plateau.ci', 'https://pharmacie-plateau.ci', 4, '{"friday": "08:00-18:30", "monday": "08:00-18:30", "sunday": "fermé", "tuesday": "08:00-18:30", "saturday": "08:00-14:00", "thursday": "08:00-18:30", "wednesday": "08:00-18:30"}', true, NOW(), NOW()),
    ('be735492-cc50-4727-8de9-aea5bd9ed763', 'Pharmacie Yopougon', 'Carrefour de la Paix, Yopougon, Abidjan', 5.36140000, -4.07500000, '+22521345678', 'contact@pharmacie-yopougon.ci', 'https://pharmacie-yopougon.ci', 3, '{"friday": "07:00-19:00", "monday": "07:00-19:00", "sunday": "08:00-12:00", "tuesday": "07:00-19:00", "saturday": "07:00-15:00", "thursday": "07:00-19:00", "wednesday": "07:00-19:00"}', true, NOW(), NOW()),
    ('1de997a6-0071-485b-8bb5-717322196574', 'Pharmacie Treichville', 'Boulevard de Marseille, Treichville, Abidjan', 5.30270000, -4.01890000, '+22521876543', 'info@pharmacie-treichville.ci', 'https://pharmacie-treichville.ci', 4, '{"friday": "08:00-18:00", "monday": "08:00-18:00", "sunday": "fermé", "tuesday": "08:00-18:00", "saturday": "08:00-12:00", "thursday": "08:00-18:00", "wednesday": "08:00-18:00"}', true, NOW(), NOW());

-- 3. Drugs
INSERT INTO public.drugs (id, name, description, molecule, category, dosage, requires_prescription, is_active, created_at, updated_at)
VALUES
    ('7d34555e-b85b-4d46-9639-172dca1c4eac', 'Paracétamol', 'Antidouleur et antipyrétique', 'Paracétamol', 'Antidouleur', '500mg', false, true, NOW(), NOW()),
    ('4c807a61-8e12-41c5-9488-7e9b0ca39a1d', 'Ibuprofène', 'Anti-inflammatoire non stéroïdien', 'Ibuprofène', 'Anti-inflammatoire', '400mg', false, true, NOW(), NOW()),
    ('3c146094-d7d2-410e-a58a-888b1ee102ec', 'Amoxicilline', 'Antibiotique de la famille des pénicillines', 'Amoxicilline', 'Antibiotique', '500mg', true, true, NOW(), NOW()),
    ('3ecd26eb-6da8-4d36-a51e-970714bd2657', 'Doliprane', 'Antidouleur et antipyrétique', 'Paracétamol', 'Antidouleur', '1000mg', false, true, NOW(), NOW()),
    ('c62c0408-9431-4bc6-9bcc-06bb7ab38ba0', 'Spasfon', 'Antispasmodique', 'Phloroglucinol', 'Antispasmodique', '80mg', false, true, NOW(), NOW()),
    ('e420b8d9-6729-4e30-a439-9ab9b7ff717b', 'Vitamin C', 'Complément alimentaire en vitamine C', 'Acide ascorbique', 'Vitamine', '1000mg', false, true, NOW(), NOW()),
    ('d2f930f4-36ee-496a-a27f-17f48a104e48', 'Aspirine', 'Anti-inflammatoire, antalgique et antipyrétique', 'Acide acétylsalicylique', 'Anti-inflammatoire', '325mg', false, true, NOW(), NOW()),
    ('8691c56e-2fcb-46e8-97e4-5b083781c562', 'Dexchlorphéniramine', 'Antihistaminique', 'Dexchlorphéniramine', 'Antihistaminique', '2mg', false, true, NOW(), NOW()),
    ('28e6d922-734e-42e5-b75a-e474688904cb', 'Metformine', 'Antidiabétique oral', 'Metformine', 'Diabète', '850mg', true, true, NOW(), NOW()),
    ('6be6ced3-bb3c-4a3d-bd20-35d634237a4f', 'Lisinopril', 'Antihypertenseur', 'Lisinopril', 'Hypertension', '10mg', true, true, NOW(), NOW());

-- 4. Pharmacy stocks
INSERT INTO public.pharmacy_stocks (id, pharmacy_id, drug_id, quantity, price, last_updated, is_available)
VALUES
    ('c4fb1a5e-209f-4f20-acd6-61cab820379e', '90d38d9c-29ef-4d07-bde0-50f09f54a286', '7d34555e-b85b-4d46-9639-172dca1c4eac', 100, 500.00, NOW(), true),
    ('93e89698-f73a-4d71-9abb-aa522d407250', '90d38d9c-29ef-4d07-bde0-50f09f54a286', '4c807a61-8e12-41c5-9488-7e9b0ca39a1d', 50, 750.00, NOW(), true),
    ('f191c741-4510-44b3-8374-ef88561afccc', '90d38d9c-29ef-4d07-bde0-50f09f54a286', '3c146094-d7d2-410e-a58a-888b1ee102ec', 30, 1200.00, NOW(), true),
    ('cd6f496b-092e-45a0-8693-7590852c745a', '90d38d9c-29ef-4d07-bde0-50f09f54a286', '3ecd26eb-6da8-4d36-a51e-970714bd2657', 80, 800.00, NOW(), true),
    ('0e594f72-6e20-4bdb-acb5-af7860056022', '90d38d9c-29ef-4d07-bde0-50f09f54a286', 'c62c0408-9431-4bc6-9bcc-06bb7ab38ba0', 60, 450.00, NOW(), true),
    ('fe193918-3b34-422d-a335-28f96188ff7e', '65a0b05c-d2ff-4df7-bf9f-b3377f5aec14', '7d34555e-b85b-4d46-9639-172dca1c4eac', 120, 480.00, NOW(), true),
    ('543437e8-68f4-4ef4-b8f6-afb09825d66e', '65a0b05c-d2ff-4df7-bf9f-b3377f5aec14', '4c807a61-8e12-41c5-9488-7e9b0ca39a1d', 75, 720.00, NOW(), true),
    ('1531ff13-e30b-4639-b86a-12d2a6bebe0f', '65a0b05c-d2ff-4df7-bf9f-b3377f5aec14', '3c146094-d7d2-410e-a58a-888b1ee102ec', 45, 1150.00, NOW(), true),
    ('f2fdcd4c-760a-4abc-bbd4-9ce9a0a05ae9', '65a0b05c-d2ff-4df7-bf9f-b3377f5aec14', '3ecd26eb-6da8-4d36-a51e-970714bd2657', 90, 780.00, NOW(), true),
    ('bb2338cc-286b-40b1-baf6-6f508f0c825a', 'c8211b2a-cbf8-40cb-9b97-bb84e81deead', '7d34555e-b85b-4d46-9639-172dca1c4eac', 80, 520.00, NOW(), true),
    ('da424cb4-a293-4f36-b681-ae693bb89d7b', 'c8211b2a-cbf8-40cb-9b97-bb84e81deead', '4c807a61-8e12-41c5-9488-7e9b0ca39a1d', 60, 780.00, NOW(), true),
    ('801890d7-376f-4c60-99db-44ec663c62da', 'c8211b2a-cbf8-40cb-9b97-bb84e81deead', 'c62c0408-9431-4bc6-9bcc-06bb7ab38ba0', 40, 470.00, NOW(), true);

-- 5. Drug interactions
INSERT INTO public.drug_interactions (drug_id_1, drug_id_2, severity, description)
VALUES
    ('4c807a61-8e12-41c5-9488-7e9b0ca39a1d', 'd2f930f4-36ee-496a-a27f-17f48a104e48', 'moderate', 'Augmentation du risque d''effets indésirables gastro-intestinaux'),
    ('3c146094-d7d2-410e-a58a-888b1ee102ec', '6be6ced3-bb3c-4a3d-bd20-35d634237a4f', 'severe', 'Augmentation de la toxicité du médicament'),
    ('7d34555e-b85b-4d46-9639-172dca1c4eac', '4c807a61-8e12-41c5-9488-7e9b0ca39a1d', 'mild', 'Association possible avec surveillance'),
    ('8691c56e-2fcb-46e8-97e4-5b083781c562', '7d34555e-b85b-4d46-9639-172dca1c4eac', 'moderate', 'Potentialisation des effets sédatifs');

-- 6. Reviews (uniquement pour l'utilisateur réel)
INSERT INTO public.reviews (id, user_id, pharmacy_id, drug_id, review_type, rating, title, comment, pros, cons, is_verified, created_at, updated_at)
VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'aef60b40-2cf8-45ea-b301-c3a91f4c2eb5', '90d38d9c-29ef-4d07-bde0-50f09f54a286', '7d34555e-b85b-4d46-9639-172dca1c4eac', 'pharmacy', 5, 'Excellent service', 'Pharmacie très professionnelle avec un personnel accueillant', ARRAY['Personnel professionnel', 'Horaires pratiques', 'Propreté'], ARRAY['Peut être un peu cher', 'Attente parfois longue'], true, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440001', 'aef60b40-2cf8-45ea-b301-c3a91f4c2eb5', '90d38d9c-29ef-4d07-bde0-50f09f54a286', '7d34555e-b85b-4d46-9639-172dca1c4eac', 'drug', 4, 'Produit efficace', 'Le paracétamol est efficace et le prix est raisonnable', ARRAY['Efficace', 'Bonne valeur', 'Disponible'], ARRAY['Emballage difficile à ouvrir'], true, NOW(), NOW());

-- 7. Health assistant conversations (uniquement pour l'utilisateur réel)
INSERT INTO public.health_assistant_conversations (id, user_id, query_type, query_text, response_text, confidence_score, is_saved, created_at, updated_at)
VALUES
    ('550e8400-e29b-41d4-a716-446655440003', 'aef60b40-2cf8-45ea-b301-c3a91f4c2eb5', 'drug_info', 'Quelles sont les effets secondaires du paracétamol ?', 'Le paracétamol est généralement bien toléré. Les effets secondaires rares incluent des réactions allergiques, des éruptions cutanées et des problèmes hépatiques à doses élevées. Ne dépassez pas la dose recommandée de 4g par jour.', 0.95, true, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440004', 'aef60b40-2cf8-45ea-b301-c3a91f4c2eb5', 'symptoms', 'J''ai mal à la tête et de la fièvre, que faire ?', 'Pour des maux de tête et de la fièvre, vous pouvez prendre du paracétamol (500-1000mg) toutes les 4-6 heures sans dépasser 4g par jour. Consultez un médecin si les symptômes persistent plus de 3 jours ou s''ils s''aggravent.', 0.90, true, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440005', 'aef60b40-2cf8-45ea-b301-c3a91f4c2eb5', 'interaction', 'Puis-je prendre de l''ibuprofène avec de l''amoxicilline ?', 'Oui, l''ibuprofène peut généralement être pris avec de l''amoxicilline. Il n''y a pas d''interaction majeure connue entre ces deux médicaments. Prenez-les avec de la nourriture pour réduire les risques d''effets secondaires digestifs.', 0.88, false, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440006', 'aef60b40-2cf8-45ea-b301-c3a91f4c2eb5', 'dosage', 'Quelle est la dose recommandée de paracétamol pour un adulte ?', 'Pour un adulte, la dose recommandée de paracétamol est de 500mg à 1000mg toutes les 4-6 heures, sans dépasser 4g par jour. Pour les douleurs intenses, consultez un médecin.', 0.92, true, NOW(), NOW());

-- 8. Reservations (uniquement pour l'utilisateur réel)
INSERT INTO public.reservations (id, user_id, pharmacy_id, drug_id, quantity, status, pickup_date, notes, created_at, updated_at)
VALUES
    ('550e8400-e29b-41d4-a716-446655440008', 'aef60b40-2cf8-45ea-b301-c3a91f4c2eb5', '90d38d9c-29ef-4d07-bde0-50f09f54a286', '7d34555e-b85b-4d46-9639-172dca1c4eac', 2, 'confirmed', NOW() + INTERVAL '1 day', 'À récupérer demain matin entre 9h et 12h', NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440009', 'aef60b40-2cf8-45ea-b301-c3a91f4c2eb5', '90d38d9c-29ef-4d07-bde0-50f09f54a286', '4c807a61-8e12-41c5-9488-7e9b0ca39a1d', 1, 'pending', NOW() + INTERVAL '2 days', 'Pour douleur musculaire, besoin d''une boîte', NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440011', 'aef60b40-2cf8-45ea-b301-c3a91f4c2eb5', '65a0b05c-d2ff-4df7-bf9f-b3377f5aec14', 'c62c0408-9431-4bc6-9bcc-06bb7ab38ba0', 3, 'cancelled', NOW() + INTERVAL '1 day', 'Annulé, trouvé autre pharmacie', NOW(), NOW());

-- 9. Payments (uniquement pour l'utilisateur réel)
INSERT INTO public.payments (id, user_id, reservation_id, pharmacy_id, amount, payment_method, status, payment_date, transaction_id, created_at, updated_at)
VALUES
    ('550e8400-e29b-41d4-a716-446655440012', 'aef60b40-2cf8-45ea-b301-c3a91f4c2eb5', NULL, '90d38d9c-29ef-4d07-bde0-50f09f54a286', 1000.00, 'orange_money', 'completed', NOW(), 'OM_20250924_001', NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440013', 'aef60b40-2cf8-45ea-b301-c3a91f4c2eb5', NULL, '90d38d9c-29ef-4d07-bde0-50f09f54a286', 750.00, 'mtn', 'pending', NULL, 'MTN_20250924_002', NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440015', 'aef60b40-2cf8-45ea-b301-c3a91f4c2eb5', NULL, '65a0b05c-d2ff-4df7-bf9f-b3377f5aec14', 500.00, 'orange_money', 'failed', NOW(), 'OM_20250924_004', NOW(), NOW());

-- 10. Sync logs
INSERT INTO public.sync_logs (id, pharmacy_id, sync_type, status, items_synced, error_message, sync_duration, created_at)
VALUES
    ('550e8400-e29b-41d4-a716-446655440016', '90d38d9c-29ef-4d07-bde0-50f09f54a286', 'full', 'completed', 150, NULL, 45, NOW()),
    ('550e8400-e29b-41d4-a716-446655440017', '90d38d9c-29ef-4d07-bde0-50f09f54a286', 'incremental', 'completed', 5, NULL, 8, NOW()),
    ('550e8400-e29b-41d4-a716-446655440018', '90d38d9c-29ef-4d07-bde0-50f09f54a286', 'manual', 'completed', 12, NULL, 15, NOW()),
    ('550e8400-e29b-41d4-a716-446655440019', '65a0b05c-d2ff-4df7-bf9f-b3377f5aec14', 'full', 'completed', 200, NULL, 52, NOW()),
    ('550e8400-e29b-41d4-a716-446655440020', '65a0b05c-d2ff-4df7-bf9f-b3377f5aec14', 'incremental', 'failed', 0, 'Erreur de connexion à la base de données', 0, NOW()),
    ('550e8400-e29b-41d4-a716-446655440021', 'c8211b2a-cbf8-40cb-9b97-bb84e81deead', 'full', 'completed', 180, NULL, 38, NOW());

-- Vérification des données
SELECT
    'users' as table_name, COUNT(*) as record_count FROM public.users UNION ALL
SELECT 'pharmacies', COUNT(*) FROM public.pharmacies UNION ALL
SELECT 'drugs', COUNT(*) FROM public.drugs UNION ALL
SELECT 'pharmacy_stocks', COUNT(*) FROM public.pharmacy_stocks UNION ALL
SELECT 'drug_interactions', COUNT(*) FROM public.drug_interactions UNION ALL
SELECT 'reviews', COUNT(*) FROM public.reviews UNION ALL
SELECT 'health_assistant_conversations', COUNT(*) FROM public.health_assistant_conversations UNION ALL
SELECT 'reservations', COUNT(*) FROM public.reservations UNION ALL
SELECT 'payments', COUNT(*) FROM public.payments UNION ALL
SELECT 'sync_logs', COUNT(*) FROM public.sync_logs;