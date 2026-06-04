# Supabase Storage & RLS Setup

To securely host the full dataset, you must create storage buckets in Supabase and configure Row Level Security (RLS) to ensure only paid users can download the enriched data.

## 1. Create the Buckets

You need two buckets in your Supabase project:
1. `public-assets`: Set to **Public**.
2. `protected-datasets`: Set to **Private** (Not public).

You can create these in the Supabase Dashboard under Storage -> New Bucket.

## 2. Upload Your CSVs

1. Upload your 10-lead sample (`free_georgia_land_10_lead_sample.csv`) to the `public-assets` bucket.
2. Upload your full database (`georgia_low_cost_land_opportunities_enriched.csv`) to the `protected-datasets` bucket.

## 3. Apply Row Level Security (RLS)

Run the following SQL in the Supabase SQL Editor to secure the `protected-datasets` bucket.

```sql
-- Enable RLS on the storage.objects table if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Allow anyone to read from the public-assets bucket
CREATE POLICY "Public Assets are viewable by everyone."
ON storage.objects FOR SELECT
USING ( bucket_id = 'public-assets' );

-- 2. Allow only paid tiers to read from protected-datasets bucket
CREATE POLICY "Paid tiers can download protected datasets"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'protected-datasets' AND
  (
    SELECT access_level FROM public.profiles WHERE id = auth.uid()
  ) IN ('dashboard_starter', 'dashboard_pro', 'dashboard_investor', 'admin')
);

-- 3. Allow only admins to upload/modify protected datasets
CREATE POLICY "Admins can upload protected datasets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'protected-datasets' AND
  (
    SELECT access_level FROM public.profiles WHERE id = auth.uid()
  ) = 'admin'
);

CREATE POLICY "Admins can update protected datasets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'protected-datasets' AND
  (
    SELECT access_level FROM public.profiles WHERE id = auth.uid()
  ) = 'admin'
);

CREATE POLICY "Admins can delete protected datasets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'protected-datasets' AND
  (
    SELECT access_level FROM public.profiles WHERE id = auth.uid()
  ) = 'admin'
);
```
