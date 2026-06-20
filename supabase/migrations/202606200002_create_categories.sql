create table public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 60),
  position integer not null default 0 check (position >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index categories_restaurant_name_unique
on public.categories (restaurant_id, lower(name));

create index categories_restaurant_position_idx
on public.categories (restaurant_id, position);

alter table public.categories enable row level security;

create policy "Owners can read their categories"
on public.categories for select
to authenticated
using (
  exists (
    select 1 from public.restaurants
    where restaurants.id = categories.restaurant_id
      and restaurants.owner_id = (select auth.uid())
  )
);

create policy "Owners can create their categories"
on public.categories for insert
to authenticated
with check (
  exists (
    select 1 from public.restaurants
    where restaurants.id = categories.restaurant_id
      and restaurants.owner_id = (select auth.uid())
  )
);

create policy "Owners can update their categories"
on public.categories for update
to authenticated
using (
  exists (
    select 1 from public.restaurants
    where restaurants.id = categories.restaurant_id
      and restaurants.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.restaurants
    where restaurants.id = categories.restaurant_id
      and restaurants.owner_id = (select auth.uid())
  )
);

create policy "Owners can delete their categories"
on public.categories for delete
to authenticated
using (
  exists (
    select 1 from public.restaurants
    where restaurants.id = categories.restaurant_id
      and restaurants.owner_id = (select auth.uid())
  )
);

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();
