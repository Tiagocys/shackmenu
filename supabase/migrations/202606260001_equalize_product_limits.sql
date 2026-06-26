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
    'product_limit', 200
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
  product_limit integer := 200;
begin
  select restaurants.owner_id
  into restaurant_owner
  from public.restaurants
  where restaurants.id = new.restaurant_id;

  if restaurant_owner is null or restaurant_owner <> (select auth.uid()) then
    raise exception 'RESTAURANT_ACCESS_DENIED';
  end if;

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
