import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Where the API lives.
 *
 * `EXPO_PUBLIC_API_URL` wins when set (staging, production, a tunnel). In
 * development the API runs on the same machine as Metro, so the host is taken from
 * the address the app loaded its bundle from — which is what makes the same build
 * work on the iOS simulator (localhost), a physical phone on the LAN (the laptop's
 * IP) and web, without editing anything.
 */
function devHost(): string {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return hostUri.split(':')[0]!;
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ?? `http://${devHost()}:8080/costonomy-jobs-api`;

/** Launch city. The only active city today; everything else is gated server-side. */
export const DEFAULT_CITY_ID = 1;
