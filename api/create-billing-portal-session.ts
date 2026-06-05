import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

function createStripeClient() {
  return new Stripe(getRequiredEnv('STRIPE_SECRET_KEY'));
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getBearerToken(req: any): string | null {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (typeof header !== 'string') return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

function getSiteUrl(): string | null {
  const configured = process.env.SITE_URL || process.env.VITE_SITE_URL;
  return configured ? configured.replace(/\/$/, '') : null;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe is not configured on the server' });
  }

  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Please sign in to manage billing' });
  }

  const supabase = createClient(
    getRequiredEnv('VITE_SUPABASE_URL'),
    getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
  );

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  const user = authData?.user;

  if (authError || !user?.id) {
    return res.status(401).json({ error: 'Please sign in to manage billing' });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Billing profile lookup failed:', profileError);
    return res.status(500).json({ error: 'Unable to load billing profile' });
  }

  if (!profile?.stripe_customer_id) {
    return res.status(404).json({ error: 'No Stripe customer is attached to this account yet' });
  }

  const siteUrl = getSiteUrl();
  if (!siteUrl) {
    return res.status(500).json({ error: 'Billing portal site URL is not configured on the server' });
  }

  const stripe = createStripeClient();
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${siteUrl}/account`,
  });

  return res.status(200).json({ url: portalSession.url });
}
