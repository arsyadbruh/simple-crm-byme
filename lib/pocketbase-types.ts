/**
 * PocketBase TypeScript Type Definitions
 * Generated from pb_schema.json (Updated)
 */

export interface BaseRecord {
  id: string;
  created: string;
  updated: string;
}

// ============= Users Collection =============
export interface UsersRecord extends BaseRecord {
  username?: string;
  email: string;
  emailVisibility?: boolean;
  verified?: boolean;
  name?: string;
  avatar?: string;
  job_title?: string;
}

// ============= Programs Collection =============
export interface ProgramsRecord extends BaseRecord {
  code?: string;
  name?: string;
  description?: string;
  segments?: ('CSR' | 'Yayasan' | 'Pemerintah' | 'Sekolah' | 'Other')[];
}

// ============= Sub Programs Collection =============
export interface SubProgramsRecord extends BaseRecord {
  name?: string;
  code?: string;
  program_relation?: string; // Relation to programs
}

export interface SubProgramsExpanded extends SubProgramsRecord {
  expand?: {
    program_relation?: ProgramsRecord;
  };
}

// ============= Products Collection =============
export interface ProductsRecord extends BaseRecord {
  name?: string;
  code?: string;
  description?: string;
  program_relation?: string; // Relation to programs (NOT sub_programs)
  base_price?: number;
}

export interface ProductsExpanded extends ProductsRecord {
  expand?: {
    program_relation?: ProgramsRecord;
  };
}

// ============= Institutions Collection =============
export interface InstitutionsRecord extends BaseRecord {
  code?: string;
  national_number?: string;
  name?: string;
  type?: 'Yayasan' | 'CSR' | 'Pemerintah' | 'Sekolah' | 'Other';
  status?: 'New' | 'Existing Customer' | 'Blacklist';
  city?: string;
  address?: string;
  website?: string;
  first_buy_date?: string;
}

// ============= Contacts Collection =============
export interface ContactsRecord extends BaseRecord {
  name?: string;
  position?: string;
  is_primary?: boolean;
  phone?: string;
  email?: string;
  status?: 'Active' | 'Non Active';
  institution_relation?: string; // Relation to institutions
}

export interface ContactsExpanded extends ContactsRecord {
  expand?: {
    institution_relation?: InstitutionsRecord;
  };
}

// ============= Forecasts Collection =============
export type ForecastStatus = 'Cold' | 'Warm' | 'Hot' | 'Closing' | 'Cancel';
export type TargetMonth = 'Januari' | 'Februari' | 'Maret' | 'April' | 'Mei' | 'Juni' | 'Juli' | 'Agustus' | 'September' | 'Oktober' | 'November' | 'Desember';
export type TargetWeek = 'Pekan 1' | 'Pekan 2' | 'Pekan 3' | 'Pekan 4' | 'Pekan5';

export interface ForecastsRecord extends BaseRecord {
  target_program: string; // Required relation to programs
  target_sub_program?: string; // Optional relation to sub programs
  institution: string; // Required relation to institutions
  target_year?: string;
  target_month?: TargetMonth;
  target_week?: TargetWeek;
  target_proposal?: string;
  target_omset?: number;
  status?: ForecastStatus;
  fix_omset?: number;
  closing_date?: string;
  pic?: string; // Relation to users
  notes?: string;
}

export interface ForecastsExpanded extends ForecastsRecord {
  expand?: {
    target_program?: ProgramsRecord;
    target_sub_program?: SubProgramsRecord;
    institution?: InstitutionsRecord;
    pic?: UsersRecord;
  };
}

// ============= Activities Collection =============
export type ActivityType = 'Call' | 'Visit' | 'Meeting' | 'Demo' | 'WhatsApp';

export interface ActivitiesRecord extends BaseRecord {
  next_action_date?: string;
  contact?: string; // Relation to contacts
  outcome?: string;
  summary?: string;
  details?: string;
  next_action?: string;
  date_contacted?: string;
  is_responded?: boolean;
  type?: ActivityType;
  link_record?: string;
  spk_proposal?: string; // File field
  pic?: string; // Relation to users
  target_forecast?: string; // Relation to forecasts
}

export interface ActivitiesExpanded extends ActivitiesRecord {
  expand?: {
    contact?: ContactsRecord;
    pic?: UsersRecord;
    target_forecast?: ForecastsExpanded;
  };
}

// ============= Global Targets Collection =============
export interface GlobalTargetsRecord extends BaseRecord {
  period_year?: string;
  period_month?: TargetMonth;
  period_week?: TargetWeek;
  target_revenue?: number;
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
  pic?: string;
  institution?: string;
  status?: ForecastStatus;
  target_month?: TargetMonth;
  target_program?: string;
  target_sub_program?: string;
}

export interface ActivityFilters {
  pic?: string;
  target_forecast?: string;
  type?: ActivityType;
  from_date?: string;
  to_date?: string;
}
