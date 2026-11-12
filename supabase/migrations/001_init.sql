-- 001_init.sql - Perfume Store schema (Supabase/Postgres)
-- Run in Supabase SQL editor. Adjust as needed for your project.

create extension if not exists "pgcrypto";

-- Profiles (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','customer')) default 'customer',
  name text,
  email text,
  phone text,
  address text,
  city text,
  governorate text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Governorate shipping (Egypt)
create table if not exists public.governorate_shipping (
  id bigserial primary key,
  name text not null unique,
  shipping_fee numeric(12,2) not null default 0,
  is_active boolean not null default true
);

-- Products
create table if not exists public.products (
  id bigserial primary key,
  brand text not null,
  name text not null,
  description text,
  fragrance_notes text,
  category text,
  gender text,
  images text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Variants (size/capacity options) - own price/stock/discount
create table if not exists public.product_variants (
  id bigserial primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  size_capacity text not null,
  sku text,
  price numeric(12,2) not null check (price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  discount_type text not null default 'none' check (discount_type in ('none','percentage','fixed')),
  discount_value numeric(12,2) not null default 0 check (discount_value >= 0),
  is_active boolean not null default true
);

-- Orders
create table if not exists public.orders (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
  payment_method text not null check (payment_method in ('cod','vodafone_cash')),
  payment_status text not null default 'pending' check (payment_status in ('pending','awaiting_verification','paid','failed')),
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  customer_address text not null,
  customer_city text not null,
  customer_governorate text not null,
  subtotal numeric(12,2) not null default 0,
  discount_total numeric(12,2) not null default 0,
  shipping_fee numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  vodafone_ref text,
  vodafone_screenshot_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Order items (snapshots)
create table if not exists public.order_items (
  id bigserial primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  product_id bigint,
  variant_id bigint,
  product_name text not null,
  brand text,
  size_capacity text,
  unit_price numeric(12,2) not null,
  discount_type text,
  discount_value numeric(12,2),
  quantity integer not null check (quantity > 0),
  line_total numeric(12,2) not null
);

-- Notifications (in-app)
create table if not exists public.notifications (
  id bigserial primary key,
  target_user_id uuid references auth.users(id) on delete cascade,
  target_role text check (target_role in ('owner','admin','customer')),
  type text not null,
  channel text not null default 'in_app' check (channel in ('in_app','email')),
  title text,
  message text,
  payload jsonb,
  is_read boolean not null default false,
  email_status text, -- null/pending/sent/failed
  created_at timestamptz not null default now()
);

-- Seed Egypt governorates (fees adjustable by admin)
insert into public.governorate_shipping (name, shipping_fee, is_active) values
('Cairo', 50, true), ('Giza', 50, true), ('Alexandria', 60, true), ('Dakahlia', 60, true),
('Red Sea', 80, true), ('Beheira', 60, true), ('Fayoum', 60, true), ('Gharbia', 60, true),
('Ismailia', 70, true), ('Menofia', 60, true), ('Minya', 70, true), ('Qaliubiya', 55, true),
('New Valley', 90, true), ('Suez', 70, true), ('Aswan', 90, true), ('Assiut', 80, true),
('Beni Suef', 70, true), ('Port Said', 70, true), ('Damietta', 65, true), ('Sharkia', 60, true),
('South Sinai', 90, true), ('Kafr El Sheikh', 65, true), ('Matrouh', 90, true), ('Luxor', 90, true),
('Qena', 85, true), ('North Sinai', 90, true), ('Sohag', 85, true)
on conflict (name) do nothing;

-- Helper: is staff (owner/admin)
create or replace function public.is_staff(uid uuid)
returns boolean language sql stable as $$
  select exists(select 1 from public.profiles p where p.id = uid and p.role in ('owner','admin') and p.is_active);
$$;

create or replace function public.is_owner(uid uuid)
returns boolean language sql stable as $$
  select exists(select 1 from public.profiles p where p.id = uid and p.role = 'owner' and p.is_active);
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.governorate_shipping enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.notifications enable row level security;

-- profiles
create policy "profiles self read" on public.profiles for select using (auth.uid() = id or public.is_staff(auth.uid()));
create policy "profiles self update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles owner insert" on public.profiles for insert with check (public.is_owner(auth.uid()) or auth.uid() = id);
create policy "profiles staff update any" on public.profiles for update using (public.is_staff(auth.uid()));

-- governorates: public read active, staff manage
create policy "gov read" on public.governorate_shipping for select using (true);
create policy "gov staff write" on public.governorate_shipping for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- products/variants: public read active, staff manage
create policy "products read" on public.products for select using (is_active or public.is_staff(auth.uid()));
create policy "products staff write" on public.products for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "variants read" on public.product_variants for select using (is_active or public.is_staff(auth.uid()));
create policy "variants staff write" on public.product_variants for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- orders: customer own, staff all
create policy "orders customer read" on public.orders for select using (auth.uid() = user_id or public.is_staff(auth.uid()));
create policy "orders customer insert" on public.orders for insert with check (auth.uid() = user_id);
create policy "orders staff update" on public.orders for update using (public.is_staff(auth.uid()));
-- order items
create policy "items read" on public.order_items for select using (
  exists(select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_staff(auth.uid())))
);
create policy "items insert" on public.order_items for insert with check (
  exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

-- notifications
create policy "notif read own or staff" on public.notifications for select using (
  target_user_id = auth.uid() or (target_role in ('owner','admin') and public.is_staff(auth.uid())) or public.is_staff(auth.uid())
);
create policy "notif insert staff or auth" on public.notifications for insert with check (auth.uid() is not null);
create policy "notif update own" on public.notifications for update using (target_user_id = auth.uid() or public.is_staff(auth.uid()));

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name',''), 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- IMPORTANT: Bootstrap first owner manually after creating the auth user:
-- update public.profiles set role = 'owner' where email = 'owner@example.com';

-- Storage: create a bucket named 'product-images' in Supabase dashboard.
-- Example policies (apply in Storage policies):
--   Public read: (bucket_id = 'product-images')
--   Staff write: (bucket_id = 'product-images' and public.is_staff(auth.uid()))
