-- Pharmaci — helpers, trigger de création de profil, et policies RLS.
--
-- Chaque table a déjà `enable row level security` depuis la migration
-- initiale (deny-by-default). Ce fichier ajoute les policies explicites —
-- et, pour les écritures qui doivent rester atomiques (passer une commande,
-- l'annuler), on ne crée volontairement AUCUNE policy INSERT/UPDATE côté
-- client : ces opérations passent par des fonctions RPC `security definer`
-- (place_order, cancel_order — cf. migration suivante), qui contournent RLS
-- sous contrôle du code serveur plutôt que de la policy.

-- ---------- Helpers ----------

-- Rôle de l'utilisateur courant. security definer + search_path fixe pour
-- échapper à la RLS de `profiles` lui-même (sinon boucle infinie) tout en
-- restant un simple lookup sur la clé primaire (bon marché).
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'ADMIN';
$$;

create or replace function public.owns_pharmacy(target_pharmacy_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pharmacies
    where id = target_pharmacy_id and owner_id = auth.uid()
  );
$$;

-- ---------- Création automatique du profil à l'inscription ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'PATIENT'),
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Seul un admin peut faire basculer la vérification d'une pharmacie — même
-- si un pharmacien a le droit de modifier sa propre pharmacie par ailleurs,
-- RLS ne fait pas de contrôle colonne par colonne : ce trigger comble le trou.
create or replace function public.prevent_self_verification()
returns trigger
language plpgsql
as $$
begin
  if new.is_verified is distinct from old.is_verified and not public.is_admin() then
    raise exception 'Seul un administrateur peut modifier la vérification d''une pharmacie';
  end if;
  return new;
end;
$$;

create trigger pharmacies_prevent_self_verification
  before update on public.pharmacies
  for each row execute function public.prevent_self_verification();

-- ==================== profiles ====================

create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true); -- noms/emails déjà visibles entre rôles dans l'app actuelle
                -- (ex: le pharmacien voit le nom/téléphone du patient sur une
                -- commande, l'admin voit l'email du propriétaire d'une pharmacie)

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Pas de policy insert/delete : les profils sont créés par le trigger
-- on_auth_user_created et supprimés/anonymisés via la fonction
-- deactivate_user (security definer, cf. migration suivante).

-- ==================== pharmacies ====================

create policy "pharmacies_select_public"
  on public.pharmacies for select
  to anon, authenticated
  using (true); -- recherche de pharmacies accessible en mode invité

create policy "pharmacies_insert_own"
  on public.pharmacies for insert
  to authenticated
  with check (owner_id = auth.uid() and public.current_user_role() = 'PHARMACIST');

create policy "pharmacies_update_own_or_admin"
  on public.pharmacies for update
  to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

-- ==================== medications ====================

create policy "medications_select_public"
  on public.medications for select
  to anon, authenticated
  using (true);

create policy "medications_write_admin"
  on public.medications for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ==================== pharmacy_stock ====================

create policy "pharmacy_stock_select_public"
  on public.pharmacy_stock for select
  to anon, authenticated
  using (true); -- comparaison de prix/stock entre pharmacies, sans connexion

create policy "pharmacy_stock_write_owner_or_admin"
  on public.pharmacy_stock for all
  to authenticated
  using (public.owns_pharmacy(pharmacy_id) or public.is_admin())
  with check (public.owns_pharmacy(pharmacy_id) or public.is_admin());

-- ==================== orders ====================
-- Pas de policy INSERT : la création passe exclusivement par la fonction
-- place_order() (décrément de stock atomique). Idem pour l'annulation, via
-- cancel_order() plutôt qu'un UPDATE direct du statut CANCELLED.

create policy "orders_select_involved"
  on public.orders for select
  to authenticated
  using (
    patient_id = auth.uid()
    or public.owns_pharmacy(pharmacy_id)
    or public.is_admin()
  );

-- Progression de statut (PENDING → CONFIRMED → READY → PICKED_UP) : pas
-- d'impact sur le stock, autorisée en direct pour le pharmacien concerné.
-- CANCELLED reste bloqué ici (restauration de stock → cancel_order()).
create policy "orders_update_status_owner"
  on public.orders for update
  to authenticated
  using (public.owns_pharmacy(pharmacy_id) or public.is_admin())
  with check (
    (public.owns_pharmacy(pharmacy_id) or public.is_admin())
    and status <> 'CANCELLED'
  );

-- ==================== order_items ====================

create policy "order_items_select_involved"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.patient_id = auth.uid() or public.owns_pharmacy(o.pharmacy_id) or public.is_admin())
    )
  );
-- Pas de policy insert/update/delete : gérées par place_order()/cancel_order().

-- ==================== reviews ====================

create policy "reviews_select_public"
  on public.reviews for select
  to anon, authenticated
  using (true);

create policy "reviews_insert_own"
  on public.reviews for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "reviews_update_delete_own_or_admin"
  on public.reviews for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "reviews_delete_own_or_admin"
  on public.reviews for delete
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ==================== favorites ====================

create policy "favorites_select_own"
  on public.favorites for select
  to authenticated
  using (user_id = auth.uid());

create policy "favorites_insert_own"
  on public.favorites for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "favorites_delete_own"
  on public.favorites for delete
  to authenticated
  using (user_id = auth.uid());

-- ==================== messages ====================

create policy "messages_select_involved"
  on public.messages for select
  to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

create policy "messages_insert_own"
  on public.messages for insert
  to authenticated
  with check (sender_id = auth.uid());

-- Le destinataire peut marquer un message comme lu (is_read) ; il ne peut
-- pas modifier son contenu — appliqué par le client (ne PATCH que is_read),
-- une contrainte stricte colonne-par-colonne nécessiterait un trigger dédié.
create policy "messages_update_read_receiver"
  on public.messages for update
  to authenticated
  using (receiver_id = auth.uid())
  with check (receiver_id = auth.uid());

-- ==================== stock_history ====================

create policy "stock_history_select_owner_or_admin"
  on public.stock_history for select
  to authenticated
  using (public.owns_pharmacy(pharmacy_id) or public.is_admin());

create policy "stock_history_insert_owner_or_admin"
  on public.stock_history for insert
  to authenticated
  with check (public.owns_pharmacy(pharmacy_id) or public.is_admin());
