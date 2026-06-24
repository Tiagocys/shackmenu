alter table public.restaurants
add column if not exists contact_email text;

alter table public.restaurants
drop constraint if exists restaurants_contact_email_format;

alter table public.restaurants
add constraint restaurants_contact_email_format
check (contact_email is null or contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');
