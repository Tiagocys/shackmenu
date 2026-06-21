create table public.admin_refunds (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  admin_user_id uuid not null references auth.users(id),
  stripe_refund_id text not null unique,
  stripe_payment_intent_id text not null,
  stripe_invoice_id text not null,
  amount integer not null check (amount > 0),
  currency text not null,
  status text not null,
  created_at timestamptz not null default now()
);

alter table public.admin_refunds enable row level security;

revoke all on table public.admin_refunds from anon, authenticated;
