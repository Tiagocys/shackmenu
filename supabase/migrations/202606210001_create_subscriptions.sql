create table public.subscriptions (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  status text not null default 'inactive',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can read their subscription"
on public.subscriptions for select
to authenticated
using ((select auth.uid()) = owner_id);

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create or replace function public.get_plan_usage()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with account as (
    select
      restaurant.id as restaurant_id,
      exists (
        select 1
        from public.subscriptions as subscription
        where subscription.owner_id = (select auth.uid())
          and subscription.status in ('active', 'trialing')
      ) as is_pro
    from public.restaurants as restaurant
    where restaurant.owner_id = (select auth.uid())
  )
  select jsonb_build_object(
    'plan', case when account.is_pro then 'pro' else 'free' end,
    'product_count', (
      select count(*) from public.products
      where products.restaurant_id = account.restaurant_id
    ),
    'product_limit', case when account.is_pro then 200 else 10 end
  )
  from account;
$$;

revoke all on function public.get_plan_usage() from public;
grant execute on function public.get_plan_usage() to authenticated;

create or replace function public.enforce_product_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  restaurant_owner uuid;
  current_count integer;
  product_limit integer;
begin
  select restaurants.owner_id
  into restaurant_owner
  from public.restaurants
  where restaurants.id = new.restaurant_id;

  if restaurant_owner is null or restaurant_owner <> (select auth.uid()) then
    raise exception 'RESTAURANT_ACCESS_DENIED';
  end if;

  select case
    when exists (
      select 1 from public.subscriptions
      where subscriptions.owner_id = restaurant_owner
        and subscriptions.status in ('active', 'trialing')
    ) then 200
    else 10
  end into product_limit;

  select count(*)
  into current_count
  from public.products
  where products.restaurant_id = new.restaurant_id;

  if current_count >= product_limit then
    raise exception 'PRODUCT_LIMIT_REACHED';
  end if;

  return new;
end;
$$;

create trigger products_enforce_plan_limit
before insert on public.products
for each row execute function public.enforce_product_limit();

create or replace function public.get_public_menu(menu_slug text)
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
      'whatsapp_number', restaurant.whatsapp_number,
      'is_pro', exists (
        select 1 from public.subscriptions
        where subscriptions.owner_id = restaurant.owner_id
          and subscriptions.status in ('active', 'trialing')
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
  where restaurant.slug = menu_slug
    and restaurant.published_at is not null;
$$;

revoke all on function public.get_public_menu(text) from public;
grant execute on function public.get_public_menu(text) to anon, authenticated;
