grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.clients to authenticated;
grant select, insert, update, delete on table public.carriers to authenticated;
grant select, insert, update, delete on table public.shipments to authenticated;

revoke all on table public.profiles from anon;
revoke all on table public.clients from anon;
revoke all on table public.carriers from anon;
revoke all on table public.shipments from anon;
