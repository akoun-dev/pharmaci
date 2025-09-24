-- Insertion complète des données de seed pour toutes les tables vides
-- Utilisation des UUIDs existants pour garantir la cohérence

-- 1. Insertion dans la table users (profils utilisateurs)
-- Utilisateur existant dans auth.users
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

-- Utilisateurs de démonstration
INSERT INTO public.users (id, email, first_name, last_name, phone, role, created_at, updated_at)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'patient@pharmaci.dev', 'Patient', 'Demo', '+22501020304', 'patient', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000002', 'pharmacist@pharmaci.dev', 'Pharmacist', 'Demo', '+22505060708', 'pharmacist', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000003', 'admin@pharmaci.dev', 'Admin', 'User', '+22509080706', 'admin', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;

-- 2. Insertion dans la table drug_interactions
-- ID des médicaments existants :
-- Paracétamol: 7d34555e-b85b-4d46-9639-172dca1c4eac
-- Ibuprofène: 4c807a61-8e12-41c5-9488-7e9b0ca39a1d
-- Amoxicilline: 3c146094-d7d2-410e-a58a-888b1ee102ec
-- Aspirine: d2f930f4-36ee-496a-a27f-17f48a104e48
-- Lisinopril: 6be6ced3-bb3c-4a3d-bd20-35d634237a4f

INSERT INTO public.drug_interactions (drug_id_1, drug_id_2, severity, description)
VALUES
    ('4c807a61-8e12-41c5-9488-7e9b0ca39a1d', 'd2f930f4-36ee-496a-a27f-17f48a104e48', 'moderate', 'Augmentation du risque d''effets indésirables gastro-intestinaux'),
    ('3c146094-d7d2-410e-a58a-888b1ee102ec', '6be6ced3-bb3c-4a3d-bd20-35d634237a4f', 'severe', 'Augmentation de la toxicité du médicament'),
    ('7d34555e-b85b-4d46-9639-172dca1c4eac', '4c807a61-8e12-41c5-9488-7e9b0ca39a1d', 'mild', 'Association possible avec surveillance'),
    ('8691c56e-2fcb-46e8-97e4-5b083781c562', '7d34555e-b85b-4d46-9639-172dca1c4eac', 'moderate', 'Potentialisation des effets sédatifs')
ON CONFLICT (drug_id_1, drug_id_2) DO UPDATE SET
    severity = EXCLUDED.severity,
    description = EXCLUDED.description;

-- 3. Insertion dans la table reviews
-- ID de la pharmacie: 90d38d9c-29ef-4d07-bde0-50f09f54a286 (Pharmacie de la Paix)

INSERT INTO public.reviews (user_id, pharmacy_id, drug_id, review_type, rating, title, comment, pros, cons, is_verified, created_at, updated_at)
VALUES
    ('aef60b40-2cf8-45ea-b301-c3a91f4c2eb5', '90d38d9c-29ef-4d07-bde0-50f09f54a286', '7d34555e-b85b-4d46-9639-172dca1c4eac', 'pharmacy', 5, 'Excellent service', 'Pharmacie très professionnelle avec un personnel accueillant', ARRAY['Personnel professionnel', 'Horaires pratiques', 'Propreté'], ARRAY['Peut être un peu cher', 'Attente parfois longue'], true, NOW(), NOW()),
    ('aef60b40-2cf8-45ea-b301-c3a91f4c2eb5', '90d38d9c-29ef-4d07-bde0-50f09f54a286', '7d34555e-b85b-4d46-9639-172dca1c4eac', 'drug', 4, 'Produit efficace', 'Le paracétamol est efficace et le prix est raisonnable', ARRAY['Efficace', 'Bonne valeur', 'Disponible'], ARRAY['Emballage difficile à ouvrir'], true, NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000001', '90d38d9c-29ef-4d07-bde0-50f09f54a286', '4c807a61-8e12-41c5-9488-7e9b0ca39a1d', 'drug', 3, 'Correct', 'L''ibuprofène fonctionne bien mais peut causer des maux d''estomac', ARRAY['Efficace contre la douleur', 'Action rapide'], ARRAY['Effets secondaires digestifs', 'Prendre avec nourriture'], false, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    pharmacy_id = EXCLUDED.pharmacy_id,
    drug_id = EXCLUDED.drug_id,
    review_type = EXCLUDED.review_type,
    rating = EXCLUDED.rating,
    title = EXCLUDED.title,
    comment = EXCLUDED.comment,
    pros = EXCLUDED.pros,
    cons = EXCLUDED.cons,
    is_verified = EXCLUDED.is_verified,
    updated_at = EXCLUDED.updated_at;

-- 4. Insertion dans la table health_assistant_conversations
INSERT INTO public.health_assistant_conversations (user_id, query_type, query_text, response_text, confidence_score, is_saved, created_at, updated_at)
VALUES
    ('aef60b40-2cf8-45ea-b301-c3a91f4c2eb5', 'drug_info', 'Quelles sont les effets secondaires du paracétamol ?', 'Le paracétamol est généralement bien toléré. Les effets secondaires rares incluent des réactions allergiques, des éruptions cutanées et des problèmes hépatiques à doses élevées. Ne dépassez pas la dose recommandée de 4g par jour.', 0.95, true, NOW(), NOW()),
    ('aef60b40-2cf8-45ea-b301-c3a91f4c2eb5', 'symptoms', 'J''ai mal à la tête et de la fièvre, que faire ?', 'Pour des maux de tête et de la fièvre, vous pouvez prendre du paracétamol (500-1000mg) toutes les 4-6 heures sans dépasser 4g par jour. Consultez un médecin si les symptômes persistent plus de 3 jours ou s''ils s''aggravent.', 0.90, true, NOW(), NOW()),
    ('aef60b40-2cf8-45ea-b301-c3a91f4c2eb5', 'interaction', 'Puis-je prendre de l''ibuprofène avec de l''amoxicilline ?', 'Oui, l''ibuprofène peut généralement être pris avec de l''amoxicilline. Il n''y a pas d''interaction majeure connue entre ces deux médicaments. Prenez-les avec de la nourriture pour réduire les risques d''effets secondaires digestifs.', 0.88, false, NOW(), NOW()),
    ('aef60b40-2cf8-45ea-b301-c3a91f4c2eb5', 'dosage', 'Quelle est la dose recommandée de paracétamol pour un adulte ?', 'Pour un adulte, la dose recommandée de paracétamol est de 500mg à 1000mg toutes les 4-6 heures, sans dépasser 4g par jour. Pour les douleurs intenses, consultez un médecin.', 0.92, true, NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000001', 'general', 'Comment conserver les médicaments ?', 'Conservez les médicaments dans un endroit sec, à l''abri de la lumière et de la chaleur, et hors de portée des enfants. Ne les stockez pas dans la salle de bain à cause de l''humidité.', 0.85, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    query_type = EXCLUDED.query_type,
    query_text = EXCLUDED.query_text,
    response_text = EXCLUDED.response_text,
    confidence_score = EXCLUDED.confidence_score,
    is_saved = EXCLUDED.is_saved,
    updated_at = EXCLUDED.updated_at;

-- 5. Insertion dans la table reservations
INSERT INTO public.reservations (user_id, pharmacy_id, drug_id, quantity, status, pickup_date, notes, created_at, updated_at)
VALUES
    ('aef60b40-2cf8-45ea-b301-c3a91f4c2eb5', '90d38d9c-29ef-4d07-bde0-50f09f54a286', '7d34555e-b85b-4d46-9639-172dca1c4eac', 2, 'confirmed', NOW() + INTERVAL '1 day', 'À récupérer demain matin entre 9h et 12h', NOW(), NOW()),
    ('aef60b40-2cf8-45ea-b301-c3a91f4c2eb5', '90d38d9c-29ef-4d07-bde0-50f09f54a286', '4c807a61-8e12-41c5-9488-7e9b0ca39a1d', 1, 'pending', NOW() + INTERVAL '2 days', 'Pour douleur musculaire, besoin d''une boîte', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000001', '90d38d9c-29ef-4d07-bde0-50f09f54a286', '3c146094-d7d2-410e-a58a-888b1ee102ec', 1, 'confirmed', NOW() + INTERVAL '3 days', 'Antibiotique sur ordonnance du Dr. Konan', NOW(), NOW()),
    ('aef60b40-2cf8-45ea-b301-c3a91f4c2eb5', '65a0b05c-d2ff-4df7-bf9f-b3377f5aec14', 'c62c0408-9431-4bc6-9bcc-06bb7ab38ba0', 3, 'cancelled', NOW() + INTERVAL '1 day', 'Annulé, trouvé autre pharmacie', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    pharmacy_id = EXCLUDED.pharmacy_id,
    drug_id = EXCLUDED.drug_id,
    quantity = EXCLUDED.quantity,
    status = EXCLUDED.status,
    pickup_date = EXCLUDED.pickup_date,
    notes = EXCLUDED.notes,
    updated_at = EXCLUDED.updated_at;

-- 6. Insertion dans la table payments
INSERT INTO public.payments (user_id, reservation_id, pharmacy_id, amount, payment_method, status, payment_date, transaction_id, created_at, updated_at)
VALUES
    ('aef60b40-2cf8-45ea-b301-c3a91f4c2eb5', NULL, '90d38d9c-29ef-4d07-bde0-50f09f54a286', 1000.00, 'orange_money', 'completed', NOW(), 'OM_20250924_001', NOW(), NOW()),
    ('aef60b40-2cf8-45ea-b301-c3a91f4c2eb5', NULL, '90d38d9c-29ef-4d07-bde0-50f09f54a286', 750.00, 'mtn', 'pending', NULL, 'MTN_20250924_002', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000001', NULL, '90d38d9c-29ef-4d07-bde0-50f09f54a286', 1200.00, 'wave', 'completed', NOW(), 'WAVE_20250924_003', NOW(), NOW()),
    ('aef60b40-2cf8-45ea-b301-c3a91f4c2eb5', NULL, '65a0b05c-d2ff-4df7-bf9f-b3377f5aec14', 500.00, 'orange_money', 'failed', NOW(), 'OM_20250924_004', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    reservation_id = EXCLUDED.reservation_id,
    pharmacy_id = EXCLUDED.pharmacy_id,
    amount = EXCLUDED.amount,
    payment_method = EXCLUDED.payment_method,
    status = EXCLUDED.status,
    payment_date = EXCLUDED.payment_date,
    transaction_id = EXCLUDED.transaction_id,
    updated_at = EXCLUDED.updated_at;

-- 7. Insertion dans la table sync_logs
INSERT INTO public.sync_logs (pharmacy_id, sync_type, status, items_synced, error_message, sync_duration, created_at)
VALUES
    ('90d38d9c-29ef-4d07-bde0-50f09f54a286', 'full', 'completed', 150, NULL, 45, NOW()),
    ('90d38d9c-29ef-4d07-bde0-50f09f54a286', 'incremental', 'completed', 5, NULL, 8, NOW()),
    ('90d38d9c-29ef-4d07-bde0-50f09f54a286', 'manual', 'completed', 12, NULL, 15, NOW()),
    ('65a0b05c-d2ff-4df7-bf9f-b3377f5aec14', 'full', 'completed', 200, NULL, 52, NOW()),
    ('65a0b05c-d2ff-4df7-bf9f-b3377f5aec14', 'incremental', 'failed', 0, 'Erreur de connexion à la base de données', 0, NOW()),
    ('c8211b2a-cbf8-40cb-9b97-bb84e81deead', 'full', 'completed', 180, NULL, 38, NOW())
ON CONFLICT (id) DO UPDATE SET
    pharmacy_id = EXCLUDED.pharmacy_id,
    sync_type = EXCLUDED.sync_type,
    status = EXCLUDED.status,
    items_synced = EXCLUDED.items_synced,
    error_message = EXCLUDED.error_message,
    sync_duration = EXCLUDED.sync_duration,
    created_at = EXCLUDED.created_at;

-- Vérification des insertions
SELECT 'users' as table_name, COUNT(*) as record_count FROM public.users
UNION ALL
SELECT 'drug_interactions', COUNT(*) FROM public.drug_interactions
UNION ALL
SELECT 'reviews', COUNT(*) FROM public.reviews
UNION ALL
SELECT 'health_assistant_conversations', COUNT(*) FROM public.health_assistant_conversations
UNION ALL
SELECT 'reservations', COUNT(*) FROM public.reservations
UNION ALL
SELECT 'payments', COUNT(*) FROM public.payments
UNION ALL
SELECT 'sync_logs', COUNT(*) FROM public.sync_logs;