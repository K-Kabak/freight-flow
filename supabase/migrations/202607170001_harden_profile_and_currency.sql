revoke all privileges on table public.profiles from authenticated;
revoke all privileges on table public.clients from authenticated;
revoke all privileges on table public.carriers from authenticated;
revoke all privileges on table public.shipments from authenticated;

grant select on table public.profiles to authenticated;
grant update(full_name, reporting_currency) on table public.profiles to authenticated;
grant select, insert, update, delete on table public.clients to authenticated;
grant select, insert, update, delete on table public.carriers to authenticated;
grant select, insert, update, delete on table public.shipments to authenticated;

create function public.protect_reporting_currency()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.reporting_currency is distinct from old.reporting_currency
    and exists (
      select 1
      from public.shipments
      where user_id = new.id
    )
  then
    raise exception 'reporting currency cannot change after shipments exist'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger profiles_protect_reporting_currency
before update of reporting_currency on public.profiles
for each row execute function public.protect_reporting_currency();

create function public.validate_shipment_exchange_rate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_currency public.currency_code;
begin
  select reporting_currency
  into base_currency
  from public.profiles
  where id = new.user_id
  for key share;

  if not found then
    raise exception 'shipment owner profile does not exist'
      using errcode = '23503';
  end if;

  if new.currency = base_currency and new.exchange_rate_to_base <> 1 then
    raise exception 'exchange rate must equal 1 for reporting currency shipments'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger shipments_validate_exchange_rate
before insert or update of user_id, currency, exchange_rate_to_base on public.shipments
for each row execute function public.validate_shipment_exchange_rate();
