create extension if not exists "pgcrypto";

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 80),
  slug text unique,
  logo_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.restaurants enable row level security;

create policy "Owners can read their restaurant"
on public.restaurants for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "Owners can create their restaurant"
on public.restaurants for insert
to authenticated
with check ((select auth.uid()) = owner_id);

create policy "Owners can update their restaurant"
on public.restaurants for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "Owners can delete their restaurant"
on public.restaurants for delete
to authenticated
using ((select auth.uid()) = owner_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger restaurants_set_updated_at
before update on public.restaurants
for each row execute function public.set_updated_at();
