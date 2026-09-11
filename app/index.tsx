import React from 'react';
import { Redirect } from 'expo-router';
import { useSession } from '@/lib/session';

/**
 * Where a launch lands. Decided from the server's view of the account, not from a
 * role saved at signup: a restaurant created on another phone shows up here.
 */
export default function Index() {
  const { status, me, role, languageChosen } = useSession();

  if (status !== 'signedIn') {
    return <Redirect href={languageChosen ? '/phone' : '/welcome'} />;
  }
  if (me == null) return <Redirect href="/intent" />;
  if (role === 'restaurant') return <Redirect href="/restaurant" />;
  if (role === 'candidate') return <Redirect href="/candidate" />;
  return <Redirect href="/intent" />;
}
