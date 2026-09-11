/**
 * The API's response shapes, mirrored from the Java DTOs in costonomy-jobs-api.
 *
 * Dates arrive as `LocalDateTime` strings with no offset ("2026-10-14T09:30:00")
 * and are **UTC** — see `parseServerDate` in lib/format.ts. Dates-only
 * ("2026-10-15") are calendar days and are never converted.
 */

export type ApplicationStatusCode =
  | 'APPLIED' | 'VIEWED' | 'SHORTLISTED' | 'INTERVIEW' | 'SELECTED' | 'OFFERED'
  | 'OFFER_ACCEPTED' | 'JOINED' | 'DID_NOT_JOIN' | 'REJECTED' | 'WITHDRAWN';

export type Availability = 'IMMEDIATE' | 'WITHIN_15_DAYS' | 'WITHIN_30_DAYS' | 'NOT_LOOKING';
export type JoiningRequirement = 'IMMEDIATE' | 'WITHIN_15_DAYS' | 'WITHIN_30_DAYS' | 'FLEXIBLE';
export type Shift = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' | 'FLEXIBLE';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME';
export type RestaurantRole = 'OWNER' | 'ADMIN' | 'HR_RECRUITER' | 'OUTLET_MANAGER';

export interface Envelope<T> {
  data: T;
  error: { code: string; message: string; fieldErrors: { field: string; message: string }[] } | null;
  meta: { nextCursor?: string; hasMore: boolean } | null;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthenticatedUser {
  id: number;
  name: string | null;
  mobileNumber: string;
  preferredLanguage: 'en' | 'hi';
  isNewUser: boolean;
}

export interface EmployeeContext {
  employeeId: number;
  profileCompletionPercentage: number;
}

export interface Membership {
  restaurantUserId: number;
  restaurantId: number;
  restaurantName: string;
  role: RestaurantRole;
  outletIds: number[];
}

export interface Me {
  user: AuthenticatedUser;
  employeeProfile: EmployeeContext | null;
  restaurantMemberships: Membership[];
}

export interface VerifyOtpResponse extends Me {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

// ── Taxonomy ─────────────────────────────────────────────────────────────────

export interface Role { id: number; name: string; nameDisplay: string; category: string; sortOrder: number }
export interface Skill { id: number; name: string; nameDisplay: string; category: string | null }
export interface City { id: number; name: string; nameDisplay: string; state: string; isActive: boolean }
export interface Locality { id: number; name: string; nameDisplay: string; cityId: number }

// ── Candidate ────────────────────────────────────────────────────────────────

export interface Profile {
  id: number;
  userId: number;
  name: string | null;
  mobileNumber: string;
  profilePhotoUrl: string | null;
  currentCityId: number | null;
  currentCityDisplay: string | null;
  currentLocalityId: number | null;
  currentLocalityDisplay: string | null;
  primaryRoleId: number | null;
  primaryRoleDisplay: string | null;
  totalExperienceMonths: number;
  currentSalary: number | null;
  expectedSalary: number | null;
  availability: Availability;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'EITHER';
  profileVisibility: 'VISIBLE' | 'HIDDEN';
  profileCompletionPercentage: number;
  missingFields: string[];
}

export interface ProfileUpdate {
  name?: string | null;
  currentCityId?: number | null;
  currentLocalityId?: number | null;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  primaryRoleId?: number | null;
  totalExperienceMonths?: number | null;
  currentSalary?: number | null;
  expectedSalary?: number | null;
  availability?: Availability | null;
  employmentType?: string | null;
  profileVisibility?: string | null;
}

export type Proficiency = 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';

export interface MySkill {
  skillId: number;
  name: string;
  nameDisplay: string;
  category: string | null;
  experienceMonths: number | null;
  proficiency: Proficiency | null;
}

export interface Experience {
  id: number;
  restaurantName: string | null;
  restaurantId: number | null;
  outletId: number | null;
  roleId: number;
  roleDisplay: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string | null;
  verificationStatus: string;
  durationMonths: number;
}

export interface ExperienceInput {
  restaurantNameFreetext: string;
  roleId: number;
  startDate: string;
  endDate: string | null;
  description?: string | null;
}

export interface Preferences {
  preferredLocations: { id: number; cityId: number; cityDisplay: string; localityId: number | null; localityDisplay: string | null }[];
  preferredRoleIds: number[];
  preferredShifts: Shift[];
}

// ── Jobs ─────────────────────────────────────────────────────────────────────

export interface Job {
  id: number;
  title: string;
  roleId: number;
  roleDisplay: string | null;
  restaurantId: number;
  restaurantName: string | null;
  logoUrl: string | null;
  outletId: number;
  outletName: string | null;
  outletAddress: string | null;
  cityId: number | null;
  cityDisplay: string | null;
  localityId: number | null;
  localityDisplay: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  minSalary: number | null;
  maxSalary: number | null;
  salaryPeriod: 'MONTHLY' | 'DAILY' | 'HOURLY';
  experienceMinMonths: number | null;
  experienceMaxMonths: number | null;
  openings: number;
  joiningRequirement: JoiningRequirement;
  employmentType: EmploymentType;
  shift: Shift | null;
  workingHours: string | null;
  benefits: string | null;
  accommodationProvided: boolean;
  mealsProvided: boolean;
  weeklyOffDays: number | null;
  status: 'DRAFT' | 'OPEN' | 'PAUSED' | 'FILLED' | 'CLOSED' | 'EXPIRED';
  publishedAt: string | null;
  closingAt: string | null;
  skills: { skillId: number; name: string; nameDisplay: string; required: boolean }[];
  myApplication: { applicationId: number | null; status: ApplicationStatusCode | null; canApply: boolean } | null;
  matchScore: number | null;
}

export interface JobInput {
  outletId: number;
  roleId: number;
  title?: string | null;
  description?: string | null;
  minSalary?: number | null;
  maxSalary?: number | null;
  salaryPeriod?: string;
  experienceMinMonths?: number | null;
  experienceMaxMonths?: number | null;
  openings?: number;
  joiningRequirement?: JoiningRequirement;
  employmentType?: EmploymentType;
  shift?: Shift | null;
  accommodationProvided?: boolean;
  mealsProvided?: boolean;
  skillIds?: number[];
  publish?: boolean;
}

export interface FeedParams {
  cityId: number;
  localityId?: number;
  roleId?: number;
  minSalary?: number;
  joiningRequirement?: JoiningRequirement;
  shift?: Shift;
  skillIds?: number[];
  q?: string;
  sort?: 'newest' | 'relevance';
}

// ── Applications & hiring ────────────────────────────────────────────────────

export interface TimelineEntry { status: ApplicationStatusCode; at: string; reason: string | null; systemGenerated: boolean }

export interface Application {
  id: number;
  jobId: number;
  jobTitle: string | null;
  restaurantId: number | null;
  restaurantName: string | null;
  logoUrl: string | null;
  outletId: number | null;
  outletName: string | null;
  employeeId: number;
  candidateName: string | null;
  status: ApplicationStatusCode;
  source: string;
  coverNote: string | null;
  attemptNo: number;
  appliedAt: string;
  timeline: TimelineEntry[];
  candidate: { primaryRoleId: number | null; totalExperienceMonths: number | null; expectedSalary: number | null; availability: Availability; profilePhotoUrl: string | null } | null;
  matchScore: number | null;
}

export type InterviewStatusCode = 'PROPOSED' | 'CONFIRMED' | 'RESCHEDULED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

export interface Interview {
  id: number;
  applicationId: number;
  restaurantId: number;
  restaurantName: string | null;
  outletId: number;
  outletName: string | null;
  outletAddress: string | null;
  scheduledAt: string;
  durationMinutes: number;
  interviewType: 'IN_PERSON' | 'PHONE' | 'VIDEO';
  location: string | null;
  status: InterviewStatusCode;
  cancelledBy: string | null;
  cancellationReason: string | null;
  previousScheduledAt: string | null;
  rescheduleCount: number;
  completedAt: string | null;
  notes: string | null;
  jobTitle: string | null;
  candidateName: string | null;
}

export type OfferStatusCode = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED';

export interface Offer {
  id: number;
  applicationId: number;
  jobId: number;
  jobTitle: string | null;
  employeeId: number;
  candidateName: string | null;
  restaurantId: number;
  restaurantName: string | null;
  outletId: number;
  outletName: string | null;
  roleId: number;
  roleDisplay: string | null;
  salary: number;
  joiningDate: string;
  benefits: string | null;
  status: OfferStatusCode;
  sentAt: string | null;
  expiresAt: string | null;
  respondedAt: string | null;
  declineReason: string | null;
  joiningState: string | null;
}

export interface CheckInStatus {
  open: boolean;
  opensAt: string;
  closesAt: string;
  notYetOpen: boolean;
  outletReady: boolean | null;
  existing: { checkInId: number; checkedInAt: string; recorded: boolean; locationConfirmed: boolean } | null;
}

// ── Restaurant ───────────────────────────────────────────────────────────────

export interface Restaurant {
  id: number;
  name: string;
  restaurantType: string | null;
  description: string | null;
  logoUrl: string | null;
  status: string;
  outletCount: number;
  myRole: RestaurantRole;
}

export interface Outlet {
  id: number;
  restaurantId: number;
  name: string;
  address: string | null;
  cityId: number;
  cityDisplay: string | null;
  localityId: number | null;
  localityDisplay: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  checkInReady: boolean;
}

export interface OutletInput {
  name: string;
  address?: string | null;
  cityId: number;
  localityId?: number | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface TeamMember {
  restaurantUserId: number;
  userId: number;
  name: string | null;
  mobileNumber: string;
  role: RestaurantRole;
  status: string;
  outletIds: number[];
  allOutlets: boolean;
  pendingFirstSignIn: boolean;
}

export interface CandidateResult {
  employeeId: number;
  name: string | null;
  profilePhotoUrl: string | null;
  primaryRoleId: number | null;
  primaryRoleDisplay: string | null;
  localityId: number | null;
  localityDisplay: string | null;
  totalExperienceMonths: number;
  expectedSalary: number | null;
  availability: Availability;
  profileCompletionPercentage: number;
  matchScore: number;
  matchSignals: Record<string, number>;
}

// ── Notifications ────────────────────────────────────────────────────────────

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  entityType: 'APPLICATION' | 'INTERVIEW' | 'OFFER' | 'JOB' | null;
  entityId: number | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationSetting {
  type: string;
  audience: 'EMPLOYEE' | 'RESTAURANT';
  pushEnabled: boolean;
  pushConfigurable: boolean;
}

// ── Media ────────────────────────────────────────────────────────────────────

/** Where to PUT a file, and the token that attaches it once it has arrived. */
export interface UploadTicket {
  uploadToken: string;
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
  expiresAt: string;
}

export type DocumentType = 'RESUME' | 'CERTIFICATE' | 'OTHER';

export interface EmployeeDocument {
  id: number;
  type: DocumentType;
  title: string | null;
  contentType: string;
  sizeBytes: number;
  fileName: string | null;
  /** Signed; works for about 15 minutes, so fetch the list again before opening an old one. */
  url: string;
  createdAt: string;
}

/** From the logged contact reveal only. */
export interface CandidateContact {
  employeeId: number;
  name: string | null;
  mobileNumber: string;
}
