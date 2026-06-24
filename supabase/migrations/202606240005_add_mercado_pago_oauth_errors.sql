create table public.mercado_pago_oauth_errors (
  id uuid primary key default gen_random_uuid(),
  state text,
  owner_id uuid,
  restaurant_id uuid,
  error_message text not null,
  error_stack text,
  created_at timestamptz not null default now()
);

alter table public.mercado_pago_oauth_errors enable row level security;
