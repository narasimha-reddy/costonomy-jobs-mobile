import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/client';

/**
 * Server state. Stale after 30 seconds, and never retried for an error the server
 * meant — retrying a 404 or a 409 three times only delays the message.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failures, error) =>
        failures < 2 && (!(error instanceof ApiError) || error.code === 'NETWORK' || error.status >= 500),
    },
    mutations: { retry: false },
  },
});
