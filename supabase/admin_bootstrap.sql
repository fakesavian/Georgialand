-- Admin bootstrap — promote fakesavian@gmail.com to access_level = 'admin'
--
-- WHEN TO RUN:
--   Run once in the Supabase SQL Editor (or via service-role API) AFTER
--   fakesavian@gmail.com has signed up and their profile row exists.
--   The profile row is created automatically by the on_auth_user_created trigger.
--
-- HOW TO RUN:
--   1. Log in to https://supabase.com/dashboard → your project → SQL Editor
--   2. Paste and run this script. Requires service-role privileges (SQL Editor has these).
--   3. Verify: SELECT id, email, access_level FROM public.profiles WHERE email = 'fakesavian@gmail.com';
--
-- SAFETY:
--   Idempotent — safe to run multiple times (WHERE clause prevents no-op writes).
--   Only updates the single row matching the email — does NOT touch any other user.
--   Does NOT grant admin to all users.
--
-- REVERTING:
--   UPDATE public.profiles SET access_level = 'free_preview', updated_at = now()
--   WHERE email = 'fakesavian@gmail.com' AND access_level = 'admin';

UPDATE public.profiles
SET
  access_level = 'admin',
  updated_at   = now()
WHERE
  email        = 'fakesavian@gmail.com'
  AND access_level <> 'admin';
