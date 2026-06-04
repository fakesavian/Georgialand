import { createClient } from '@supabase/supabase-js';

// Vercel Serverless Function to securely upsert alert preferences.
// We use the Service Role key because we're looking up/updating by email,
// which requires bypassing RLS.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LIST_ITEMS = 25;
const MAX_ITEM_LENGTH = 80;

function normalizeString(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function normalizeList(value: unknown): string[] {
  const rawItems = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];

  return rawItems
    .map((item) => normalizeString(item, MAX_ITEM_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_LIST_ITEMS);
}

function normalizeFitScore(value: unknown): number {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (Number.isNaN(parsed)) return 50;
  return Math.min(100, Math.max(0, parsed));
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase server configuration for alert preferences.');
    return res.status(500).json({ error: 'Server is not configured for alert preferences' });
  }

  const email = normalizeString(req.body?.email, 254).toLowerCase();

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { error } = await supabase
      .from('alert_preferences')
      .upsert({
        email,
        counties: normalizeList(req.body?.counties),
        max_price_category: normalizeString(req.body?.max_price_category, 40) || 'Any',
        acquisition_types: normalizeList(req.body?.acquisition_types),
        min_fit_score: normalizeFitScore(req.body?.min_fit_score),
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' });

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Error saving alert preferences:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
