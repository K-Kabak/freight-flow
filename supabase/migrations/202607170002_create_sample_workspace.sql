create function public.create_sample_workspace()
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  client_nordic uuid := pg_catalog.gen_random_uuid();
  client_baltic uuid := pg_catalog.gen_random_uuid();
  client_central uuid := pg_catalog.gen_random_uuid();
  client_alpine uuid := pg_catalog.gen_random_uuid();
  carrier_vistula uuid := pg_catalog.gen_random_uuid();
  carrier_baltic uuid := pg_catalog.gen_random_uuid();
  carrier_alpine uuid := pg_catalog.gen_random_uuid();
  carrier_northline uuid := pg_catalog.gen_random_uuid();
begin
  if owner_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(owner_id::text, 0)
  );

  if exists (select 1 from public.clients where user_id = owner_id)
    or exists (select 1 from public.carriers where user_id = owner_id)
    or exists (select 1 from public.shipments where user_id = owner_id)
  then
    raise exception 'sample workspace requires an empty account'
      using errcode = '23514';
  end if;

  update public.profiles
  set full_name = case when full_name = '' then 'Portfolio Reviewer' else full_name end,
      reporting_currency = 'PLN'
  where id = owner_id;

  if not found then
    raise exception 'profile not found' using errcode = '23503';
  end if;

  insert into public.clients
    (id, user_id, company_name, tax_id, contact_person, email, phone)
  values
    (client_nordic, owner_id, 'Nordic Home Retail', 'PL0000000001', 'Anna Nowak', 'operations@nordic-home.example', '+48 500 100 101'),
    (client_baltic, owner_id, 'Baltic Components', 'PL0000000002', 'Marek Zieliński', 'logistics@baltic-components.example', '+48 500 100 102'),
    (client_central, owner_id, 'Central Foods Distribution', 'PL0000000003', 'Julia Wiśniewska', 'transport@central-foods.example', '+48 500 100 103'),
    (client_alpine, owner_id, 'Alpine Pharma Supply', 'PL0000000004', 'Tomasz Lewandowski', 'supply@alpine-pharma.example', '+48 500 100 104');

  insert into public.carriers
    (id, user_id, company_name, country, contact_person, email, phone, vehicle_type, rating)
  values
    (carrier_vistula, owner_id, 'Vistula Transport', 'Poland', 'Piotr Kamiński', 'dispatch@vistula-transport.example', '+48 500 200 201', 'Curtainsider', 5),
    (carrier_baltic, owner_id, 'Baltic Road', 'Lithuania', 'Ewa Dąbrowska', 'dispatch@baltic-road.example', '+370 600 200 202', 'Mega trailer', 4),
    (carrier_alpine, owner_id, 'Alpine Cargo', 'Germany', 'Lukas Weber', 'dispatch@alpine-cargo.example', '+49 151 200 203', 'Refrigerated trailer', 5),
    (carrier_northline, owner_id, 'Northline Logistics', 'Netherlands', 'Sophie de Vries', 'dispatch@northline.example', '+31 6 200 204', 'Box trailer', 4);

  insert into public.shipments
    (user_id, client_id, carrier_id, reference_number, pickup_city, delivery_city, pickup_date, delivery_date, client_price, carrier_cost, additional_costs, currency, exchange_rate_to_base, status, notes)
  values
    (owner_id, client_nordic, carrier_vistula, 'FF-DEMO-001', 'Poznań', 'Hamburg', current_date - 152, current_date - 150, 15000, 11800, 450, 'PLN', 1, 'Delivered', 'Retail replenishment'),
    (owner_id, client_baltic, carrier_baltic, 'FF-DEMO-002', 'Kaunas', 'Wrocław', current_date - 123, current_date - 120, 4200, 3200, 180, 'EUR', 4.30, 'Delivered', 'Automotive components'),
    (owner_id, client_alpine, carrier_alpine, 'FF-DEMO-003', 'Berlin', 'Warsaw', current_date - 93, current_date - 90, 5100, 4050, 120, 'USD', 3.95, 'Delivered', 'Temperature-controlled load'),
    (owner_id, client_central, carrier_vistula, 'FF-DEMO-004', 'Łódź', 'Prague', current_date - 62, current_date - 60, 9800, 7600, 300, 'PLN', 1, 'Delivered', 'Food-grade transport'),
    (owner_id, client_nordic, carrier_northline, 'FF-DEMO-005', 'Rotterdam', 'Gdańsk', current_date - 33, current_date - 30, 3600, 2750, 100, 'EUR', 4.30, 'Delivered', 'Homeware consolidation'),
    (owner_id, client_baltic, carrier_baltic, 'FF-DEMO-006', 'Vilnius', 'Katowice', current_date - 1, current_date + 1, 12500, 9400, 250, 'PLN', 1, 'In Transit', 'Priority production parts'),
    (owner_id, client_alpine, carrier_alpine, 'FF-DEMO-007', 'Munich', 'Kraków', current_date + 1, current_date + 3, 4800, 3700, 160, 'USD', 3.95, 'Accepted', 'Healthcare supplies'),
    (owner_id, client_central, carrier_vistula, 'FF-DEMO-008', 'Warsaw', 'Brno', current_date + 2, current_date + 4, 7600, 5600, 120, 'PLN', 1, 'New', 'Scheduled distribution'),
    (owner_id, client_nordic, carrier_northline, 'FF-DEMO-009', 'Amsterdam', 'Poznań', current_date - 3, current_date, 2900, 2400, 90, 'EUR', 4.30, 'Issue', 'Delivery appointment pending'),
    (owner_id, client_central, carrier_vistula, 'FF-DEMO-010', 'Lublin', 'Ostrava', current_date - 15, current_date - 12, 6900, 5100, 100, 'PLN', 1, 'Cancelled', 'Cancelled before pickup');

  return pg_catalog.jsonb_build_object(
    'clients', 4,
    'carriers', 4,
    'shipments', 10
  );
end;
$$;

comment on function public.create_sample_workspace() is
  'Creates an isolated sample dataset for the authenticated user when their workspace is empty.';

revoke all on function public.create_sample_workspace() from public;
grant execute on function public.create_sample_workspace() to authenticated;
