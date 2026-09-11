import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Where the API lives. Locally: the API on 9090, this app's dev server on 9091 —
 * Costonomy Jobs uses 9xxx so it never collides with the main Costonomy apps on 8xxx.
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

/**
 * A release build must be told where the API is, over HTTPS. Falling back to the
 * dev host there would ship an app that silently talks to nobody, so it fails at
 * launch instead, where the first test build shows it. Set EXPO_PUBLIC_API_URL
 * per EAS environment (`eas env:create --environment preview|production`).
 */
function resolveApiUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (__DEV__) return configured ?? `http://${devHost()}:9090/costonomy-jobs-api`;
  if (!configured) {
    throw new Error('EXPO_PUBLIC_API_URL is not set for this build. Set it in the EAS environment for this profile.');
  }
  if (!configured.startsWith('https://')) {
    throw new Error(`EXPO_PUBLIC_API_URL must use https in a release build; got ${configured}.`);
  }
  return configured.replace(/\/$/, '');
}

export const API_URL: string = resolveApiUrl();

/** Launch city. The only active city today; everything else is gated server-side. */
export const DEFAULT_CITY_ID = 1;
