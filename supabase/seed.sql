-- Portfolio sample data is created per authenticated user through
-- public.create_sample_workspace(). No account credentials or user-specific
-- identifiers belong in this repository-level seed.
do $$
begin
  raise notice 'Global seed complete; sample workspaces are created after sign-in.';
end
$$;
