-- Pharmaci — buckets Storage (remplace les images en base64 dans la DB)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('pharmacy-photos', 'pharmacy-photos', true, 4194304, array['image/jpeg', 'image/png', 'image/webp']);

-- Policies : lecture publique sur les deux buckets, écriture réservée au
-- propriétaire (avatars : le patient/pharmacien lui-même ; pharmacy-photos :
-- le pharmacien propriétaire de la pharmacie concernée).
--
-- Convention de chemin attendue côté client :
--   avatars/<user_id>/<fichier>
--   pharmacy-photos/<pharmacy_id>/<fichier>

create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_owner_write"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pharmacy_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'pharmacy-photos');

create policy "pharmacy_photos_owner_write"
  on storage.objects for insert
  with check (
    bucket_id = 'pharmacy-photos'
    and exists (
      select 1 from public.pharmacies p
      where p.id::text = (storage.foldername(name))[1]
        and p.owner_id = auth.uid()
    )
  );

create policy "pharmacy_photos_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'pharmacy-photos'
    and exists (
      select 1 from public.pharmacies p
      where p.id::text = (storage.foldername(name))[1]
        and p.owner_id = auth.uid()
    )
  );

create policy "pharmacy_photos_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'pharmacy-photos'
    and exists (
      select 1 from public.pharmacies p
      where p.id::text = (storage.foldername(name))[1]
        and p.owner_id = auth.uid()
    )
  );
