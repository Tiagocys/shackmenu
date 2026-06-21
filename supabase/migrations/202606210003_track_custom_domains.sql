alter table public.restaurants
add column custom_domain_status text,
add column cloudflare_custom_hostname_id text unique;

alter table public.restaurants
add constraint restaurants_custom_domain_status
check (custom_domain_status is null or custom_domain_status in ('pending', 'active', 'moved', 'blocked', 'error'));

create or replace function public.protect_custom_domain_state()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce((select auth.jwt() ->> 'role'), '') <> 'service_role' then
    raise exception 'CUSTOM_DOMAIN_STATE_IS_SERVER_MANAGED';
  end if;
  return new;
end;
$$;

create trigger restaurants_protect_custom_domain_state
before update of custom_domain, custom_domain_status, cloudflare_custom_hostname_id on public.restaurants
for each row execute function public.protect_custom_domain_state();

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
