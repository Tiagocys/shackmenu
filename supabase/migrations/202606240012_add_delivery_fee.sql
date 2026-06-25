alter table public.restaurants
add column if not exists delivery_fee_cents integer not null default 0
check (delivery_fee_cents >= 0);

alter table public.orders
add column if not exists delivery_fee_cents integer not null default 0
check (delivery_fee_cents >= 0);

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
      'delivery_fee_cents', restaurant.delivery_fee_cents,
      'delivery_cities', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'city', delivery_city.city,
            'state', delivery_city.state
          ) order by delivery_city.state, delivery_city.city
        )
        from public.restaurant_delivery_cities as delivery_city
        where delivery_city.restaurant_id = restaurant.id
      ), '[]'::jsonb),
      'is_pro', exists (
        select 1 from public.subscriptions
        where subscriptions.owner_id = restaurant.owner_id
          and subscriptions.status in ('active', 'trialing')
      ),
      'payment_online_active', exists (
        select 1 from public.restaurant_mercado_pago_accounts as mercado_pago
        where mercado_pago.restaurant_id = restaurant.id
          and mercado_pago.status = 'active'
      ) or exists (
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
      'delivery_fee_cents', restaurant.delivery_fee_cents,
      'delivery_cities', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'city', delivery_city.city,
            'state', delivery_city.state
          ) order by delivery_city.state, delivery_city.city
        )
        from public.restaurant_delivery_cities as delivery_city
        where delivery_city.restaurant_id = restaurant.id
      ), '[]'::jsonb),
      'is_pro', true,
      'payment_online_active', exists (
        select 1 from public.restaurant_mercado_pago_accounts as mercado_pago
        where mercado_pago.restaurant_id = restaurant.id
          and mercado_pago.status = 'active'
      ) or exists (
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
