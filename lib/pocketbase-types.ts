/**
 * PocketBase TypeScript Type Definitions
 * Generated from pb_schema.json
 */

export interface BaseRecord {
  id: string;
  created: string;
  updated: string;
}

// ============= Users Collection =============
export interface UsersRecord extends BaseRecord {
  username: string;
  email: string;
  emailVisibility: boolean;
  verified: boolean;
  name?: string;
  avatar?: string;
  role?: 'Admin' | 'Manager' | 'Sales Rep';
  job_title?: string;
}

// ============= Programs Collection (Level 1) =============
export interface ProgramsRecord extends BaseRecord {
  name: string;
  code?: string;
  description?: string;
  is_active?: boolean;
}

// ============= Sub Programs Collection (Level 2) =============
export interface SubProgramsRecord extends BaseRecord {
  name: string;
  code?: string;
  program_id: string;
  description?: string;
  is_active?: boolean;
}

export interface SubProgramsExpanded extends SubProgramsRecord {
  expand?: {
    program_id: ProgramsRecord;
  };
}

// ============= Products Collection (Level 3) =============
export interface ProductsRecord extends BaseRecord {
  name: string;
  code?: string;
  sub_program_id: string;
  price?: number;
  unit?: string;
  description?: string;
  is_active?: boolean;
}

export interface ProductsExpanded extends ProductsRecord {
  expand?: {
    sub_program_id: SubProgramsExpanded;
  };
}

// ============= Institutions Collection =============
export interface InstitutionsRecord extends BaseRecord {
  name: string;
  type?: 'School' | 'Foundation' | 'Government' | 'Private' | 'Other';
  status?: 'New' | 'Existing Customer' | 'Blacklist';
  address?: string;
  city?: string;
  province?: string;
  phone?: string;
  email?: string;
  website?: string;
  notes?: string;
}

// ============= Contacts Collection =============
export interface ContactsRecord extends BaseRecord {
  institution_id: string;
  name: string;
  job_title?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  is_primary?: boolean;
  notes?: string;
}

export interface ContactsExpanded extends ContactsRecord {
  expand?: {
    institution_id: InstitutionsRecord;
  };
}

// ============= Forecasts Collection (The Central Deal Table) =============
export type ForecastStatus = 
  | 'Planning' 
  | 'Approaching' 
  | 'Negotiation' 
  | 'Closed Won' 
  | 'Closed Lost';

export interface ForecastsRecord extends BaseRecord {
  user_id: string;
  institution_id: string;
  program_id: string;
  sub_program_id?: string;
  product_id?: string;
  
  // Deal Info
  project_title: string;
  target_month: string; // Format: YYYY-MM
  target_week?: number; // 1-4
  target_amount: number;
  
  // Closing Info
  status: ForecastStatus;
  fix_omset?: number; // Actual revenue when Closed Won
  closing_date?: string;
  
  // Probabilities
  probability?: number; // 0-100
  
  notes?: string;
}

export interface ForecastsExpanded extends ForecastsRecord {
  expand?: {
    user_id: UsersRecord;
    institution_id: InstitutionsRecord;
    program_id: ProgramsRecord;
    sub_program_id: SubProgramsRecord;
    product_id: ProductsRecord;
  };
}

// ============= Activities Collection =============
export type ActivityType = 'Call' | 'Visit' | 'Meeting' | 'Email' | 'WhatsApp' | 'Other';

export interface ActivitiesRecord extends BaseRecord {
  user_id: string;
  institution_id: string;
  forecast_id?: string;
  
  activity_type: ActivityType;
  subject: string;
  description?: string;
  activity_date: string;
  next_action_date?: string;
  
  // Contact person involved
  contact_id?: string;
}

export interface ActivitiesExpanded extends ActivitiesRecord {
  expand?: {
    user_id: UsersRecord;
    institution_id: InstitutionsRecord;
    forecast_id: ForecastsRecord;
    contact_id: ContactsRecord;
  };
}

// ============= Global Targets Collection =============
export interface GlobalTargetsRecord extends BaseRecord {
  year: number;
  month: number;
  target_revenue: number;
  description?: string;
}

// ============= Helper Types =============
export type Collections = 
  | 'users'
  | 'programs'
  | 'sub_programs'
  | 'products'
  | 'institutions'
  | 'contacts'
  | 'forecasts'
  | 'activities'
  | 'global_targets';

// Query Parameter Types
export interface ForecastFilters {
  user_id?: string;
  institution_id?: string;
  status?: ForecastStatus;
  target_month?: string;
  program_id?: string;
}

export interface ActivityFilters {
  user_id?: string;
  institution_id?: string;
  forecast_id?: string;
  activity_type?: ActivityType;
  from_date?: string;
  to_date?: string;
}
