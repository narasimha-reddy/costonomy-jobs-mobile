import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

/**
 * Connectivity, for the offline banner and for React Query.
 *
 * Wired into React Query's online manager, so queries pause instead of failing
 * while the phone has no signal and refetch the moment it comes back — which on a
 * patchy 4G connection in a basement kitchen is most of the time.
 *
 * "Offline" means NetInfo says there is no connection at all. `isInternetReachable`
 * starts as null and flickers on some Android builds, and a banner that appears
 * when nothing is wrong teaches people to ignore it.
 */
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(state.isConnected !== false)),
);

export function useIsOffline(): boolean {
  const [offline, setOffline] = useState(false);
  useEffect(() => NetInfo.addEventListener((state) => setOffline(state.isConnected === false)), []);
  return offline;
}
