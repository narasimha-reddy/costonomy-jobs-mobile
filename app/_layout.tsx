import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { APP_FONTS } from '@/lib/fonts';
import { queryClient } from '@/lib/query';
import { bootstrap, useSession } from '@/lib/session';
import { ToastHost } from '@/components/app/Feedback';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts(APP_FONTS);
  const session = useSession();

  useEffect(() => {
    void bootstrap();
  }, []);

  const ready = fontsLoaded && session.status !== 'loading';

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  const signedIn = session.status === 'signedIn';

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.surface },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          {/* Signing out flips these guards, and the router takes the person back to
              the sign-in flow without any screen having to remember to. */}
          <Stack.Protected guard={!signedIn}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
          <Stack.Protected guard={signedIn}>
            <Stack.Screen name="(app)" />
          </Stack.Protected>
        </Stack>
        <ToastHost />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
