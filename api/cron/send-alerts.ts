import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import { generateDigest, AlertPreferences, PropertyData } from '../../src/lib/alertDigest';

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export default async function handler(req: any, res: any) {
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('CRON_SECRET is not configured; refusing to run scheduled alert job.');
    return res.status(500).json({ error: 'Cron authentication is not configured' });
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabase = createClient(
      getRequiredEnv('VITE_SUPABASE_URL'),
      getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
    );

    // 1. Fetch active alert preferences
    const { data: preferences, error: prefError } = await supabase
      .from('alert_preferences')
      .select('*');

    if (prefError) throw prefError;
    if (!preferences || preferences.length === 0) {
      return res.status(200).json({ message: 'No active preferences found' });
    }

    // 2. Fetch master dataset from Supabase Storage
    const { data: csvBlob, error: downloadError } = await supabase.storage
      .from('protected-datasets')
      .download('georgia_low_cost_land_opportunities_enriched.csv');

    if (downloadError) throw downloadError;
    
    const csvText = await csvBlob.text();

    // 3. Parse CSV data
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const allProperties: PropertyData[] = parsed.data.map((row: any) => ({
      parcel_id: row['Parcel_ID'] || row['Parcel ID'] || 'Unknown',
      address: row['Property_Name_or_Address'] || row['Address'] || 'N/A',
      city: row['City'] || 'N/A',
      county: row['County'] || 'N/A',
      price: row['Estimated_Price_or_Min_Bid'] || row['Price'] || '$0',
      acquisition_type: row['Acquisition_Type'] || 'Unknown',
      fit_score: parseInt(row['Fit_Score_0_to_100'] || row['Fit Score']) || 0,
      risk_score: parseInt(row['Risk_Score_0_to_100'] || row['Risk Score']) || 0
    }));

    // 4. Send emails using Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY is missing. Skipping email delivery.');
      return res.status(200).json({ message: 'Dry run completed. (No RESEND_API_KEY)' });
    }

    let sentCount = 0;

    for (const pref of preferences) {
      // Create user preference object matching the interface
      const userPrefs: AlertPreferences = {
        counties: pref.counties || [],
        acquisition_types: pref.acquisition_types || [],
        max_price_category: pref.max_price_category || 'Any',
        min_fit_score: pref.min_fit_score || 0
      };

      // Generate HTML digest
      const htmlDigest = generateDigest(userPrefs, allProperties, process.env.VITE_SITE_URL || 'https://georgialandfinder.com');

      // We only send if there are actually matches in the digest
      // The generateDigest outputs a message if there are no matches,
      // but to save API calls we might want to check candidates.length.
      // However, it's easier to just send the empty digest so they know it's working,
      // or we can skip. We'll send it regardless based on current logic.

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'Georgia Land Finder <hello@georgialandfinder.com>',
          to: pref.email,
          subject: 'Your Weekly Land Alerts',
          html: htmlDigest
        })
      });

      if (response.ok) {
        sentCount++;
      } else {
        const errorText = await response.text();
        console.error(`Failed to send to ${pref.email}:`, errorText);
      }
    }

    return res.status(200).json({ success: true, sentCount });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
