alter table public.categories
add constraint categories_id_restaurant_unique unique (id, restaurant_id);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid not null,
  name text not null check (char_length(trim(name)) between 2 and 100),
  description text check (description is null or char_length(description) <= 500),
  price_cents integer not null check (price_cents >= 0),
  image_key text,
  position integer not null default 0 check (position >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_category_restaurant_fk
    foreign key (category_id, restaurant_id)
    references public.categories(id, restaurant_id)
    on delete cascade
);

create index products_restaurant_category_position_idx
on public.products (restaurant_id, category_id, position);

alter table public.products enable row level security;

create policy "Owners can read their products"
on public.products for select
to authenticated
using (
  exists (
    select 1 from public.restaurants
    where restaurants.id = products.restaurant_id
      and restaurants.owner_id = (select auth.uid())
  )
);

create policy "Owners can create their products"
on public.products for insert
to authenticated
with check (
  exists (
    select 1 from public.restaurants
    where restaurants.id = products.restaurant_id
      and restaurants.owner_id = (select auth.uid())
  )
);

create policy "Owners can update their products"
on public.products for update
to authenticated
using (
  exists (
    select 1 from public.restaurants
    where restaurants.id = products.restaurant_id
      and restaurants.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.restaurants
    where restaurants.id = products.restaurant_id
      and restaurants.owner_id = (select auth.uid())
  )
);

create policy "Owners can delete their products"
on public.products for delete
to authenticated
using (
  exists (
    select 1 from public.restaurants
    where restaurants.id = products.restaurant_id
      and restaurants.owner_id = (select auth.uid())
  )
);

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();
