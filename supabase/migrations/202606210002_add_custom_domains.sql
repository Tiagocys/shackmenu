alter table public.restaurants
add column custom_domain text unique;

alter table public.restaurants
add constraint restaurants_custom_domain_format
check (
  custom_domain is null
  or (
    custom_domain = lower(custom_domain)
    and char_length(custom_domain) <= 253
    and custom_domain ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'
  )
);

create or replace function public.enforce_custom_domain_plan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.custom_domain is not null
    and new.custom_domain is distinct from old.custom_domain
    and not exists (
      select 1
      from public.subscriptions
      where subscriptions.owner_id = new.owner_id
        and subscriptions.status in ('active', 'trialing')
    )
  then
    raise exception 'CUSTOM_DOMAIN_REQUIRES_PRO';
  end if;

  return new;
end;
$$;

create trigger restaurants_enforce_custom_domain_plan
before update of custom_domain on public.restaurants
for each row execute function public.enforce_custom_domain_plan();

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
      'whatsapp_number', restaurant.whatsapp_number,
      'is_pro', true
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
