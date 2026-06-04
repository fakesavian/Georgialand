-- Georgia Low-Cost Land Finder production Supabase schema
-- Run in Supabase SQL Editor after creating the project.

create extension if not exists pgcrypto;

-- Access levels used by the React app and Stripe webhook.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'access_level') then
    create type public.access_level as enum (
      'free_preview',
      'report_buyer',
      'alerts_subscriber',
      'dashboard_starter',
      'dashboard_pro',
      'dashboard_investor',
      'admin'
    );
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  access_level public.access_level not null default 'free_preview',
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  plan_name text,
  access_level public.access_level not null default 'dashboard_starter',
  status text not null,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.alert_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  email text not null,
  counties text[] not null default '{}',
  acquisition_types text[] not null default '{}',
  max_price_category text not null default 'Any',
  min_fit_score integer not null default 0 check (min_fit_score >= 0 and min_fit_score <= 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists alert_preferences_set_updated_at on public.alert_preferences;
create trigger alert_preferences_set_updated_at
before update on public.alert_preferences
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.alert_preferences enable row level security;

-- Profiles: users can read their own row. Entitlement fields such as
-- access_level and stripe_customer_id must only be changed by trusted server-side
-- code using the Supabase service role key, which bypasses RLS for Stripe webhooks.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;

-- Subscriptions: users can read their own subscription rows.
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
on public.subscriptions for select
to authenticated
using (auth.uid() = user_id);

-- Alert preferences: users can manage only their own preferences.
drop policy if exists "alert_preferences_select_own" on public.alert_preferences;
create policy "alert_preferences_select_own"
on public.alert_preferences for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "alert_preferences_insert_own" on public.alert_preferences;
create policy "alert_preferences_insert_own"
on public.alert_preferences for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "alert_preferences_update_own" on public.alert_preferences;
create policy "alert_preferences_update_own"
on public.alert_preferences for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "alert_preferences_delete_own" on public.alert_preferences;
create policy "alert_preferences_delete_own"
on public.alert_preferences for delete
to authenticated
using (auth.uid() = user_id);

-- Buckets used by src/lib/dataFetcher.ts and src/pages/AdminPage.tsx.
insert into storage.buckets (id, name, public)
values
  ('public-assets', 'public-assets', true),
  ('protected-datasets', 'protected-datasets', false)
on conflict (id) do update set public = excluded.public;

-- Public sample assets can be read anonymously.
drop policy if exists "public_assets_read" on storage.objects;
create policy "public_assets_read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'public-assets');

-- Paid dashboard tiers can download the protected dataset.
drop policy if exists "protected_datasets_paid_read" on storage.objects;
create policy "protected_datasets_paid_read"
on storage.objects for select
to authenticated
using (
  bucket_id = 'protected-datasets'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.access_level in ('dashboard_starter', 'dashboard_pro', 'dashboard_investor', 'admin')
  )
);

-- Admins can upload/replace/delete storage objects from the in-app admin page.
drop policy if exists "admin_storage_insert" on storage.objects;
create policy "admin_storage_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('public-assets', 'protected-datasets')
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.access_level = 'admin'
  )
);

drop policy if exists "admin_storage_update" on storage.objects;
create policy "admin_storage_update"
on storage.objects for update
to authenticated
using (
  bucket_id in ('public-assets', 'protected-datasets')
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.access_level = 'admin'
  )
)
with check (
  bucket_id in ('public-assets', 'protected-datasets')
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.access_level = 'admin'
  )
);

drop policy if exists "admin_storage_delete" on storage.objects;
create policy "admin_storage_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id in ('public-assets', 'protected-datasets')
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.access_level = 'admin'
  )
);
