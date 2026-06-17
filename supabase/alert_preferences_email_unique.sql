-- Migration: add unique index on alert_preferences.email
-- Required for the onConflict:'email' upsert in api/save-alert-preferences.ts to work.
-- Safe to run on a live table; IF NOT EXISTS makes it idempotent.
-- Human-gated: do NOT apply automatically.

create unique index if not exists alert_preferences_email_unique
  on public.alert_preferences (email);
