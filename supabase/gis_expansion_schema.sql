-- Georgia Land Finder GIS / backend expansion schema draft
-- Additive draft. Review in staging/Supabase SQL Editor before production use.

create extension if not exists pgcrypto;
-- Optional when available: create extension if not exists postgis;

create table if not exists public.source_registry (
  id text primary key,
  source_name text not null,
  source_type text not null,
  county text,
  city text,
  state text not null default 'GA',
  url text not null,
  api_url text,
  endpoint_type text not null default 'manual_portal',
  auth_required boolean not null default false,
  enabled boolean not null default false,
  refresh_frequency text not null default 'manual',
  priority integer not null default 5,
  last_checked_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  listing_id text unique,
  source_id text references public.source_registry(id),
  address text,
  city text,
  county text,
  state text not null default 'GA',
  zip text,
  parcel_id text,
  latitude numeric,
  longitude numeric,
  lot_size_acres numeric,
  acquisition_type text,
  deal_type text,
  estimated_price numeric,
  price_category text,
  property_type text,
  status text not null default 'active',
  source_url text,
  property_page_url text,
  map_url text,
  gis_url text,
  fit_score integer check (fit_score between 0 and 100),
  risk_score integer check (risk_score between 0 and 100),
  data_confidence integer check (data_confidence between 0 and 100),
  verification_level text not null default 'Needs verification',
  alert_worthy boolean not null default false,
  avoid_flag boolean not null default false,
  recommended_next_action text,
  raw_json jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists properties_county_idx on public.properties(county);
create index if not exists properties_parcel_idx on public.properties(county, parcel_id);
create index if not exists properties_source_idx on public.properties(source_id);

create table if not exists public.parcels (
  id uuid primary key default gen_random_uuid(),
  county text not null,
  parcel_id text not null,
  address text,
  owner_name text,
  owner_mailing_address text,
  land_use text,
  zoning text,
  assessed_value numeric,
  land_value numeric,
  improvement_value numeric,
  tax_year integer,
  tax_due numeric,
  last_sale_date date,
  last_sale_price numeric,
  acreage numeric,
  geometry_geojson jsonb,
  centroid_lat numeric,
  centroid_lng numeric,
  source_id text references public.source_registry(id),
  source_url text,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (county, parcel_id)
);

create table if not exists public.property_tax_cards (
  id uuid primary key default gen_random_uuid(),
  county text not null,
  parcel_id text not null,
  tax_year integer,
  owner_name text,
  property_address text,
  mailing_address text,
  assessed_value numeric,
  taxable_value numeric,
  taxes_due numeric,
  exemptions text,
  land_value numeric,
  improvement_value numeric,
  last_payment_date date,
  raw_json jsonb not null default '{}'::jsonb,
  source_url text,
  last_checked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.gis_layers (
  id text primary key,
  source_id text references public.source_registry(id),
  name text not null,
  layer_type text not null,
  geometry_type text,
  url text not null,
  county text,
  city text,
  enabled boolean not null default false,
  min_access_level public.access_level not null default 'dashboard_starter',
  style_json jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  notes text
);

create table if not exists public.off_market_candidates (
  id uuid primary key default gen_random_uuid(),
  parcel_id text,
  county text,
  address text,
  owner_name text,
  mailing_address text,
  reason text,
  score integer not null default 0 check (score between 0 and 100),
  likely_vacant boolean not null default false,
  absentee_owner boolean not null default false,
  tax_delinquent boolean not null default false,
  publicly_owned boolean not null default false,
  land_bank_adjacent boolean not null default false,
  near_existing_opportunity boolean not null default false,
  low_improvement_value boolean not null default false,
  acreage numeric,
  zoning text,
  source_ids text[] not null default '{}',
  recommended_outreach text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.source_audit_logs (
  id uuid primary key default gen_random_uuid(),
  source_id text references public.source_registry(id),
  run_id text not null,
  checked_at timestamptz not null default now(),
  status text not null,
  records_found integer not null default 0,
  records_added integer not null default 0,
  records_updated integer not null default 0,
  records_stale integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  notes text
);

create table if not exists public.property_snapshots (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade,
  source_id text references public.source_registry(id),
  snapshot_date date not null default current_date,
  raw_json jsonb not null default '{}'::jsonb,
  normalized_json jsonb not null default '{}'::jsonb,
  change_hash text not null,
  created_at timestamptz not null default now(),
  unique(property_id, source_id, snapshot_date)
);

create table if not exists public.property_changes (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade,
  source_id text references public.source_registry(id),
  change_type text not null,
  field_name text,
  old_value text,
  new_value text,
  severity text not null default 'info',
  detected_at timestamptz not null default now(),
  notes text
);

alter table public.source_registry enable row level security;
alter table public.properties enable row level security;
alter table public.parcels enable row level security;
alter table public.property_tax_cards enable row level security;
alter table public.gis_layers enable row level security;
alter table public.off_market_candidates enable row level security;
alter table public.source_audit_logs enable row level security;
alter table public.property_snapshots enable row level security;
alter table public.property_changes enable row level security;

-- Draft read policies. Keep writes service-role only. Free Tier should use curated sample data,
-- not these normalized paid tables.
drop policy if exists properties_paid_read on public.properties;
create policy properties_paid_read on public.properties for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.access_level in ('dashboard_starter','dashboard_pro','dashboard_investor','admin'))
);

drop policy if exists parcels_pro_read on public.parcels;
create policy parcels_pro_read on public.parcels for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.access_level in ('dashboard_pro','dashboard_investor','admin'))
);

drop policy if exists tax_cards_investor_read on public.property_tax_cards;
create policy tax_cards_investor_read on public.property_tax_cards for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.access_level in ('dashboard_investor','admin'))
);

drop policy if exists gis_layers_paid_read on public.gis_layers;
create policy gis_layers_paid_read on public.gis_layers for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.access_level in ('dashboard_starter','dashboard_pro','dashboard_investor','admin'))
);

drop policy if exists off_market_investor_read on public.off_market_candidates;
create policy off_market_investor_read on public.off_market_candidates for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.access_level in ('dashboard_investor','admin'))
);

drop policy if exists source_registry_admin_read on public.source_registry;
create policy source_registry_admin_read on public.source_registry for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.access_level = 'admin')
);

drop policy if exists source_audit_admin_read on public.source_audit_logs;
create policy source_audit_admin_read on public.source_audit_logs for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.access_level = 'admin')
);

-- Writes should be performed only by trusted service-role ingestion jobs/functions.
