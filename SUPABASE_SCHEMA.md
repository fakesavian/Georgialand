# Supabase Database Schema

Run the following SQL in your Supabase SQL Editor to create the `profiles` table, enable Row Level Security, and set up the automatic trigger for new users.

```sql
-- 1. Create the profiles table
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  access_level text not null default 'free_preview',
  stripe_customer_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- 2. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 3. Create policies
-- Users can read their own profile
create policy "Users can view own profile" 
  on profiles for select 
  using ( auth.uid() = id );

-- Users can update their own profile (optional, usually managed via backend/stripe webhook)
create policy "Users can update own profile" 
  on profiles for update 
  using ( auth.uid() = id );

-- 4. Create trigger to automatically insert a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, access_level)
  values (new.id, new.email, 'free_preview');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- 3. Leads Table (For Free Sample Capture)
-- ==========================================
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT,
    email TEXT UNIQUE NOT NULL,
    buyer_type TEXT,
    source_page TEXT DEFAULT '/free-sample',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to submit leads (Insert only)
CREATE POLICY "Allow anonymous lead capture"
ON public.leads
FOR INSERT 
TO public, anon
WITH CHECK (true);

-- Only admins can view leads
CREATE POLICY "Admins can view leads"
ON public.leads
FOR SELECT
TO authenticated
USING (
  (SELECT access_level FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- ==========================================
-- 4. Subscriptions Table
-- ==========================================
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT UNIQUE,
    plan_name TEXT,
    access_level TEXT,
    status TEXT,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscriptions
CREATE POLICY "Users can view own subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING ( auth.uid() = user_id );

-- Only admins/service role can insert or update subscriptions
-- (Vercel backend will use service_role key to manage these)

-- ==========================================
-- 5. Alert Preferences Table
-- ==========================================
CREATE TABLE public.alert_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    counties TEXT[],
    cities TEXT[],
    acquisition_types TEXT[],
    max_price_category TEXT,
    min_fit_score INTEGER DEFAULT 50,
    max_risk_score INTEGER DEFAULT 100,
    frequency TEXT DEFAULT 'weekly',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for alert_preferences
ALTER TABLE public.alert_preferences ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to submit alerts (Insert only)
CREATE POLICY "Allow anonymous alert capture"
ON public.alert_preferences
FOR INSERT 
TO public, anon
WITH CHECK (true);

-- Only admins/service role can read/update (due to email-based upserts via Vercel)
```
