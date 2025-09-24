-- Creation de l'utilisateur dans auth.users
-- Cette migration doit etre executee apres la migration complete

-- Insertion dans la table users du schema public
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

-- Note: L'utilisateur doit etre cree manuellement dans le dashboard Supabase
-- avec l'email: aboa.akoun40@gmail.com et le mot de passe: test1234
-- L'ID genere doit correspondre a: aef60b40-2cf8-45ea-b301-c3a91f4c2eb5