alter table public.shipments
  add constraint shipments_id_user_id_key unique (id, user_id);

create table public.shipment_status_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  changed_by uuid references public.profiles(id) on delete set null,
  from_status public.shipment_status,
  to_status public.shipment_status not null,
  event_kind text not null check (event_kind in ('created', 'changed', 'baseline')),
  changed_at timestamptz not null default now(),
  constraint shipment_status_events_owner_fkey
    foreign key (shipment_id, user_id)
    references public.shipments(id, user_id)
    on delete cascade,
  constraint shipment_status_events_transition_check
    check (
      (event_kind in ('created', 'baseline') and from_status is null)
      or
      (event_kind = 'changed' and from_status is distinct from to_status)
    )
);

create index shipment_status_events_timeline_idx
  on public.shipment_status_events(shipment_id, changed_at desc, id desc);

alter table public.shipment_status_events enable row level security;

create policy "shipment status events own rows"
on public.shipment_status_events
for select
to authenticated
using ((select auth.uid()) = user_id);

revoke all privileges on table public.shipment_status_events from anon;
revoke all privileges on table public.shipment_status_events from authenticated;
grant select on table public.shipment_status_events to authenticated;

create function public.record_shipment_status_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  event_kind_value text;
  previous_status public.shipment_status;
begin
  if tg_op = 'INSERT' then
    event_kind_value := 'created';
    previous_status := null;
  elsif new.status is distinct from old.status then
    event_kind_value := 'changed';
    previous_status := old.status;
  else
    return new;
  end if;

  insert into public.shipment_status_events (
    shipment_id,
    user_id,
    changed_by,
    from_status,
    to_status,
    event_kind,
    changed_at
  )
  values (
    new.id,
    new.user_id,
    actor_id,
    previous_status,
    new.status,
    event_kind_value,
    case when tg_op = 'INSERT' then new.created_at else now() end
  );

  return new;
end;
$$;

insert into public.shipment_status_events (
  shipment_id,
  user_id,
  changed_by,
  from_status,
  to_status,
  event_kind,
  changed_at
)
select
  id,
  user_id,
  null,
  null,
  status,
  'baseline',
  created_at
from public.shipments;

create trigger shipments_record_status_event
after insert or update of status on public.shipments
for each row execute function public.record_shipment_status_event();

comment on table public.shipment_status_events is
  'Immutable status audit records. user_id is the workspace owner; changed_by is the actor.';
