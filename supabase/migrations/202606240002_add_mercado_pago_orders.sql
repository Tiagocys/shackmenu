alter table public.orders
add column payment_provider text not null default 'stripe'
  check (payment_provider in ('stripe', 'mercado_pago'));

alter table public.orders
add column mercado_pago_preference_id text unique;

alter table public.orders
add column mercado_pago_payment_id text unique;
