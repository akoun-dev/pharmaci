# Instructions pour l'insertion manuelle des seeds

## Problème
Le processus automatique de seed via `supabase db push --include-seed` ne fonctionne pas correctement. Les tables suivantes restent vides :
- users (public)
- drug_interactions
- reviews
- health_assistant_conversations
- reservations
- payments
- sync_logs

## Solution manuelle

1. **Accéder au dashboard Supabase** :
   - Connectez-vous à votre projet Supabase
   - Allez dans "Table Editor" ou "SQL Editor"

2. **Copier-coller le contenu du fichier SQL** :
   Le fichier `/home/akoun-dev/Documents/PROJETS/PERSO/pharmaci/complete_seed.sql` contient toutes les insertions nécessaires.

3. **Exécuter le SQL manuellement** :
   - Ouvrez l'éditeur SQL dans le dashboard Supabase
   - Copiez tout le contenu du fichier `complete_seed.sql`
   - Exécutez la requête

## Contenu du seed

Le fichier seed insère les données suivantes :

### Table users (4 enregistrements)
- 1 utilisateur réel (aboa.akoun40@gmail.com)
- 3 utilisateurs de démonstration

### Table drug_interactions (4 enregistrements)
- Interactions entre Ibuprofène et Aspirine
- Interactions entre Amoxicilline et Lisinopril
- Autres interactions communes

### Table reviews (3 enregistrements)
- Avis sur les pharmacies et médicaments
- Notes et commentaires détaillés

### Table health_assistant_conversations (5 enregistrements)
- Conversations de démonstration avec l'assistant santé
- Différents types de requêtes (drug_info, symptoms, dosage, etc.)

### Table reservations (4 enregistrements)
- Réservations de médicaments avec différents statuts
- Dates de retrait et notes

### Table payments (4 enregistrements)
- Paiements avec différentes méthodes (Orange Money, MTN, Wave)
- Différents statuts de paiement

### Table sync_logs (6 enregistrements)
- Journaux de synchronisation pour les pharmacies
- Différents types et statuts de synchronisation

## Vérification

Après exécution, vous pouvez vérifier que les tables contiennent des données en exécutant :

```sql
SELECT
    'users' as table_name, COUNT(*) as record_count FROM public.users UNION ALL
SELECT 'drug_interactions', COUNT(*) FROM public.drug_interactions UNION ALL
SELECT 'reviews', COUNT(*) FROM public.reviews UNION ALL
SELECT 'health_assistant_conversations', COUNT(*) FROM public.health_assistant_conversations UNION ALL
SELECT 'reservations', COUNT(*) FROM public.reservations UNION ALL
SELECT 'payments', COUNT(*) FROM public.payments UNION ALL
SELECT 'sync_logs', COUNT(*) FROM public.sync_logs;
```

## Alternative : Script d'insertion directe

Si le dashboard ne fonctionne pas, vous pouvez aussi utiliser l'API REST de Supabase ou un client PostgreSQL direct pour insérer les données.