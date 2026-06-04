import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to read the raw request body
async function buffer(readable: any) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

// Use Service Role to bypass RLS and update profiles
const supabase = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

// Fallback lookup if you don't use metadata
const mapProductToAccessLevel = (productId: string | null): string => {
  // If you know your product IDs, map them here. For a dynamic approach,
  // it is highly recommended to add `access_level: 'dashboard_pro'` 
  // as metadata on the Stripe Product itself.
  return 'dashboard_starter'; // Default fallback
};

function getCurrentPeriodEnd(subscription: Stripe.Subscription): string | null {
  const subscriptionWithLegacyPeriod = subscription as Stripe.Subscription & {
    current_period_end?: number;
  };
  const unixSeconds = subscriptionWithLegacyPeriod.current_period_end
    ?? subscription.items.data[0]?.current_period_end;

  return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        const customerEmail = session.customer_details?.email || session.customer_email;
        const customerId = session.customer as string;
        
        if (!customerEmail) break;

        // Try to find the user by email
        const { data: profiles, error: profileErr } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', customerEmail);

        if (profileErr || !profiles || profiles.length === 0) {
          console.warn(`Payment received but no profile found for email: ${customerEmail}`);
          // Note: If you want to automatically create a user here, you'd need to use Supabase Admin API:
          // supabase.auth.admin.createUser({...})
          // For now, we assume they sign up first or we capture the payment and sync later.
          break;
        }

        const userId = profiles[0].id;

        // Fetch the line items to determine what they bought
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        const productId = lineItems.data[0]?.price?.product as string;
        
        // Fetch product to read metadata
        const product = await stripe.products.retrieve(productId);
        const accessLevel = product.metadata.access_level || mapProductToAccessLevel(productId);

        // Update profile
        await supabase
          .from('profiles')
          .update({ 
            access_level: accessLevel,
            stripe_customer_id: customerId
          })
          .eq('id', userId);

        // If it's a subscription, insert to subscriptions table
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          await supabase
            .from('subscriptions')
            .upsert({
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscription.id,
              plan_name: product.name,
              access_level: accessLevel,
              status: subscription.status,
              current_period_end: getCurrentPeriodEnd(subscription)
            }, { onConflict: 'stripe_subscription_id' });
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const status = subscription.status;
        
        // Update subscription table
        await supabase
          .from('subscriptions')
          .update({ 
            status: status,
            current_period_end: getCurrentPeriodEnd(subscription)
          })
          .eq('stripe_subscription_id', subscription.id);

        // If canceled or unpaid, downgrade profile
        if (status === 'canceled' || status === 'unpaid') {
          const { data: subData } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscription.id)
            .single();

          if (subData) {
            await supabase
              .from('profiles')
              .update({ access_level: 'free_preview' })
              .eq('id', subData.user_id);
          }
        }
        break;
      }

      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
        // Optional: Send emails, extend dates, etc.
        // The customer.subscription.* events usually handle the heavy lifting for status changes
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error('Webhook handler failed:', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}
