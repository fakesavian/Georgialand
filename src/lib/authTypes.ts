export type AccessLevel = 
  | 'free_preview' 
  | 'report_buyer' 
  | 'alerts_subscriber' 
  | 'dashboard_starter' 
  | 'dashboard_pro' 
  | 'dashboard_investor' 
  | 'admin';

export interface UserProfile {
  id: string;
  email: string | null;
  access_level: AccessLevel;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}
