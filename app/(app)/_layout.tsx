import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';

/** Everything behind sign-in. Tabs for each side, with detail screens pushed over them. */
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.surface }, animation: 'slide_from_right' }}>
      <Stack.Screen name="candidate" options={{ animation: 'fade' }} />
      <Stack.Screen name="restaurant" options={{ animation: 'fade' }} />
      <Stack.Screen name="intent" options={{ animation: 'fade' }} />
      <Stack.Screen name="jobs/search" options={{ animation: 'fade_from_bottom' }} />
    </Stack>
  );
}
