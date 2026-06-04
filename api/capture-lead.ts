import { createClient } from '@supabase/supabase-js';
import { escapeHtml } from '../src/lib/htmlEscape';

const MAX_NAME_LENGTH = 80;
const MAX_BUYER_TYPE_LENGTH = 120;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeString(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

// Vercel Serverless Function handler
export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const firstName = normalizeString(req.body?.first_name, MAX_NAME_LENGTH);
  const email = normalizeString(req.body?.email, 254).toLowerCase();
  const buyerType = normalizeString(req.body?.buyer_type, MAX_BUYER_TYPE_LENGTH) || 'Just researching';

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  // 1. Save to Supabase (if configured)
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { error: dbError } = await supabase
      .from('leads')
      .upsert({ 
        first_name: firstName, 
        email, 
        buyer_type: buyerType,
        source_page: '/free-sample'
      }, { onConflict: 'email' });
      
    if (dbError) {
      console.error('Supabase insert error:', dbError);
      // We don't fail the request here, we still try to send the email
    }
  } else {
    console.warn('Supabase not configured. Skipping DB insert.');
  }

  // 2. Send Email via Resend (if configured)
  const resendApiKey = process.env.RESEND_API_KEY;
  let emailSent = false;

  if (resendApiKey) {
    const siteUrl = process.env.VITE_SITE_URL || 'https://georgialandfinder.com';
    const downloadLink = `${siteUrl.replace(/\/$/, '')}/free_georgia_land_10_lead_sample.csv`;

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'Georgia Land Finder <hello@georgialandfinder.com>',
          to: email,
          subject: 'Your free Georgia land sample',
          html: `
            <p>Hi ${firstName ? escapeHtml(firstName) : 'there'},</p>
            <p>Thanks for requesting the Georgia Low-Cost Land Finder sample.</p>
            <p>Download your 10-lead sample here: <a href="${escapeHtml(downloadLink)}">Download CSV</a></p>
            <br/>
            <p><em>Disclaimer: This is research/data only, not brokerage, legal, title, tax, or investment advice.</em></p>
          `
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Resend API error:', errorText);
      } else {
        emailSent = true;
      }
    } catch (err) {
      console.error('Email send failed:', err);
    }
  } else {
    console.warn('RESEND_API_KEY not configured. Skipping email delivery.');
  }

  // 3. Return success (so the frontend can show the download button as fallback)
  return res.status(200).json({ 
    success: true, 
    emailSent,
    message: emailSent ? 'Email sent successfully' : 'Lead captured (email skipped)'
  });
}
