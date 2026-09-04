-- Pharmaci — fonctions RPC transactionnelles pour les commandes.
--
-- place_order() et cancel_order() sont les deux seuls chemins d'écriture
-- vers `orders`/`order_items`/`pharmacy_stock` : aucune policy RLS
-- INSERT/UPDATE(stock) n'existe côté client pour ces tables (cf. migration
-- de policies) — tout passe par ici, en `security definer`, pour que le
-- décrément de stock et la création de la commande restent atomiques.

create or replace function public.generate_order_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- sans caractères ambigus (I,O,0,1)
  code text := '';
  i integer;
begin
  for i in 1..6 loop
    code := code || substr(chars, (floor(random() * length(chars)) + 1)::int, 1);
  end loop;
  return 'PHARMACI-' || code;
end;
$$;

-- ---------- place_order ----------
-- p_items: [{"medication_id": "...", "quantity": 2}, ...]
create or replace function public.place_order(
  p_pharmacy_id uuid,
  p_items jsonb,
  p_notes text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_code text;
  v_total integer := 0;
  v_item record;
  v_stock public.pharmacy_stock;
  v_line_total integer;
  v_attempt integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'La commande doit contenir au moins un article';
  end if;

  -- Code de commande unique — quelques tentatives en cas de collision rare.
  loop
    v_code := public.generate_order_code();
    v_attempt := v_attempt + 1;
    exit when not exists (select 1 from public.orders where code = v_code) or v_attempt > 10;
  end loop;

  insert into public.orders (code, patient_id, pharmacy_id, status, total_amount, notes)
  values (v_code, auth.uid(), p_pharmacy_id, 'PENDING', 0, p_notes)
  returning * into v_order;

  for v_item in select * from jsonb_to_recordset(p_items) as x(medication_id uuid, quantity integer)
  loop
    if v_item.quantity is null or v_item.quantity <= 0 then
      raise exception 'Quantité invalide pour le médicament %', v_item.medication_id;
    end if;

    -- Verrouille la ligne de stock pour éviter une vente en double sous
    -- concurrence (deux patients qui commandent le dernier exemplaire en
    -- même temps).
    select * into v_stock
    from public.pharmacy_stock
    where pharmacy_id = p_pharmacy_id and medication_id = v_item.medication_id
    for update;

    if not found then
      raise exception 'Médicament % non disponible dans cette pharmacie', v_item.medication_id;
    end if;
    if v_stock.stock < v_item.quantity then
      raise exception 'Stock insuffisant pour le médicament % (disponible: %, demandé: %)',
        v_item.medication_id, v_stock.stock, v_item.quantity;
    end if;

    update public.pharmacy_stock
    set stock = stock - v_item.quantity
    where id = v_stock.id;

    v_line_total := v_stock.price * v_item.quantity;
    v_total := v_total + v_line_total;

    insert into public.order_items (order_id, medication_id, quantity, unit_price, total_price)
    values (v_order.id, v_item.medication_id, v_item.quantity, v_stock.price, v_line_total);

    insert into public.stock_history (pharmacy_id, medication_id, change_type, quantity, note)
    values (p_pharmacy_id, v_item.medication_id, 'REMOVE', v_item.quantity, 'Commande ' || v_code);
  end loop;

  update public.orders set total_amount = v_total where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.place_order(uuid, jsonb, text) from public;
grant execute on function public.place_order(uuid, jsonb, text) to authenticated;

-- ---------- cancel_order ----------
create or replace function public.cancel_order(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_item record;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Commande introuvable';
  end if;

  if not (
    v_order.patient_id = auth.uid()
    or public.owns_pharmacy(v_order.pharmacy_id)
    or public.is_admin()
  ) then
    raise exception 'Non autorisé';
  end if;

  if v_order.status not in ('PENDING', 'CONFIRMED') then
    raise exception 'Cette commande ne peut plus être annulée (statut: %)', v_order.status;
  end if;

  for v_item in select * from public.order_items where order_id = p_order_id
  loop
    update public.pharmacy_stock
    set stock = stock + v_item.quantity
    where pharmacy_id = v_order.pharmacy_id and medication_id = v_item.medication_id;

    insert into public.stock_history (pharmacy_id, medication_id, change_type, quantity, note)
    values (v_order.pharmacy_id, v_item.medication_id, 'ADD', v_item.quantity, 'Annulation ' || v_order.code);
  end loop;

  update public.orders set status = 'CANCELLED' where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.cancel_order(uuid) from public;
grant execute on function public.cancel_order(uuid) to authenticated;

-- ---------- anonymize_profile ----------
-- Appelée par la fonction Edge `deactivate-user` (qui gère en plus la
-- révocation de session et le verrouillage du compte via l'Admin API,
-- hors de portée de SQL pur) — jamais directement par un client.
create or replace function public.anonymize_profile(p_user_id uuid)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pharmacy_name text;
  v_profile public.profiles;
begin
  select p.name into v_pharmacy_name from public.pharmacies p where p.owner_id = p_user_id;
  if v_pharmacy_name is not null then
    raise exception 'Impossible de supprimer ce compte : il possède la pharmacie « % ». Réassignez ou supprimez d''abord cette pharmacie.', v_pharmacy_name;
  end if;

  update public.profiles
  set is_active = false,
      name = 'Compte supprimé',
      phone = null,
      address = null,
      city = null,
      district = null,
      avatar_url = null
  where id = p_user_id
  returning * into v_profile;

  return v_profile;
end;
$$;

revoke all on function public.anonymize_profile(uuid) from public, authenticated, anon;
grant execute on function public.anonymize_profile(uuid) to service_role;
