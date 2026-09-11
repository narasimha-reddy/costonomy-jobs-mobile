import * as Location from 'expo-location';

export interface Fix {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  mocked: boolean;
}

/**
 * One foreground location reading, on an explicit tap. There is no background
 * variant anywhere in this app, and there must never be one — see the check-in
 * subsystem's non-goal in the API architecture doc.
 *
 * @returns null when permission is denied or the reading fails. Callers treat that
 *          as a normal outcome, never as an error that blocks the flow.
 */
export async function readLocationOnce(): Promise<{ granted: boolean; fix: Fix | null }> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') return { granted: false, fix: null };
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return {
      granted: true,
      fix: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? null,
        mocked: position.mocked ?? false,
      },
    };
  } catch {
    return { granted: true, fix: null };
  }
}
