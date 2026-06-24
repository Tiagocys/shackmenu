create table public.restaurant_payment_settings (
  restaurant_id uuid primary key references public.restaurants(id) on delete cascade,
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  stripe_account_id text unique,
  stripe_account_status text not null default 'not_started'
    check (stripe_account_status in ('not_started', 'pending', 'active', 'restricted')),
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  onboarding_required boolean not null default true,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.restaurant_payment_settings enable row level security;

create policy "Owners can read their payment settings"
on public.restaurant_payment_settings for select
to authenticated
using ((select auth.uid()) = owner_id);

create trigger restaurant_payment_settings_set_updated_at
before update on public.restaurant_payment_settings
for each row execute function public.set_updated_at();

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  order_number bigint generated always as identity,
  status text not null default 'awaiting_payment'
    check (status in ('awaiting_payment', 'payment_confirmed', 'payment_failed', 'cancelled')),
  customer_name text not null check (char_length(trim(customer_name)) between 2 and 100),
  customer_email text check (customer_email is null or customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  customer_phone text check (customer_phone is null or customer_phone ~ '^\+?[0-9]{10,15}$'),
  notes text check (notes is null or char_length(notes) <= 500),
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0),
  subtotal_cents integer not null check (subtotal_cents > 0),
  platform_fee_cents integer not null default 0 check (platform_fee_cents >= 0),
  platform_fee_percent integer not null default 0 check (platform_fee_percent between 0 and 100),
  currency text not null default 'brl',
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  stripe_connected_account_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_owner_created_at_idx
on public.orders (owner_id, created_at desc);

create index orders_restaurant_status_created_at_idx
on public.orders (restaurant_id, status, created_at desc);

alter table public.orders enable row level security;

create policy "Owners can read their orders"
on public.orders for select
to authenticated
using ((select auth.uid()) = owner_id);

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create or replace function public.get_public_menu(menu_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with selected_restaurant as (
    select restaurant.*
    from public.restaurants as restaurant
    where restaurant.published_at is not null
      and (
        restaurant.slug = menu_slug
        or restaurant.id = (
          select alias.restaurant_id
          from public.restaurant_slug_aliases as alias
          where alias.slug = menu_slug
        )
      )
    order by (restaurant.slug = menu_slug) desc
    limit 1
  )
  select jsonb_build_object(
    'restaurant', jsonb_build_object(
      'id', restaurant.id,
      'name', restaurant.name,
      'slug', restaurant.slug,
      'logo_key', restaurant.logo_key,
      'background_color', restaurant.background_color,
      'menu_tagline', restaurant.menu_tagline,
      'whatsapp_number', restaurant.whatsapp_number,
      'instagram_username', restaurant.instagram_username,
      'is_pro', exists (
        select 1 from public.subscriptions
        where subscriptions.owner_id = restaurant.owner_id
          and subscriptions.status in ('active', 'trialing')
      ),
      'payment_online_active', exists (
        select 1 from public.restaurant_payment_settings as payment_settings
        where payment_settings.restaurant_id = restaurant.id
          and payment_settings.stripe_account_status = 'active'
          and payment_settings.charges_enabled = true
      )
    ),
    'categories', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', category.id,
          'name', category.name,
          'products', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', product.id,
                'name', product.name,
                'description', product.description,
                'price_cents', product.price_cents,
                'image_key', product.image_key
              ) order by product.position, product.created_at
            )
            from public.products as product
            where product.category_id = category.id
              and product.restaurant_id = restaurant.id
              and product.active = true
          ), '[]'::jsonb)
        ) order by category.position, category.created_at
      )
      from public.categories as category
      where category.restaurant_id = restaurant.id
        and category.active = true
    ), '[]'::jsonb)
  )
  from selected_restaurant as restaurant;
$$;

revoke all on function public.get_public_menu(text) from public;
grant execute on function public.get_public_menu(text) to anon, authenticated;

create or replace function public.get_public_menu_by_domain(menu_domain text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'restaurant', jsonb_build_object(
      'id', restaurant.id,
      'name', restaurant.name,
      'slug', restaurant.slug,
      'logo_key', restaurant.logo_key,
      'background_color', restaurant.background_color,
      'menu_tagline', restaurant.menu_tagline,
      'whatsapp_number', restaurant.whatsapp_number,
      'instagram_username', restaurant.instagram_username,
      'is_pro', true,
      'payment_online_active', exists (
        select 1 from public.restaurant_payment_settings as payment_settings
        where payment_settings.restaurant_id = restaurant.id
          and payment_settings.stripe_account_status = 'active'
          and payment_settings.charges_enabled = true
      )
    ),
    'categories', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', category.id,
          'name', category.name,
          'products', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', product.id,
                'name', product.name,
                'description', product.description,
                'price_cents', product.price_cents,
                'image_key', product.image_key
              ) order by product.position, product.created_at
            )
            from public.products as product
            where product.category_id = category.id
              and product.restaurant_id = restaurant.id
              and product.active = true
          ), '[]'::jsonb)
        ) order by category.position, category.created_at
      )
      from public.categories as category
      where category.restaurant_id = restaurant.id
        and category.active = true
    ), '[]'::jsonb)
  )
  from public.restaurants as restaurant
  where restaurant.custom_domain = lower(menu_domain)
    and restaurant.custom_domain_status = 'active'
    and restaurant.published_at is not null
    and exists (
      select 1
      from public.subscriptions
      where subscriptions.owner_id = restaurant.owner_id
        and subscriptions.status in ('active', 'trialing')
    );
$$;

revoke all on function public.get_public_menu_by_domain(text) from public;
grant execute on function public.get_public_menu_by_domain(text) to anon, authenticated;
