update public.restaurants as restaurant
set contact_email = auth_user.email
from auth.users as auth_user
where restaurant.owner_id = auth_user.id
  and restaurant.contact_email is null;
