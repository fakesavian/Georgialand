-- PROPOSAL ONLY — NOT YET APPLIED.
-- Account-backed saved listings (favorites) + per-listing notes.
--
-- Status: the app currently persists favorites/notes in browser localStorage
-- (see src/lib/useFavorites.ts). This file documents the table + RLS policies
-- required to move favorites to the authenticated user's account so they sync
-- across devices. Apply in the Supabase SQL editor (or via a reviewed migration)
-- AFTER a human signs off. Do not apply automatically.
--
-- Once this table and its policies are live:
--   1. In src/lib/useFavorites.ts, set isAccountBacked=true when a user session
--      exists, load rows on mount, and write through to this table on toggle/note.
--   2. Keep localStorage as the offline / signed-out fallback.
--   3. FavoritesView already hides the "saved on this device" notice when
--      isAccountBacked is true.

create table if not exists public.saved_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  -- Stable identifier for the property. Mirrors the client key used today:
  -- Parcel_ID, falling back to Property_Name_or_Address when no parcel id.
  listing_key text not null,
  address text,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, listing_key)
);

create index if not exists saved_listings_user_id_idx
  on public.saved_listings (user_id);

-- Reuse the shared updated_at trigger function defined in schema.sql.
drop trigger if exists saved_listings_set_updated_at on public.saved_listings;
create trigger saved_listings_set_updated_at
before update on public.saved_listings
for each row execute function public.set_updated_at();

alter table public.saved_listings enable row level security;

-- Users can read and manage only their own saved listings.
drop policy if exists "saved_listings_select_own" on public.saved_listings;
create policy "saved_listings_select_own"
on public.saved_listings for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "saved_listings_insert_own" on public.saved_listings;
create policy "saved_listings_insert_own"
on public.saved_listings for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "saved_listings_update_own" on public.saved_listings;
create policy "saved_listings_update_own"
on public.saved_listings for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "saved_listings_delete_own" on public.saved_listings;
create policy "saved_listings_delete_own"
on public.saved_listings for delete
to authenticated
using (auth.uid() = user_id);
