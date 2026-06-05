import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { getPaidPlan, isBillingCycle } from '../src/lib/stripePlans';

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

  const plan = getPaidPlan(String(req.body?.plan || ''));
  const billingCycle = String(req.body?.billingCycle || '');

  if (!plan || !isBillingCycle(billingCycle)) {
    return res.status(400).json({ error: 'Invalid checkout plan or billing cycle' });
  }

  const priceId = process.env[plan.stripePriceEnv[billingCycle]];
  if (!priceId) {
    return res.status(500).json({ error: `${plan.name} ${billingCycle} checkout is not configured` });
  }

  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Please sign in before checkout' });
  }

  const supabase = createClient(
    getRequiredEnv('VITE_SUPABASE_URL'),
    getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
  );

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  const user = authData?.user;

  if (authError || !user?.id || !user.email) {
    return res.status(401).json({ error: 'Please sign in before checkout' });
  }

  const stripe = createStripeClient();

  const { data: existingProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id,email,stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Profile lookup failed before checkout:', profileError);
    return res.status(500).json({ error: 'Unable to load your account before checkout' });
  }

  if (!existingProfile) {
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({ id: user.id, email: user.email });

    if (insertError) {
      console.error('Profile creation failed before checkout:', insertError);
      return res.status(500).json({ error: 'Unable to prepare your account for checkout' });
    }
  } else if (existingProfile.email !== user.email) {
    const { error: updateEmailError } = await supabase
      .from('profiles')
      .update({ email: user.email })
      .eq('id', user.id);

    if (updateEmailError) {
      console.error('Profile email update failed before checkout:', updateEmailError);
      return res.status(500).json({ error: 'Unable to update your account before checkout' });
    }
  }

  let customerId = existingProfile?.stripe_customer_id || null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        supabase_user_id: user.id,
      },
    });
    customerId = customer.id;

    const { error: updateCustomerError } = await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id);

    if (updateCustomerError) {
      console.error('Stripe customer persistence failed before checkout:', updateCustomerError);
      return res.status(500).json({ error: 'Unable to attach billing customer before checkout' });
    }
  }

  const siteUrl = getSiteUrl();
  if (!siteUrl) {
    return res.status(500).json({ error: 'Checkout site URL is not configured on the server' });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: user.id,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    allow_promotion_codes: true,
    success_url: `${siteUrl}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/checkout-cancel?plan=${plan.id}&billing=${billingCycle}`,
    subscription_data: {
      metadata: {
        user_id: user.id,
        plan: plan.id,
        billing_cycle: billingCycle,
        access_level: plan.accessLevel,
      },
    },
    metadata: {
      user_id: user.id,
      plan: plan.id,
      billing_cycle: billingCycle,
      access_level: plan.accessLevel,
    },
  });

  return res.status(200).json({ url: session.url });
}
