import { supabase } from './supabase';
import { BillingCycle, PaidPlanId } from './stripePlans';

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

async function postJson<TResponse>(url: string, body?: unknown): Promise<TResponse> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Please sign in before continuing.');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed. Please try again.');
  }

  return payload as TResponse;
}

export async function startCheckout(plan: PaidPlanId, billingCycle: BillingCycle): Promise<void> {
  const { url } = await postJson<{ url?: string }>('/api/create-checkout-session', {
    plan,
    billingCycle,
  });

  if (!url) {
    throw new Error('Stripe did not return a checkout URL.');
  }

  window.location.href = url;
}

export async function openBillingPortal(): Promise<void> {
  const { url } = await postJson<{ url?: string }>('/api/create-billing-portal-session');

  if (!url) {
    throw new Error('Stripe did not return a billing portal URL.');
  }

  window.location.href = url;
}
