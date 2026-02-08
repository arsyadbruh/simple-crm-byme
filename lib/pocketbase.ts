import PocketBase from 'pocketbase';
import type { 
  UsersRecord, 
  ForecastsRecord, 
  ForecastsExpanded,
  ActivitiesRecord,
  ActivitiesExpanded,
  InstitutionsRecord,
  ContactsRecord,
  ProgramsRecord,
  SubProgramsRecord,
  ProductsRecord,
  GlobalTargetsRecord
} from './pocketbase-types';

// Initialize PocketBase client
const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const pb = new PocketBase(pbUrl);

// Disable auto cancellation for better UX with React Query
pb.autoCancellation(false);

/**
 * Create a PocketBase client for server-side usage
 * This function should be called on each request to ensure fresh auth state
 */
export function createServerClient(authCookie?: string) {
  const serverPb = new PocketBase(pbUrl);
  serverPb.autoCancellation(false);
  
  if (authCookie) {
    serverPb.authStore.loadFromCookie(authCookie);
  }
  
  return serverPb;
}

/**
 * Get the current authenticated user
 */
export function getCurrentUser(): UsersRecord | null {
  return pb.authStore.model as UsersRecord | null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return pb.authStore.isValid;
}

/**
 * Export auth cookie for server-side usage
 */
export function getAuthCookie(): string {
  return pb.authStore.exportToCookie();
}

export default pb;

// Export typed collection names
export const Collections = {
  Users: 'users',
  Programs: 'programs',
  SubPrograms: 'sub_programs',
  Products: 'products',
  Institutions: 'institutions',
  Contacts: 'contacts',
  Forecasts: 'forecasts',
  Activities: 'activities',
  GlobalTargets: 'global_targets',
} as const;
