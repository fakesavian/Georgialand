import { supabase } from './supabase';
import { AccessLevel } from './authTypes';
import { canViewFullDatabase } from './auth';

export interface DataFetchResult {
  data: string | null;
  error: string | null;
  filename: string;
}

export async function fetchDashboardData(accessLevel: AccessLevel): Promise<DataFetchResult> {
  const isPaid = canViewFullDatabase(accessLevel);

  if (!isPaid) {
    // Free tier: Load from local public folder or public-assets bucket
    try {
      // First try local public folder to save bandwidth
      const res = await fetch('/free_georgia_land_10_lead_sample.csv');
      if (res.ok) {
        return { data: await res.text(), error: null, filename: 'free_georgia_land_10_lead_sample.csv' };
      }
      
      // Fallback to Supabase public bucket
      const { data, error } = await supabase.storage
        .from('public-assets')
        .download('free_georgia_land_10_lead_sample.csv');
        
      if (error) throw error;
      return { data: await data.text(), error: null, filename: 'free_georgia_land_10_lead_sample.csv' };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to load free sample data.', filename: '' };
    }
  }

  // Paid tier: Load protected dataset securely
  try {
    const { data, error } = await supabase.storage
      .from('protected-datasets')
      .download('georgia_low_cost_land_opportunities_enriched.csv');

    if (error) {
      // Handle the case where the user has the tier but the bucket isn't set up yet
      // Fallback to local free sample in DEV mode so app doesn't crash completely
      if (import.meta.env.DEV) {
        console.warn('Supabase download failed. Make sure your "protected-datasets" bucket has the file.', error);
        console.warn('Falling back to free sample data for local development.');
        const res = await fetch('/free_georgia_land_10_lead_sample.csv');
        if (res.ok) {
          return { data: await res.text(), error: null, filename: 'free_georgia_land_10_lead_sample.csv (DEV Fallback)' };
        }
      }
      throw error;
    }

    return { data: await data.text(), error: null, filename: 'georgia_low_cost_land_opportunities_enriched.csv' };
  } catch (err: any) {
    console.error('Secure data fetch error:', err);
    return { data: null, error: err.message || 'Failed to download secure dataset. Verify your subscription or contact support.', filename: '' };
  }
}
