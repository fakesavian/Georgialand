import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export const config = {
  api: {
    bodyParser: false,
  },
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing']);
const DOWNGRADE_SUBSCRIPTION_STATUSES = new Set([
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'paused',
  'unpaid',
]);

const VALID_ACCESS_LEVELS = new Set([
  'dashboard_starter',
  'dashboard_pro',
  'dashboard_investor',
]);

function getEnv(name: string): string | null {
  const value = process.env[name];
  return value && value.trim() ? value : null;
}

function getServerEnv() {
  const missing: string[] = [];
  const stripeSecretKey = getEnv('STRIPE_SECRET_KEY');
  const webhookSecret = getEnv('STRIPE_WEBHOOK_SECRET');
  const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL');
  const supabaseServiceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!stripeSecretKey) missing.push('STRIPE_SECRET_KEY');
  if (!webhookSecret) missing.push('STRIPE_WEBHOOK_SECRET');
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL or SUPABASE_URL');
  if (!supabaseServiceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  return {
    missing,
    stripeSecretKey,
    webhookSecret,
    supabaseUrl,
    supabaseServiceRoleKey,
  };
}

function createAccessLevelByPriceId(): Record<string, string> {
  const entries: Array<[string, string]> = [
    ['STRIPE_DASHBOARD_STARTER_MONTHLY_PRICE_ID', 'dashboard_starter'],
    ['STRIPE_DASHBOARD_STARTER_ANNUAL_PRICE_ID', 'dashboard_starter'],
    ['STRIPE_DASHBOARD_PRO_MONTHLY_PRICE_ID', 'dashboard_pro'],
    ['STRIPE_DASHBOARD_PRO_ANNUAL_PRICE_ID', 'dashboard_pro'],
    ['STRIPE_DASHBOARD_INVESTOR_MONTHLY_PRICE_ID', 'dashboard_investor'],
    ['STRIPE_DASHBOARD_INVESTOR_ANNUAL_PRICE_ID', 'dashboard_investor'],
  ];
  const byPriceId: Record<string, string> = {};

  for (const [envName, accessLevel] of entries) {
    const priceId = getEnv(envName);
    if (priceId) byPriceId[priceId] = accessLevel;
  }

  return byPriceId;
}

function normalizeAccessLevel(value: unknown): string | null {
  return typeof value === 'string' && VALID_ACCESS_LEVELS.has(value) ? value : null;
}

function getCurrentPeriodEnd(subscription: any): string | null {
  const unixSeconds = subscription.current_period_end
    ?? subscription.items?.data?.[0]?.current_period_end;

  return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null;
}

// Helper to read the raw request body for Stripe signature verification.
async function buffer(readable: any) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function getFirstSubscriptionPrice(subscription: any): any | null {
  return subscription.items?.data?.[0]?.price || null;
}

async function resolveAccessLevelFromSubscription(stripe: any, subscription: any): Promise<string> {
  const price = getFirstSubscriptionPrice(subscription);
  const product = typeof price?.product === 'object' ? price.product : null;
  const byPriceId = createAccessLevelByPriceId();

  const directAccessLevel = normalizeAccessLevel(subscription.metadata?.access_level)
    || normalizeAccessLevel(price?.metadata?.access_level)
    || normalizeAccessLevel(product?.metadata?.access_level)
    || normalizeAccessLevel(price?.id ? byPriceId[price.id] : null);

  if (directAccessLevel) return directAccessLevel;

  if (price?.id && !product) {
    const expandedPrice = await stripe.prices.retrieve(price.id, {
      expand: ['product'],
    });
    const expandedProduct = typeof expandedPrice.product === 'object' ? expandedPrice.product : null;
    const expandedAccessLevel = normalizeAccessLevel(expandedPrice.metadata?.access_level)
      || normalizeAccessLevel(expandedProduct?.metadata?.access_level)
      || normalizeAccessLevel(byPriceId[expandedPrice.id]);

    if (expandedAccessLevel) return expandedAccessLevel;
  }

  throw new Error(`Unable to resolve dashboard access level for subscription ${subscription.id}`);
}

async function findUserIdForSubscription(supabase: any, subscription: any): Promise<string | null> {
  const metadataUserId = subscription.metadata?.user_id;
  if (metadataUserId) return metadataUserId;

  const { data: subData, error: subError } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle();

  if (subError) {
    throw new Error(`Subscription lookup failed: ${subError.message}`);
  }

  if (subData?.user_id) return subData.user_id;

  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id;

  if (!customerId) return null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Profile lookup by Stripe customer failed: ${profileError.message}`);
  }

  return profile?.id || null;
}

async function requireSupabaseOk<T extends { error: any }>(result: T, operation: string): Promise<T> {
  if (result.error) {
    throw new Error(`${operation} failed: ${result.error.message || JSON.stringify(result.error)}`);
  }
  return result;
}

async function syncSubscriptionToSupabase(stripe: any, supabase: any, subscription: any) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id;

  if (!customerId) {
    throw new Error(`Subscription ${subscription.id} is missing a Stripe customer`);
  }

  const userId = await findUserIdForSubscription(supabase, subscription);
  if (!userId) {
    throw new Error(`No Supabase user found for subscription ${subscription.id}`);
  }

  const accessLevel = await resolveAccessLevelFromSubscription(stripe, subscription);
  const price = getFirstSubscriptionPrice(subscription);
  const product = typeof price?.product === 'object' ? price.product : null;
  const planName = product?.name || subscription.metadata?.plan || 'Georgia Land Finder Dashboard';
  const status = subscription.status;

  await requireSupabaseOk(
    await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        plan_name: planName,
        access_level: accessLevel,
        status,
        current_period_end: getCurrentPeriodEnd(subscription),
      }, { onConflict: 'stripe_subscription_id' }),
    `Subscription upsert for ${subscription.id}`
  );

  if (ACTIVE_SUBSCRIPTION_STATUSES.has(status)) {
    await requireSupabaseOk(
      await supabase
        .from('profiles')
        .update({
          access_level: accessLevel,
          stripe_customer_id: customerId,
        })
        .eq('id', userId),
      `Profile upgrade for ${userId}`
    );
  } else if (DOWNGRADE_SUBSCRIPTION_STATUSES.has(status)) {
    const { data: activeSubscriptions, error: activeSubscriptionsError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .in('status', Array.from(ACTIVE_SUBSCRIPTION_STATUSES))
      .neq('stripe_subscription_id', subscription.id)
      .limit(1);

    if (activeSubscriptionsError) {
      throw new Error(`Active subscription safety check failed for ${userId}: ${activeSubscriptionsError.message}`);
    }

    if (activeSubscriptions && activeSubscriptions.length > 0) {
      return;
    }

    await requireSupabaseOk(
      await supabase
        .from('profiles')
        .update({
          access_level: 'free_preview',
          stripe_customer_id: customerId,
        })
        .eq('id', userId),
      `Profile downgrade for ${userId}`
    );
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const env = getServerEnv();
  if (env.missing.length > 0) {
    console.error(`Stripe webhook missing required env vars: ${env.missing.join(', ')}`);
    return res.status(500).json({
      error: 'Stripe webhook is not configured on the server',
    });
  }

  const stripe = new Stripe(env.stripeSecretKey as string);
  const supabase = createClient(env.supabaseUrl as string, env.supabaseServiceRoleKey as string);

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event: any;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, env.webhookSecret as string);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;

        if (session.mode !== 'subscription') {
          console.warn(`Ignoring non-subscription checkout session ${session.id}`);
          break;
        }

        if (!session.subscription) {
          throw new Error(`Completed checkout session ${session.id} has no subscription`);
        }

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string, {
          expand: ['items.data.price.product'],
        });

        await syncSubscriptionToSupabase(stripe, supabase, subscription);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const rawSubscription = event.data.object as any;
        const subscription = await stripe.subscriptions.retrieve(rawSubscription.id, {
          expand: ['items.data.price.product'],
        });

        await syncSubscriptionToSupabase(stripe, supabase, subscription);
        break;
      }

      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
        // Subscription lifecycle events are the source of truth for entitlement changes.
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('Webhook handler failed:', err.message || err);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}
