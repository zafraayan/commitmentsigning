create table if not exists public.signatures (
  id uuid primary key default gen_random_uuid(),
  commitment_key text not null,
  commitment text not null,
  signer_name text not null check (char_length(signer_name) between 1 and 150),
  signature_image text not null check (octet_length(signature_image) <= 1000000),
  signed_at timestamptz not null default now()
);

create index if not exists signatures_commitment_signed_at_idx
  on public.signatures (commitment_key, signed_at);

alter table public.signatures enable row level security;

revoke all on table public.signatures from anon, authenticated;
grant select, insert, delete on table public.signatures to anon, authenticated;

drop policy if exists "Public can view event signatures" on public.signatures;
create policy "Public can view event signatures"
  on public.signatures
  for select
  to anon, authenticated
  using (commitment_key = 'talisay-elgu-2026');

drop policy if exists "Public can add event signatures" on public.signatures;
create policy "Public can add event signatures"
  on public.signatures
  for insert
  to anon, authenticated
  with check (commitment_key = 'talisay-elgu-2026');

drop policy if exists "Public can remove event signatures" on public.signatures;
create policy "Public can remove event signatures"
  on public.signatures
  for delete
  to anon, authenticated
  using (commitment_key = 'talisay-elgu-2026');

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'signatures'
  ) then
    alter publication supabase_realtime add table public.signatures;
  end if;
end
$$;
