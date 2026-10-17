-- CreatorFlow database schema (run in Supabase SQL Editor).
create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'CreatorFlow Workspace',
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  email text,
  display_name text,
  role text not null default 'team' check (role in ('wife','owner','admin','team')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.endorsements (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_name text not null,
  brand_handle text,
  platform text[] not null default '{}',
  fee_idr bigint not null default 0 check (fee_idr >= 0),
  stage text not null default 'invitation' check (stage in ('invitation','wa_group','script','draft','submit_draft','review','posted','insights','payment','done')),
  posting_date date,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid','barter','partial','not_applicable')),
  payment_due_date date,
  notes text,
  wa_group_url text,
  brief_url text,
  script_url text,
  draft_url text,
  post_url text,
  insights_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.status_history (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  endorsement_id uuid not null references public.endorsements(id) on delete cascade,
  from_stage text,
  to_stage text not null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.google_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  refresh_token text not null,
  scope text,
  updated_at timestamptz not null default now()
);

create table if not exists public.import_history (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  source_title text,
  imported_count integer not null default 0,
  skipped_count integer not null default 0,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists endorsements_touch_updated_at on public.endorsements;
create trigger endorsements_touch_updated_at before update on public.endorsements
for each row execute function public.touch_updated_at();

alter table public.workspaces enable row level security;
alter table public.profiles enable row level security;
alter table public.endorsements enable row level security;
alter table public.status_history enable row level security;
alter table public.google_connections enable row level security;
alter table public.import_history enable row level security;

-- Access is scoped to members of the same workspace.
create or replace function public.current_workspace_id()
returns uuid language sql stable security definer set search_path = public
as $$ select workspace_id from public.profiles where id = auth.uid() $$;

drop policy if exists "members read workspace" on public.workspaces;
create policy "members read workspace" on public.workspaces for select to authenticated
using (id = public.current_workspace_id());

drop policy if exists "members read profiles" on public.profiles;
create policy "members read profiles" on public.profiles for select to authenticated
using (workspace_id = public.current_workspace_id() or id = auth.uid());

drop policy if exists "members read endorsements" on public.endorsements;
create policy "members read endorsements" on public.endorsements for select to authenticated
using (workspace_id = public.current_workspace_id());
drop policy if exists "members add endorsements" on public.endorsements;
create policy "members add endorsements" on public.endorsements for insert to authenticated
with check (workspace_id = public.current_workspace_id());
drop policy if exists "members update endorsements" on public.endorsements;
create policy "members update endorsements" on public.endorsements for update to authenticated
using (workspace_id = public.current_workspace_id()) with check (workspace_id = public.current_workspace_id());
drop policy if exists "members delete endorsements" on public.endorsements;
create policy "members delete endorsements" on public.endorsements for delete to authenticated
using (workspace_id = public.current_workspace_id());

drop policy if exists "members read history" on public.status_history;
create policy "members read history" on public.status_history for select to authenticated
using (workspace_id = public.current_workspace_id());
drop policy if exists "members add history" on public.status_history;
create policy "members add history" on public.status_history for insert to authenticated
with check (workspace_id = public.current_workspace_id());

drop policy if exists "user read google connection" on public.google_connections;
create policy "user read google connection" on public.google_connections for select to authenticated
using (user_id = auth.uid());
-- Refresh tokens are written only by the server service role, not browser clients.
drop policy if exists "members read import history" on public.import_history;
create policy "members read import history" on public.import_history for select to authenticated
using (workspace_id = public.current_workspace_id());
drop policy if exists "members add import history" on public.import_history;
create policy "members add import history" on public.import_history for insert to authenticated
with check (workspace_id = public.current_workspace_id());

-- Bootstrap instructions:
-- 1. Create a workspace row.
-- 2. Register the first user through /login.
-- 3. Insert that user's auth UUID into profiles as role='admin' with workspace_id.
-- 4. Other users register and are added from Pengaturan tim.
