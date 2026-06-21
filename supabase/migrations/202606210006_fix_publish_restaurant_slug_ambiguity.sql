create or replace function public.publish_restaurant(requested_slug text)
returns table (id uuid, name text, slug text, logo_key text, published_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
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

  delete from public.restaurant_slug_aliases as aliases
  where aliases.restaurant_id = target_id
    and aliases.slug = base_slug;

  candidate := base_slug;
  while exists (
    select 1 from public.restaurants as other_restaurants
    where other_restaurants.slug = candidate
      and other_restaurants.id <> target_id
  ) or exists (
    select 1 from public.restaurant_slug_aliases as other_aliases
    where other_aliases.slug = candidate
      and other_aliases.restaurant_id <> target_id
  ) loop
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix;
  end loop;

  if previous_slug is not null and previous_slug <> candidate then
    insert into public.restaurant_slug_aliases (slug, restaurant_id)
    values (previous_slug, target_id)
    on conflict on constraint restaurant_slug_aliases_pkey do nothing;
  end if;

  update public.restaurants as target_restaurant
  set slug = candidate,
      published_at = coalesce(target_restaurant.published_at, now())
  where target_restaurant.id = target_id;

  return query
  select target_restaurant.id,
         target_restaurant.name,
         target_restaurant.slug,
         target_restaurant.logo_key,
         target_restaurant.published_at
  from public.restaurants as target_restaurant
  where target_restaurant.id = target_id;
end;
$$;

revoke all on function public.publish_restaurant(text) from public;
grant execute on function public.publish_restaurant(text) to authenticated;
