alter table public.orders
  add column if not exists mercado_pago_refund_id text,
  add column if not exists mercado_pago_refund_status text,
  add column if not exists refunded_at timestamptz;

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in ('awaiting_payment', 'payment_confirmed', 'payment_failed', 'cancelled', 'refunded'));

create unique index if not exists orders_mercado_pago_refund_id_key
  on public.orders (mercado_pago_refund_id)
  where mercado_pago_refund_id is not null;
