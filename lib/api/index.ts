import { call, request } from './client';
import type * as T from './types';

export { ApiError } from './client';
export type * from './types';

const PAGE = 20;

/**
 * Every endpoint the app uses, grouped the way the API's controllers are. Screens
 * never build a URL themselves.
 */
export const api = {
  auth: {
    sendOtp: (mobileNumber: string) =>
      call<{ otpSentTo: string; expiresInSeconds: number }>('/auth/send-otp', {
        method: 'POST', body: { mobileNumber }, authenticated: false,
      }),
    verifyOtp: (mobileNumber: string, otp: string, preferredLanguage: string) =>
      call<T.VerifyOtpResponse>('/auth/verify-otp', {
        method: 'POST', body: { mobileNumber, otp, preferredLanguage }, authenticated: false,
      }),
    refresh: (refreshToken: string) =>
      call<{ accessToken: string; refreshToken: string; expiresInSeconds: number }>('/auth/refresh', {
        method: 'POST', body: { refreshToken }, authenticated: false,
      }),
    logout: (refreshToken: string) =>
      call<void>('/auth/logout', { method: 'POST', body: { refreshToken } }),
  },

  me: {
    get: () => call<T.Me>('/users/me'),
    update: (body: { name?: string; preferredLanguage?: string }) =>
      call<T.Me>('/users/me', { method: 'PUT', body }),
    deleteAccount: (reason?: string) =>
      call<void>('/users/me/delete-request', { method: 'POST', body: { reason: reason || null } }),
  },

  taxonomy: {
    roles: () => call<T.Role[]>('/roles', { authenticated: false }),
    skills: () => call<T.Skill[]>('/skills', { authenticated: false }),
    cities: () => call<T.City[]>('/cities', { authenticated: false }),
    localities: (cityId: number) => call<T.Locality[]>(`/cities/${cityId}/localities`, { authenticated: false }),
  },

  profile: {
    get: () => call<T.Profile>('/employees/me'),
    update: (body: T.ProfileUpdate) => call<T.Profile>('/employees/me', { method: 'PUT', body }),
    skills: () => call<T.MySkill[]>('/employees/me/skills'),
    addSkill: (skillId: number) =>
      call<T.MySkill[]>('/employees/me/skills', { method: 'POST', body: { skillId } }),
    removeSkill: (skillId: number) => call<void>(`/employees/me/skills/${skillId}`, { method: 'DELETE' }),
    experience: () => call<T.Experience[]>('/employees/me/experience'),
    addExperience: (body: T.ExperienceInput) =>
      call<T.Experience>('/employees/me/experience', { method: 'POST', body }),
    deleteExperience: (id: number) => call<void>(`/employees/me/experience/${id}`, { method: 'DELETE' }),
    photoUpload: (contentType: string, sizeBytes: number) =>
      call<T.UploadTicket>('/employees/me/photo/uploads', { method: 'POST', body: { contentType, sizeBytes } }),
    setPhoto: (uploadToken: string) => call<T.Profile>('/employees/me/photo', { method: 'PUT', body: { uploadToken } }),
    removePhoto: () => call<T.Profile>('/employees/me/photo', { method: 'DELETE' }),
    documents: () => call<T.EmployeeDocument[]>('/employees/me/documents'),
    documentUpload: (contentType: string, sizeBytes: number) =>
      call<T.UploadTicket>('/employees/me/documents/uploads', { method: 'POST', body: { contentType, sizeBytes } }),
    addDocument: (body: { uploadToken: string; type: T.DocumentType; title?: string | null; fileName?: string | null }) =>
      call<T.EmployeeDocument>('/employees/me/documents', { method: 'POST', body }),
    deleteDocument: (id: number) => call<void>(`/employees/me/documents/${id}`, { method: 'DELETE' }),
    preferences: () => call<T.Preferences>('/employees/me/preferences'),
    updatePreferences: (body: {
      preferredLocations?: { cityId: number; localityId: number | null }[];
      preferredRoleIds?: number[];
      preferredShifts?: string[];
    }) => call<T.Preferences>('/employees/me/preferences', { method: 'PUT', body }),
  },

  jobs: {
    feed: (params: T.FeedParams, offset = 0) =>
      request<T.Job[]>('/jobs', { query: { ...params, limit: PAGE, offset } }),
    get: (id: number) => call<T.Job>(`/jobs/${id}`),
    apply: (id: number, coverNote?: string) =>
      call<T.Application>(`/jobs/${id}/apply`, { method: 'POST', body: { coverNote: coverNote || null, source: 'BROWSE' } }),
    create: (body: T.JobInput) => call<T.Job>('/jobs', { method: 'POST', body }),
    update: (id: number, body: T.JobInput) => call<T.Job>(`/jobs/${id}`, { method: 'PUT', body }),
    transition: (id: number, action: 'publish' | 'pause' | 'resume' | 'close') =>
      call<T.Job>(`/jobs/${id}/${action}`, { method: 'POST' }),
    forRestaurant: (restaurantId: number) => call<T.Job[]>(`/restaurants/${restaurantId}/jobs`),
    applications: (jobId: number) => call<T.Application[]>(`/jobs/${jobId}/applications`),
    funnel: (jobId: number) => call<Record<string, number>>(`/jobs/${jobId}/funnel`),
  },

  applications: {
    mine: () => call<T.Application[]>('/employees/me/applications'),
    mineOne: (id: number) => call<T.Application>(`/employees/me/applications/${id}`),
    withdraw: (id: number) => call<T.Application>(`/applications/${id}/withdraw`, { method: 'POST' }),
    open: (id: number) => call<T.Application>(`/applications/${id}`),
    shortlist: (id: number) => call<T.Application>(`/applications/${id}/shortlist`, { method: 'POST' }),
    reject: (id: number, reason?: string) =>
      call<T.Application>(`/applications/${id}/reject`, { method: 'POST', body: { reason: reason || null } }),
    select: (id: number) => call<T.Application>(`/applications/${id}/select`, { method: 'POST' }),
    interviews: (id: number) => call<T.Interview[]>(`/applications/${id}/interviews`),
    offer: (id: number) => call<T.Offer>(`/applications/${id}/offer`),
    documents: (id: number) => call<T.EmployeeDocument[]>(`/applications/${id}/documents`),
  },

  interviews: {
    get: (id: number) => call<T.Interview>(`/interviews/${id}`),
    propose: (applicationId: number, body: {
      scheduledAt: string; durationMinutes: number; interviewType: string; location?: string | null; notes?: string | null;
    }) => call<T.Interview>(`/applications/${applicationId}/interviews`, { method: 'POST', body }),
    confirm: (id: number) => call<T.Interview>(`/interviews/${id}/confirm`, { method: 'POST' }),
    reschedule: (id: number, scheduledAt: string) =>
      call<T.Interview>(`/interviews/${id}/reschedule`, { method: 'POST', body: { scheduledAt } }),
    cancel: (id: number, reason?: string) =>
      call<T.Interview>(`/interviews/${id}/cancel`, { method: 'POST', body: { reason: reason || null } }),
    complete: (id: number, outcome: 'COMPLETED' | 'NO_SHOW') =>
      call<T.Interview>(`/interviews/${id}/complete`, { method: 'POST', body: { outcome } }),
    calendar: (restaurantId: number, from: string, to: string) =>
      call<T.Interview[]>(`/restaurants/${restaurantId}/interviews`, { query: { from, to } }),
  },

  offers: {
    get: (id: number) => call<T.Offer>(`/offers/${id}`),
    mine: () => call<T.Offer[]>('/employees/me/offers'),
    create: (applicationId: number, body: { salary: number; joiningDate: string; benefits?: string | null; send: boolean }) =>
      call<T.Offer>(`/applications/${applicationId}/offers`, { method: 'POST', body }),
    accept: (id: number) => call<T.Offer>(`/offers/${id}/accept`, { method: 'POST' }),
    decline: (id: number, reason?: string) =>
      call<T.Offer>(`/offers/${id}/decline`, { method: 'POST', body: { reason: reason || null } }),
    cancel: (id: number, reason?: string) =>
      call<T.Offer>(`/offers/${id}/cancel`, { method: 'POST', body: { reason: reason || null } }),
    recordJoining: (applicationId: number, body: { outcome: string; outcomeDate?: string; reason?: string | null }) =>
      call<unknown>(`/applications/${applicationId}/joining-status`, { method: 'POST', body }),
  },

  checkIn: {
    status: (kind: 'interview' | 'joining', id: number) =>
      call<T.CheckInStatus>(kind === 'interview' ? `/interviews/${id}/check-in` : `/offers/${id}/joining-check-in`),
    record: (kind: 'interview' | 'joining', id: number, body: {
      latitude?: number | null; longitude?: number | null; accuracyMeters?: number | null;
      locationPermissionStatus: 'GRANTED' | 'DENIED'; isMockLocationSuspected?: boolean;
    }) => call<{ checkInId: number; checkedInAt: string; recorded: boolean; locationConfirmed: boolean }>(
      kind === 'interview' ? `/interviews/${id}/check-in` : `/offers/${id}/joining-check-in`,
      { method: 'POST', body }),
  },

  restaurants: {
    mine: () => call<T.Restaurant[]>('/restaurants/me'),
    get: (id: number) => call<T.Restaurant>(`/restaurants/${id}`),
    create: (body: { name: string; restaurantType?: string | null; description?: string | null; firstOutlet: T.OutletInput }) =>
      call<T.Restaurant>('/restaurants', { method: 'POST', body }),
    update: (id: number, body: { name: string; restaurantType?: string | null; description?: string | null }) =>
      call<T.Restaurant>(`/restaurants/${id}`, { method: 'PUT', body }),
    logoUpload: (id: number, contentType: string, sizeBytes: number) =>
      call<T.UploadTicket>(`/restaurants/${id}/logo/uploads`, { method: 'POST', body: { contentType, sizeBytes } }),
    setLogo: (id: number, uploadToken: string) =>
      call<T.Restaurant>(`/restaurants/${id}/logo`, { method: 'PUT', body: { uploadToken } }),
    removeLogo: (id: number) => call<T.Restaurant>(`/restaurants/${id}/logo`, { method: 'DELETE' }),
    contact: (id: number, employeeId: number) =>
      call<T.CandidateContact>(`/restaurants/${id}/candidates/${employeeId}/contact`, { method: 'POST' }),
    outlets: (id: number) => call<T.Outlet[]>(`/restaurants/${id}/outlets`),
    addOutlet: (id: number, body: T.OutletInput) =>
      call<T.Outlet>(`/restaurants/${id}/outlets`, { method: 'POST', body }),
    updateOutlet: (outletId: number, body: T.OutletInput) =>
      call<T.Outlet>(`/outlets/${outletId}`, { method: 'PUT', body }),
    team: (id: number) => call<T.TeamMember[]>(`/restaurants/${id}/users`),
    invite: (id: number, body: { mobileNumber: string; name?: string | null; role: string; outletIds?: number[] }) =>
      call<T.TeamMember>(`/restaurants/${id}/users`, { method: 'POST', body }),
    removeMember: (id: number, restaurantUserId: number) =>
      call<void>(`/restaurants/${id}/users/${restaurantUserId}`, { method: 'DELETE' }),
    candidates: (id: number, query: {
      jobId?: number; cityId?: number; roleId?: number; minExperienceMonths?: number; availability?: string;
    }, offset = 0) => request<T.CandidateResult[]>(`/restaurants/${id}/candidates`, { query: { ...query, limit: PAGE, offset } }),
  },

  notifications: {
    list: (offset = 0) => request<T.AppNotification[]>('/notifications', { query: { limit: PAGE, offset } }),
    unreadCount: () => call<{ unread: number }>('/notifications/unread-count'),
    markRead: (id: number) => call<T.AppNotification>(`/notifications/${id}/read`, { method: 'POST' }),
    markAllRead: () => call<{ unread: number }>('/notifications/read-all', { method: 'POST' }),
    preferences: () => call<T.NotificationSetting[]>('/notifications/preferences'),
    updatePreferences: (preferences: { type: string; pushEnabled: boolean }[]) =>
      call<T.NotificationSetting[]>('/notifications/preferences', { method: 'PUT', body: { preferences } }),
  },
};
