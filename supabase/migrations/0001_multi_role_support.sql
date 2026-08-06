-- ============================================================
--  EduTrack NG — Multi-Role Support Migration
--  Replaces the insecure client-side "impersonation" hack with
--  a safe, server-verified way for one staff member to hold
--  several roles (common in small schools where one person is
--  Admin + Exam Officer + Registrar, etc.)
--
--  Run this in Supabase Dashboard → SQL Editor (or via CLI:
--  supabase db push) BEFORE deploying the updated client code.
-- ============================================================

-- 1. Add a `roles` array column. `role` stays as-is and now means
--    "currently active role" — i.e. which portal/menu the user is
--    currently viewing. It must always be one of the values in `roles`.
alter table public.users
  add column if not exists roles text[] not null default '{}';

-- 2. Backfill: every existing user's `roles` becomes a single-item
--    array containing their current `role`, so nothing breaks.
update public.users
  set roles = array[role]
  where roles = '{}' and role is not null;

-- 3. Keep data consistent going forward: whenever `role` is set/changed
--    directly (e.g. by admin editing a staff record), make sure it's
--    always included in `roles` too, so the invariant "role ⊆ roles"
--    never breaks even from direct table edits.
create or replace function public._sync_role_into_roles()
returns trigger
language plpgsql
as $$
begin
  if new.role is not null and not (new.role = any(coalesce(new.roles, '{}'))) then
    new.roles := array_append(coalesce(new.roles, '{}'), new.role);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_role_into_roles on public.users;
create trigger trg_sync_role_into_roles
  before insert or update of role, roles on public.users
  for each row
  execute function public._sync_role_into_roles();

-- 4. Safe, server-verified role switch.
--    - Always operates on the CALLER's own row (auth.uid()) — a user
--      can never switch another user's active role.
--    - Only allows switching to a role already present in the
--      caller's own `roles` array — never an arbitrary role.
--    - This fully replaces the old impersonate.js approach, which
--      let anyone view/act as any other user via a URL parameter
--      with no server-side check at all.
create or replace function public.switch_active_role(new_role text)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_row public.users;
begin
  if not exists (
    select 1 from public.users
    where id = auth.uid()
      and new_role = any(roles)
  ) then
    raise exception 'Role "%" is not assigned to this account', new_role
      using errcode = '42501';
  end if;

  update public.users
    set role = new_role
    where id = auth.uid()
    returning * into updated_row;

  return updated_row;
end;
$$;

-- Only the authenticated user may call this, and only for themselves.
revoke all on function public.switch_active_role(text) from public;
grant execute on function public.switch_active_role(text) to authenticated;

-- 5. Sanity view for admins to see who holds multiple roles
--    (handy for auditing after rollout).
create or replace view public.v_multi_role_staff as
select id, school_id, full_name, role as active_role, roles
from public.users
where array_length(roles, 1) > 1;
