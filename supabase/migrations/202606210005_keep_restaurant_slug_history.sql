create table public.restaurant_slug_aliases (
  slug text primary key,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint restaurant_slug_aliases_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

alter table public.restaurant_slug_aliases enable row level security;

create or replace function public.publish_restaurant(requested_slug text)
returns table (id uuid, name text, slug text, logo_key text, published_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid;
  previous_slug text;
  base_slug text;
  candidate text;
  suffix integer := 1;
begin
  select restaurants.id, restaurants.slug
  into target_id, previous_slug
  from public.restaurants
  where restaurants.owner_id = (select auth.uid());

  if target_id is null then
    raise exception 'Restaurant not found';
  end if;

  base_slug := trim(both '-' from regexp_replace(lower(requested_slug), '[^a-z0-9]+', '-', 'g'));
  if base_slug = '' or base_slug is null then
    base_slug := 'cardapio';
  end if;

  delete from public.restaurant_slug_aliases
  where restaurant_slug_aliases.restaurant_id = target_id
    and restaurant_slug_aliases.slug = base_slug;

  candidate := base_slug;
  while exists (
    select 1 from public.restaurants
    where restaurants.slug = candidate
      and restaurants.id <> target_id
  ) or exists (
    select 1 from public.restaurant_slug_aliases
    where restaurant_slug_aliases.slug = candidate
      and restaurant_slug_aliases.restaurant_id <> target_id
  ) loop
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix;
  end loop;

  if previous_slug is not null and previous_slug <> candidate then
    insert into public.restaurant_slug_aliases (slug, restaurant_id)
    values (previous_slug, target_id)
    on conflict (slug) do nothing;
  end if;

  update public.restaurants
  set slug = candidate,
      published_at = coalesce(restaurants.published_at, now())
  where restaurants.id = target_id;

  return query
  select restaurants.id, restaurants.name, restaurants.slug, restaurants.logo_key, restaurants.published_at
  from public.restaurants
  where restaurants.id = target_id;
end;
$$;

revoke all on function public.publish_restaurant(text) from public;
grant execute on function public.publish_restaurant(text) to authenticated;

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
  from selected_restaurant as restaurant;
$$;

revoke all on function public.get_public_menu(text) from public;
grant execute on function public.get_public_menu(text) to anon, authenticated;
