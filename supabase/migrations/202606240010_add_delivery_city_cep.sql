alter table public.restaurant_delivery_cities
add column if not exists cep text;

alter table public.restaurant_delivery_cities
drop constraint if exists restaurant_delivery_cities_restaurant_id_normalized_city_state_key;

create unique index if not exists restaurant_delivery_cities_restaurant_cep_key
on public.restaurant_delivery_cities (restaurant_id, cep)
where cep is not null;
