import React, { useState } from 'react';
import { View } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Button, TextField } from '@/components/ui';
import { Screen } from '@/components/app/Screen';
import { Header } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { ListGroup, ListRow, OptionCard, Section } from '@/components/app/Controls';
import { Sheet } from '@/components/app/Sheet';
import { ConfirmSheet, errorMessage, toast } from '@/components/app/Feedback';
import { useT } from '@/lib/i18n';
import { api } from '@/lib/api';
import { formatMobile } from '@/lib/format';
import { chooseLanguage, refreshMe, setRole, signOut, useSession } from '@/lib/session';

/** Account-level controls, reachable from both sides of the app. */
export default function Settings() {
  const { t, locale } = useT();
  const { me, role } = useSession();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [nameOpen, setNameOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  if (!me) return null;
  const hasCandidate = me.employeeProfile != null;
  const hasRestaurant = me.restaurantMemberships.length > 0;

  const switchTo = async (next: 'candidate' | 'restaurant') => {
    await setRole(next);
    router.dismissAll();
    router.replace(next === 'candidate' ? '/candidate' : '/restaurant');
  };

  return (
    <Screen header={<Header title={t('settings.title')} />} tone="tinted">
      <Section title={t('settings.account')}>
        <ListGroup>
          <ListRow icon="person-outline" title={t('settings.name')} value={me.user.name ?? t('common.notSet')} onPress={() => setNameOpen(true)} />
          <ListRow icon="call-outline" title={t('settings.mobile')} value={formatMobile(me.user.mobileNumber)} />
          <ListRow icon="language-outline" title={t('settings.language')} value={locale === 'hi' ? 'हिंदी' : 'English'} onPress={() => setLanguageOpen(true)} />
          <ListRow icon="notifications-outline" title={t('settings.notifications')} onPress={() => router.push('/settings/notifications')} />
        </ListGroup>
      </Section>

      <Section>
        <ListGroup>
          {role === 'candidate' &&
            (hasRestaurant ? (
              <ListRow icon="swap-horizontal" iconColor={Colors.accent} title={t('settings.switchToHiring')} onPress={() => switchTo('restaurant')} />
            ) : (
              <ListRow icon="storefront-outline" iconColor={Colors.accent} title={t('settings.startHiring')} onPress={() => router.push('/onboarding/restaurant')} />
            ))}
          {role === 'restaurant' &&
            (hasCandidate ? (
              <ListRow icon="swap-horizontal" iconColor={Colors.accent} title={t('settings.switchToJobs')} onPress={() => switchTo('candidate')} />
            ) : (
              <ListRow icon="search-outline" iconColor={Colors.accent} title={t('settings.startJobSearch')} onPress={() => router.push('/onboarding/candidate')} />
            ))}
          <ListRow icon="log-out-outline" title={t('settings.signOut')} danger onPress={() => setSigningOut(true)} />
        </ListGroup>
      </Section>

      <Section>
        <ListGroup>
          <ListRow icon="trash-outline" title={t('deleteAccount.title')} danger onPress={() => router.push('/settings/delete-account')} />
        </ListGroup>
      </Section>

      <Txt variant="caption" color={Colors.textTertiary} align="center" style={{ marginTop: Spacing.xxl }}>
        Costonomy Jobs {Constants.expoConfig?.version ?? ''}
      </Txt>

      <Sheet visible={languageOpen} onClose={() => setLanguageOpen(false)} title={t('settings.language')}>
        <View style={{ gap: Spacing.sm }}>
          <OptionCard title="English" selected={locale === 'en'} onPress={() => { void chooseLanguage('en'); setLanguageOpen(false); }} />
          <OptionCard title="हिंदी" selected={locale === 'hi'} onPress={() => { void chooseLanguage('hi'); setLanguageOpen(false); }} />
        </View>
      </Sheet>

      <NameSheet visible={nameOpen} onClose={() => setNameOpen(false)} initial={me.user.name ?? ''} />

      <ConfirmSheet
        visible={signingOut}
        onClose={() => setSigningOut(false)}
        title={t('settings.signOut.confirm')}
        confirmLabel={t('settings.signOut')}
        danger
        onConfirm={() => signOut()}
      />
    </Screen>
  );
}

function NameSheet({ visible, onClose, initial }: { visible: boolean; onClose: () => void; initial: string }) {
  const { t } = useT();
  const [name, setName] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const save = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await api.me.update({ name: name.trim() });
      await refreshMe();
      toast(t('settings.nameSaved'));
      onClose();
    } catch (e) {
      setError(errorMessage(e, t('common.errorBody')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={t('settings.name')} footer={<Button label={t('common.save')} size="lg" fullWidth loading={busy} disabled={name.trim().length < 2} onPress={save} />}>
      <TextField value={name} onChangeText={setName} autoFocus autoCapitalize="words" error={error} />
    </Sheet>
  );
}
