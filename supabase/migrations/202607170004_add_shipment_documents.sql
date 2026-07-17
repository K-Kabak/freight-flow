insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'shipment-documents',
  'shipment-documents',
  false,
  6291456,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table public.shipment_documents (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete restrict,
  storage_path text not null unique,
  original_name text not null check (
    char_length(original_name) between 1 and 255
    and original_name !~ '[\\/]'
  ),
  mime_type text not null check (
    mime_type in ('application/pdf', 'image/jpeg', 'image/png')
  ),
  size_bytes bigint not null check (size_bytes between 1 and 6291456),
  upload_status text not null default 'pending' check (
    upload_status in ('pending', 'ready')
  ),
  created_at timestamptz not null default now(),
  uploaded_at timestamptz
);

create index shipment_documents_shipment_created_idx
  on public.shipment_documents(shipment_id, created_at desc, id desc);

alter table public.shipment_documents enable row level security;

create policy "shipment documents own rows"
on public.shipment_documents
for select
to authenticated
using (
  exists (
    select 1
    from public.shipments
    where shipments.id = shipment_documents.shipment_id
      and shipments.user_id = (select auth.uid())
  )
);

create policy "shipment documents own inserts"
on public.shipment_documents
for insert
to authenticated
with check (
  upload_status = 'pending'
  and uploaded_at is null
  and storage_path = (
    (select auth.uid())::text
    || '/' || shipment_id::text
    || '/' || id::text
  )
  and exists (
    select 1
    from public.shipments
    where shipments.id = shipment_documents.shipment_id
      and shipments.user_id = (select auth.uid())
  )
);

revoke all privileges on table public.shipment_documents from anon;
revoke all privileges on table public.shipment_documents from authenticated;
grant select, insert on table public.shipment_documents to authenticated;

create policy "shipment document object inserts"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'shipment-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.shipment_documents
    join public.shipments
      on shipments.id = shipment_documents.shipment_id
    where shipment_documents.storage_path = storage.objects.name
      and shipment_documents.upload_status = 'pending'
      and shipments.user_id = (select auth.uid())
  )
);

create policy "shipment document object reads"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'shipment-documents'
  and owner_id = (select auth.uid())::text
  and exists (
    select 1
    from public.shipment_documents
    join public.shipments
      on shipments.id = shipment_documents.shipment_id
    where shipment_documents.storage_path = storage.objects.name
      and shipments.user_id = (select auth.uid())
  )
);

create policy "shipment document object deletes"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'shipment-documents'
  and owner_id = (select auth.uid())::text
  and exists (
    select 1
    from public.shipment_documents
    join public.shipments
      on shipments.id = shipment_documents.shipment_id
    where shipment_documents.storage_path = storage.objects.name
      and shipments.user_id = (select auth.uid())
  )
);

create function public.finalize_shipment_document(document_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  document_path text;
begin
  if caller_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select shipment_documents.storage_path
  into document_path
  from public.shipment_documents
  join public.shipments
    on shipments.id = shipment_documents.shipment_id
  where shipment_documents.id = document_id
    and shipment_documents.upload_status = 'pending'
    and shipments.user_id = caller_id
  for update of shipment_documents;

  if not found then
    raise exception 'pending document not found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1
    from storage.objects
    where storage.objects.bucket_id = 'shipment-documents'
      and storage.objects.name = document_path
      and storage.objects.owner_id = caller_id::text
  ) then
    raise exception 'uploaded object not found' using errcode = 'P0002';
  end if;

  update public.shipment_documents
  set upload_status = 'ready',
      uploaded_at = now()
  where id = document_id;
end;
$$;

revoke all on function public.finalize_shipment_document(uuid) from public;
grant execute on function public.finalize_shipment_document(uuid) to authenticated;

create function public.delete_shipment_document_metadata(document_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  document_path text;
begin
  if caller_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select shipment_documents.storage_path
  into document_path
  from public.shipment_documents
  join public.shipments
    on shipments.id = shipment_documents.shipment_id
  where shipment_documents.id = document_id
    and shipments.user_id = caller_id
  for update of shipment_documents;

  if not found then
    raise exception 'document not found' using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from storage.objects
    where storage.objects.bucket_id = 'shipment-documents'
      and storage.objects.name = document_path
  ) then
    raise exception 'stored object must be deleted first' using errcode = '55000';
  end if;

  delete from public.shipment_documents
  where id = document_id;
end;
$$;

revoke all on function public.delete_shipment_document_metadata(uuid) from public;
grant execute on function public.delete_shipment_document_metadata(uuid) to authenticated;

comment on table public.shipment_documents is
  'Private shipment document metadata linked to objects in the shipment-documents bucket.';
