-- Pharmaci — schéma initial Postgres (remplace Prisma/SQLite)
--
-- Différences volontaires par rapport au schéma Prisma d'origine :
--   * User devient `profiles`, lié 1:1 à `auth.users` (id = uuid Supabase Auth,
--     plus de colonne password — gérée par GoTrue).
--   * `role` (User) et `status` (Order) deviennent des enums Postgres natifs
--     plutôt que des chaînes libres.
--   * `services` et `payments` (Pharmacy) deviennent des `text[]` plutôt que
--     des CSV stockés en texte.
--   * RLS est activé sur chaque table dès sa création (policies définies dans
--     20260904153407_rls_policies.sql) — jamais de fenêtre sans RLS.

-- ---------- Fonction utilitaire : updated_at automatique ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- Enums ----------
create type public.user_role as enum ('PATIENT', 'PHARMACIST', 'ADMIN');
create type public.order_status as enum ('PENDING', 'CONFIRMED', 'READY', 'PICKED_UP', 'CANCELLED');
create type public.stock_change_type as enum ('ADD', 'REMOVE', 'UPDATE');

-- ---------- profiles (remplace User) ----------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null unique,
  phone        text,
  name         text not null,
  role         public.user_role not null default 'PATIENT',
  address      text,
  city         text,
  district     text,
  avatar_url   text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.profiles enable row level security;
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------- pharmacies (remplace Pharmacy) ----------
create table public.pharmacies (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  owner_id      uuid not null unique references public.profiles(id),
  address       text not null,
  city          text not null,
  district      text,
  latitude      double precision not null,
  longitude     double precision not null,
  phone         text not null,
  email         text,
  opening_time  text not null default '08:00',
  closing_time  text not null default '20:00',
  is_open_24h   boolean not null default false,
  is_on_guard   boolean not null default false, -- pharmacie de garde
  is_verified   boolean not null default true,
  image_url     text,
  rating        real not null default 0,
  review_count  integer not null default 0,
  services      text[] not null default '{}', -- ex: {vaccination,conseil,livraison}
  payments      text[] not null default '{}', -- ex: {mobile_money,cash,card}
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.pharmacies enable row level security;
create index pharmacies_owner_id_idx on public.pharmacies(owner_id);
create index pharmacies_city_idx on public.pharmacies(city);
create trigger set_updated_at before update on public.pharmacies
  for each row execute function public.set_updated_at();

-- ---------- medications (remplace Medication) ----------
create table public.medications (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  active_ingredient   text not null,
  category            text not null default 'Autre',
  dosage              text not null,
  form                text not null default 'Comprimé',
  description         text not null default '',
  prescription_required boolean not null default false,
  image_url           text,
  side_effects        text not null default '',
  contraindications   text not null default '',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
alter table public.medications enable row level security;
create index medications_name_idx on public.medications using gin (to_tsvector('french', name));
create index medications_category_idx on public.medications(category);
create trigger set_updated_at before update on public.medications
  for each row execute function public.set_updated_at();

-- ---------- pharmacy_stock (remplace PharmacyMedication) ----------
create table public.pharmacy_stock (
  id                  uuid primary key default gen_random_uuid(),
  pharmacy_id         uuid not null references public.pharmacies(id) on delete cascade,
  medication_id       uuid not null references public.medications(id) on delete cascade,
  price               integer not null, -- FCFA
  stock               integer not null default 0,
  low_stock_threshold integer not null default 10,
  expiry_date         date,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (pharmacy_id, medication_id)
);
alter table public.pharmacy_stock enable row level security;
create index pharmacy_stock_pharmacy_id_idx on public.pharmacy_stock(pharmacy_id);
create index pharmacy_stock_medication_id_idx on public.pharmacy_stock(medication_id);
create trigger set_updated_at before update on public.pharmacy_stock
  for each row execute function public.set_updated_at();

-- ---------- orders (remplace Order) ----------
create table public.orders (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique, -- ex: PHARMACI-ABC123
  patient_id    uuid not null references public.profiles(id),
  pharmacy_id   uuid not null references public.pharmacies(id),
  status        public.order_status not null default 'PENDING',
  total_amount  integer not null, -- FCFA
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.orders enable row level security;
create index orders_patient_id_idx on public.orders(patient_id);
create index orders_pharmacy_id_idx on public.orders(pharmacy_id);
create index orders_status_idx on public.orders(status);
create trigger set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------- order_items (remplace OrderItem) ----------
create table public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders(id) on delete cascade,
  medication_id  uuid not null references public.medications(id),
  quantity       integer not null,
  unit_price     integer not null,
  total_price    integer not null
);
alter table public.order_items enable row level security;
create index order_items_order_id_idx on public.order_items(order_id);

-- ---------- reviews (remplace Review) ----------
create table public.reviews (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id),
  pharmacy_id  uuid not null references public.pharmacies(id) on delete cascade,
  rating       smallint not null check (rating between 1 and 5),
  comment      text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, pharmacy_id)
);
alter table public.reviews enable row level security;
create index reviews_pharmacy_id_idx on public.reviews(pharmacy_id);
create trigger set_updated_at before update on public.reviews
  for each row execute function public.set_updated_at();

-- ---------- favorites (remplace Favorite) ----------
create table public.favorites (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id),
  pharmacy_id  uuid not null references public.pharmacies(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (user_id, pharmacy_id)
);
alter table public.favorites enable row level security;
create index favorites_user_id_idx on public.favorites(user_id);

-- ---------- messages (remplace Message) ----------
create table public.messages (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references public.profiles(id),
  receiver_id  uuid not null references public.profiles(id),
  content      text not null,
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);
alter table public.messages enable row level security;
create index messages_sender_id_idx on public.messages(sender_id);
create index messages_receiver_id_idx on public.messages(receiver_id);
create index messages_conversation_idx on public.messages(least(sender_id, receiver_id), greatest(sender_id, receiver_id), created_at);

-- ---------- stock_history (remplace StockHistory) ----------
create table public.stock_history (
  id             uuid primary key default gen_random_uuid(),
  pharmacy_id    uuid not null references public.pharmacies(id) on delete cascade,
  medication_id  uuid not null references public.medications(id),
  change_type    public.stock_change_type not null,
  quantity       integer not null,
  note           text,
  created_at     timestamptz not null default now()
);
alter table public.stock_history enable row level security;
create index stock_history_pharmacy_id_idx on public.stock_history(pharmacy_id);
