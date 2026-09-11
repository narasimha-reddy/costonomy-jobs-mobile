import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api, type FeedParams } from '@/lib/api';
import { useLocale } from '@/lib/locale';
import { useSession } from '@/lib/session';

/**
 * Query hooks, one per resource, so screens share a cache key and a mutation in
 * one place refreshes every screen showing that thing.
 *
 * Reference data (roles, skills, localities) carries the locale in its key: the
 * API resolves `nameDisplay` from `Accept-Language`, so switching to Hindi must
 * refetch rather than keep showing English labels.
 */
export const keys = {
  roles: (locale: string) => ['roles', locale] as const,
  skills: (locale: string) => ['skills', locale] as const,
  localities: (cityId: number, locale: string) => ['localities', cityId, locale] as const,
  profile: ['profile'] as const,
  mySkills: ['profile', 'skills'] as const,
  experience: ['profile', 'experience'] as const,
  preferences: ['profile', 'preferences'] as const,
  myDocuments: ['profile', 'documents'] as const,
  conversations: (side: string, restaurantId: number | null) => ['conversations', side, restaurantId ?? 0] as const,
  thread: (applicationId: number) => ['conversations', 'thread', applicationId] as const,
  applicationDocuments: (id: number) => ['applications', id, 'documents'] as const,
  feed: (params: FeedParams) => ['feed', params] as const,
  job: (id: number) => ['job', id] as const,
  myApplications: ['applications', 'mine'] as const,
  myApplication: (id: number) => ['applications', 'mine', id] as const,
  applicationInterviews: (id: number) => ['applications', id, 'interviews'] as const,
  applicationOffer: (id: number) => ['applications', id, 'offer'] as const,
  interview: (id: number) => ['interview', id] as const,
  offer: (id: number) => ['offer', id] as const,
  checkIn: (kind: string, id: number) => ['checkIn', kind, id] as const,
  notifications: ['notifications'] as const,
  unread: ['notifications', 'unread'] as const,
  notificationPrefs: ['notifications', 'prefs'] as const,
  restaurants: ['restaurants'] as const,
  outlets: (restaurantId: number) => ['restaurants', restaurantId, 'outlets'] as const,
  team: (restaurantId: number) => ['restaurants', restaurantId, 'team'] as const,
  restaurantJobs: (restaurantId: number) => ['restaurants', restaurantId, 'jobs'] as const,
  jobApplications: (jobId: number) => ['job', jobId, 'applications'] as const,
  funnel: (jobId: number) => ['job', jobId, 'funnel'] as const,
  restaurantApplication: (id: number) => ['restaurantApplication', id] as const,
  calendar: (restaurantId: number) => ['restaurants', restaurantId, 'calendar'] as const,
  candidates: (restaurantId: number, query: object) => ['restaurants', restaurantId, 'candidates', query] as const,
};

const DAY = 24 * 60 * 60 * 1000;

// ── Reference data ───────────────────────────────────────────────────────────

export function useRoles() {
  const locale = useLocale();
  return useQuery({ queryKey: keys.roles(locale), queryFn: api.taxonomy.roles, staleTime: DAY });
}

export function useSkills() {
  const locale = useLocale();
  return useQuery({ queryKey: keys.skills(locale), queryFn: api.taxonomy.skills, staleTime: DAY });
}

export function useLocalities(cityId: number | null | undefined) {
  const locale = useLocale();
  return useQuery({
    queryKey: keys.localities(cityId ?? 0, locale),
    queryFn: () => api.taxonomy.localities(cityId!),
    enabled: cityId != null,
    staleTime: DAY,
  });
}

/** Role id → display name, for anything that carries only an id. */
export function useRoleName() {
  const roles = useRoles().data;
  return (id: number | null | undefined) => roles?.find((r) => r.id === id)?.nameDisplay ?? '';
}

// ── Candidate ────────────────────────────────────────────────────────────────

export function useProfile() {
  return useQuery({ queryKey: keys.profile, queryFn: api.profile.get });
}

export function useMySkills() {
  return useQuery({ queryKey: keys.mySkills, queryFn: api.profile.skills });
}

export function useExperience() {
  return useQuery({ queryKey: keys.experience, queryFn: api.profile.experience });
}

/** The inbox, refreshed every 30 seconds while it is on screen — the same cadence as the unread badge. */
export function useConversations(side: 'candidate' | 'restaurant') {
  const { restaurantId, status } = useSession();
  return useQuery({
    queryKey: keys.conversations(side, side === 'restaurant' ? restaurantId : null),
    queryFn: () => (side === 'candidate' ? api.messages.candidateInbox() : api.messages.restaurantInbox(restaurantId!)),
    enabled: status === 'signedIn' && (side === 'candidate' || restaurantId != null),
    refetchInterval: 30_000,
  });
}

export function useMyDocuments() {
  return useQuery({ queryKey: keys.myDocuments, queryFn: api.profile.documents });
}

/**
 * Document URLs are signed for fifteen minutes, so this refetches on focus and
 * treats ten minutes as stale: a link opened from a screen left open over lunch
 * would otherwise be dead.
 */
export function useApplicationDocuments(applicationId: number) {
  return useQuery({
    queryKey: keys.applicationDocuments(applicationId),
    queryFn: () => api.applications.documents(applicationId),
    enabled: applicationId > 0,
    staleTime: 10 * 60 * 1000,
  });
}

export function usePreferences() {
  return useQuery({ queryKey: keys.preferences, queryFn: api.profile.preferences });
}

export function useFeed(params: FeedParams, enabled = true) {
  return useInfiniteQuery({
    queryKey: keys.feed(params),
    queryFn: ({ pageParam }) => api.jobs.feed(params, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasMore ? last.nextOffset : null),
    enabled,
  });
}

export function useJob(id: number) {
  return useQuery({ queryKey: keys.job(id), queryFn: () => api.jobs.get(id), enabled: id > 0 });
}

/** A job as its restaurant sees it, drafts included. Shares the job key prefix, so invalidating a job refreshes both. */
export function useManagedJob(id: number) {
  return useQuery({ queryKey: [...keys.job(id), 'manage'], queryFn: () => api.jobs.manage(id), enabled: id > 0 });
}

export function useMyApplications() {
  return useQuery({ queryKey: keys.myApplications, queryFn: api.applications.mine });
}

export function useMyApplication(id: number) {
  return useQuery({ queryKey: keys.myApplication(id), queryFn: () => api.applications.mineOne(id) });
}

export function useApplicationInterviews(id: number, enabled = true) {
  return useQuery({
    queryKey: keys.applicationInterviews(id),
    queryFn: () => api.applications.interviews(id),
    enabled,
  });
}

/** Null when there is no offer yet — not an error. */
export function useApplicationOffer(id: number, enabled = true) {
  return useQuery({
    queryKey: keys.applicationOffer(id),
    queryFn: async () => {
      try {
        return await api.applications.offer(id);
      } catch (e) {
        if ((e as { code?: string }).code === 'OFFER_NOT_FOUND') return null;
        throw e;
      }
    },
    enabled,
  });
}

export function useInterview(id: number, enabled = true) {
  return useQuery({ queryKey: keys.interview(id), queryFn: () => api.interviews.get(id), enabled: enabled && id > 0 });
}

export function useOffer(id: number, enabled = true) {
  return useQuery({ queryKey: keys.offer(id), queryFn: () => api.offers.get(id), enabled: enabled && id > 0 });
}

export function useCheckInStatus(kind: 'interview' | 'joining', id: number, enabled = true) {
  return useQuery({
    queryKey: keys.checkIn(kind, id),
    queryFn: () => api.checkIn.status(kind, id),
    enabled,
    refetchInterval: 60_000,
  });
}

// ── Notifications ────────────────────────────────────────────────────────────

export function useNotifications() {
  const { role } = useSession();
  return useInfiniteQuery({
    queryKey: [...keys.notifications, role],
    queryFn: ({ pageParam }) => api.notifications.list(pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasMore ? last.nextOffset : null),
  });
}

/** The tab badge. Polled, because push delivery needs a native build. */
export function useUnreadCount() {
  const { status } = useSession();
  return useQuery({
    queryKey: keys.unread,
    queryFn: api.notifications.unreadCount,
    enabled: status === 'signedIn',
    refetchInterval: 30_000,
    select: (d) => d.unread,
  });
}

// ── Restaurant ───────────────────────────────────────────────────────────────

export function useActiveRestaurantId(): number | null {
  return useSession().restaurantId;
}

export function useRestaurants() {
  return useQuery({ queryKey: keys.restaurants, queryFn: api.restaurants.mine });
}

export function useOutlets(restaurantId: number | null) {
  return useQuery({
    queryKey: keys.outlets(restaurantId ?? 0),
    queryFn: () => api.restaurants.outlets(restaurantId!),
    enabled: restaurantId != null,
  });
}

export function useTeam(restaurantId: number | null) {
  return useQuery({
    queryKey: keys.team(restaurantId ?? 0),
    queryFn: () => api.restaurants.team(restaurantId!),
    enabled: restaurantId != null,
  });
}

export function useRestaurantJobs(restaurantId: number | null) {
  return useQuery({
    queryKey: keys.restaurantJobs(restaurantId ?? 0),
    queryFn: () => api.jobs.forRestaurant(restaurantId!),
    enabled: restaurantId != null,
  });
}

export function useJobApplications(jobId: number) {
  return useQuery({ queryKey: keys.jobApplications(jobId), queryFn: () => api.jobs.applications(jobId) });
}

export function useFunnel(jobId: number) {
  return useQuery({ queryKey: keys.funnel(jobId), queryFn: () => api.jobs.funnel(jobId) });
}

export function useRestaurantApplication(id: number) {
  return useQuery({ queryKey: keys.restaurantApplication(id), queryFn: () => api.applications.open(id) });
}

export function useCalendar(restaurantId: number | null) {
  return useQuery({
    queryKey: keys.calendar(restaurantId ?? 0),
    queryFn: () => {
      const from = new Date(Date.now() - 6 * 60 * 60 * 1000);
      const to = new Date(Date.now() + 14 * DAY);
      return api.interviews.calendar(restaurantId!, from.toISOString().slice(0, 19), to.toISOString().slice(0, 19));
    },
    enabled: restaurantId != null,
  });
}
