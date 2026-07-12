create extension if not exists pgcrypto;
create type public.shipment_status as enum ('New','Accepted','In Transit','Delivered','Cancelled','Issue');
create type public.currency_code as enum ('PLN','EUR','USD');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null, full_name text not null default '', reporting_currency public.currency_code not null default 'PLN',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.clients (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  company_name text not null, tax_id text not null, contact_person text not null, email text not null, phone text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.carriers (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  company_name text not null, country text not null, contact_person text not null, email text not null, phone text not null,
  vehicle_type text not null, rating integer not null default 5 check (rating between 1 and 5),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.shipments (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict, carrier_id uuid not null references public.carriers(id) on delete restrict,
  reference_number text not null, pickup_city text not null, delivery_city text not null, pickup_date date not null, delivery_date date not null,
  client_price numeric(14,2) not null check(client_price >= 0), carrier_cost numeric(14,2) not null check(carrier_cost >= 0),
  additional_costs numeric(14,2) not null default 0 check(additional_costs >= 0),
  profit numeric(14,2) generated always as (client_price-carrier_cost-additional_costs) stored,
  margin_percent numeric(7,2) generated always as (case when client_price=0 then 0 else round(((client_price-carrier_cost-additional_costs)/client_price)*100,2) end) stored,
  currency public.currency_code not null default 'PLN', exchange_rate_to_base numeric(14,6) not null default 1 check(exchange_rate_to_base > 0),
  status public.shipment_status not null default 'New', notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint delivery_after_pickup check(delivery_date >= pickup_date), unique(user_id, reference_number)
);
create index clients_user_idx on public.clients(user_id); create index carriers_user_idx on public.carriers(user_id);
create index shipments_user_status_idx on public.shipments(user_id,status); create index shipments_user_pickup_idx on public.shipments(user_id,pickup_date desc);
create index shipments_client_idx on public.shipments(client_id); create index shipments_carrier_idx on public.shipments(carrier_id);

create function public.set_updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end $$;
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger clients_updated before update on public.clients for each row execute function public.set_updated_at();
create trigger carriers_updated before update on public.carriers for each row execute function public.set_updated_at();
create trigger shipments_updated before update on public.shipments for each row execute function public.set_updated_at();
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$ begin insert into public.profiles(id,email,full_name) values(new.id,coalesce(new.email,''),coalesce(new.raw_user_meta_data->>'full_name','')); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security; alter table public.clients enable row level security; alter table public.carriers enable row level security; alter table public.shipments enable row level security;
create policy "profiles own rows" on public.profiles for all using(auth.uid()=id) with check(auth.uid()=id);
create policy "clients own rows" on public.clients for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "carriers own rows" on public.carriers for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "shipments own rows" on public.shipments for all using(auth.uid()=user_id) with check(auth.uid()=user_id and exists(select 1 from public.clients c where c.id=client_id and c.user_id=auth.uid()) and exists(select 1 from public.carriers c where c.id=carrier_id and c.user_id=auth.uid()));
