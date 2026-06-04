export interface LandProperty {
  Priority_Rank: string;
  Property_Name_or_Address: string;
  City: string;
  County: string;
  State: string;
  Zip_Code?: string;
  Zip?: string; // Support both Zip and Zip_Code
  Parcel_ID: string;
  Lot_Size_Acres: string;
  Acquisition_Type: string;
  Estimated_Price_or_Min_Bid: string;
  Price_Category: string;
  Zoning: string;
  Property_Type: string;
  Fit_Score_0_to_100: string;
  Risk_Score_0_to_100: string;
  Affordable_Housing_Requirement: string;
  Redemption_Risk: string;
  Flood_Risk_Status: string;
  Title_Status: string;
  Utilities_Available?: string;
  Utilities_Status?: string; // Support both Utilities_Available and Utilities_Status
  Access_Road?: string;
  Road_Access?: string; // Support both Access_Road and Road_Access
  Metro_Atlanta?: string;
  Source_Name?: string;
  Source_Agency?: string; // Support both Source_Name and Source_Agency
  Source_URL: string;
  Property_Page_URL: string;
  Map_URL: string;
  GIS_URL: string;
  Listing_Date?: string;
  Last_Updated?: string;
  Recommended_Next_Action: string;
  Pros: string;
  Cons: string;
  Notes: string;
  Latitude: string;
  Longitude: string;

  // New Enriched Fields
  Region_Tier?: string;
  Metro_Area?: string;
  Distance_From_Atlanta_Miles?: string;
  Nearest_Major_City?: string;
  Neighborhood_or_District?: string;
  Census_Tract?: string;
  Opportunity_Zone_Status?: string;
  AMI_Target_If_Affordable?: string;
  Eligible_Buyer_Type?: string;
  Developer_Experience_Required?: string;
  Nonprofit_Only?: string;
  Individual_Buyer_Allowed?: string;
  Owner_Occupant_Required?: string;
  Builder_Required_Before_Closing?: string;
  Proof_of_Funds_Required?: string;
  Financing_Preapproval_Required?: string;
  Application_Deadline?: string;
  Auction_Date?: string;
  Deposit_Required?: string;
  Estimated_Closing_Costs?: string;
  Estimated_Title_Search_Cost?: string;
  Estimated_Survey_Cost?: string;
  Estimated_Legal_Cost?: string;
  Estimated_Quiet_Title_or_Redemption_Cost?: string;
  Estimated_Utility_Connection_Cost?: string;
  Estimated_Site_Clearing_Cost?: string;
  Estimated_Total_Acquisition_Cost_Low?: string;
  Estimated_Total_Acquisition_Cost_High?: string;
  Estimated_Development_Readiness?: string;
  Nearest_Transit?: string;
  Nearest_School?: string;
  Nearest_Park?: string;
  Nearest_Grocery_or_Commercial_Corridor?: string;
  Walkability_Notes?: string;
  Transit_Access_Notes?: string;
  Job_Center_Access_Notes?: string;
  Redevelopment_Priority_Area?: string;
  Blight_or_Code_Enforcement_Status?: string;
  Public_Ownership_Status?: string;
  Land_Bank_Status?: string;
  Tax_Sale_Status?: string;
  Sheriff_Sale_Status?: string;
  Surplus_Property_Status?: string;
  Repository_Status?: string;
  Days_Since_Source_Updated?: string;
  Source_Freshness?: string;
  Data_Confidence_0_to_100?: string;
  Monetization_Value_0_to_100?: string;
  Buyer_Profile?: string;
  Best_Use_Case?: string;
  Deal_Type?: string;
  Investor_Angle?: string;
  Affordable_Housing_Angle?: string;
  Small_Builder_Angle?: string;
  First_Time_Buyer_Angle?: string;
  Content_Marketing_Angle?: string;
  Alert_Worthy?: string;
  Avoid_Flag?: string;
  Avoid_Reason?: string;
  Contact_Agency_Name?: string;
  Contact_Email?: string;
  Contact_Phone?: string;
  Contact_Form_URL?: string;
  Next_Call_Script?: string;
  Researcher_Notes?: string;

  // Audit & Verification Fields
  First_Seen_Date?: string;
  Last_Checked_Date?: string;
  Last_Seen_Active_Date?: string;
  Listing_Status?: string;
  Previous_Status?: string;
  Status_Changed?: string;
  Previous_Price?: string;
  Price_Changed?: string;
  Previous_Source_URL?: string;
  Source_URL_Status?: string;
  Source_Last_Modified_Date?: string;
  Source_Snapshot_File?: string;
  Change_Log?: string;
  Change_Type?: string;
  Change_Severity?: string;
  Verification_Level?: string;
  Human_Reviewed?: string;
  Human_Reviewer_Notes?: string;
  Score_Explanation?: string;
  Risk_Score_explanation?: string;
  Fit_Score_explanation?: string;
  Risk_Score_Explanation?: string;
  Fit_Score_Explanation?: string;
  Data_Source_Type?: string;
  Official_Source_Confirmed?: string;

  [key: string]: any;
}

export type ViewMode = 'table' | 'card' | 'map';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: keyof LandProperty;
  direction: SortDirection;
}

export interface Filters {
  search: string;
  city: string;
  county: string;
  acquisitionType: string;
  priceCategory: string;
  zoning: string;
  propertyType: string;
  
  // New Enriched Filters
  regionTier: string;
  metroArea: string;
  dealType: string;
  buyerProfile: string;
  sourceFreshness: string;
  readiness: string;
  eligibleBuyerType: string;
  individualBuyerAllowed: string;
  nonprofitOnly: string;
  builderRequired: string;
  alertWorthy: string;
  avoidFlag: string;
  
  // New Ranges
  fitScoreMin: number;
  fitScoreMax: number;
  riskScoreMin: number;
  riskScoreMax: number;
  dataConfidenceMin: number;
  dataConfidenceMax: number;
  monetizationValueMin: number;
  monetizationValueMax: number;

  // Legacy/Compatibility Filters
  affordableHousingReq: string;
  redemptionRisk: string;
  floodRiskStatus: string;
  titleStatus: string;
  under50k: boolean;
  atlantaOnly: boolean;
  metroAtlantaOnly: boolean;
  lowRiskOnly: boolean;
  needsVerification: boolean;
}

export interface Favorite {
  parcelId: string;
  address: string;
  notes: string;
  addedAt: string;
}

export interface PropertyNote {
  parcelId: string;
  notes: string;
  updatedAt: string;
}

export interface Sponsor {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  imageUrl?: string;
  placements: ('sidebar' | 'footer' | 'report' | 'alert_email')[];
  active: boolean;
}
