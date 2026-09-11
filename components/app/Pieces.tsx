import React, { useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { WEB_NO_OUTLINE } from '@/constants/platform';
import { FontSize } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { PRESS_OPACITY } from '@/constants/motion';
import { useFontFamily } from '@/hooks/useFontFamily';
import { Avatar } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { dayLabel, dayParts, relativeTime, salaryRange, timeLabel } from '@/lib/format';
import type { Job } from '@/lib/api';
import { Txt } from './Txt';

// ── Brand ────────────────────────────────────────────────────────────────────

export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <View style={[styles.brand, { width: size, height: size, borderRadius: size * 0.3 }]}>
      <Ionicons name="restaurant" size={size * 0.5} color={Colors.white} />
    </View>
  );
}

// ── OTP ──────────────────────────────────────────────────────────────────────

/**
 * Six boxes over one hidden input. One real `TextInput` keeps paste, the SMS
 * autofill suggestion and the numeric keyboard working, which six separate inputs
 * fight against.
 */
export function OtpInput({ value, onChange, error, autoFocus = true }: { value: string; onChange: (v: string) => void; error?: boolean; autoFocus?: boolean }) {
  const ref = useRef<TextInput>(null);
  const { font } = useFontFamily();
  const digits = value.split('');

  return (
    <TouchableOpacity activeOpacity={1} onPress={() => ref.current?.focus()} style={styles.otpRow}>
      {Array.from({ length: 6 }).map((_, i) => {
        const active = i === Math.min(value.length, 5);
        return (
          <View
            key={i}
            style={[
              styles.otpBox,
              active && styles.otpActive,
              digits[i] != null && styles.otpFilled,
              error && { borderColor: Colors.danger },
            ]}
          >
            <Txt variant="title" style={{ fontFamily: font('semibold') }}>
              {digits[i] ?? ''}
            </Txt>
          </View>
        );
      })}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(v) => onChange(v.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        autoFocus={autoFocus}
        maxLength={6}
        style={styles.otpHidden}
        accessibilityLabel="One-time code"
      />
    </TouchableOpacity>
  );
}

// ── Match ────────────────────────────────────────────────────────────────────

export function MatchPill({ score }: { score: number }) {
  const { t } = useT();
  const strong = score >= 75;
  return (
    <View style={[styles.match, { backgroundColor: strong ? Colors.accentLight : Colors.surfaceSunken }]}>
      <Ionicons name="sparkles" size={11} color={strong ? Colors.accentDark : Colors.textSecondary} />
      <Txt variant="micro" color={strong ? Colors.accentDark : Colors.textSecondary}>
        {t('feed.match', { score })}
      </Txt>
    </View>
  );
}

// ── Tags ─────────────────────────────────────────────────────────────────────

export function Tag({ label, icon, tone = 'neutral' }: { label: string; icon?: keyof typeof Ionicons.glyphMap; tone?: 'neutral' | 'accent' | 'primary' }) {
  const colors = {
    neutral: { bg: Colors.surfaceSunken, fg: Colors.textSecondary },
    accent: { bg: Colors.accentLight, fg: Colors.accentDark },
    primary: { bg: Colors.primaryLight, fg: Colors.primaryDark },
  }[tone];
  return (
    <View style={[styles.tag, { backgroundColor: colors.bg }]}>
      {icon != null && <Ionicons name={icon} size={12} color={colors.fg} />}
      <Txt variant="micro" color={colors.fg} weight="semibold">
        {label}
      </Txt>
    </View>
  );
}

// ── JobCard ──────────────────────────────────────────────────────────────────

export function JobCard({ job, onPress, showMatch }: { job: Job; onPress: () => void; showMatch?: boolean }) {
  const { t } = useT();
  const applied = job.myApplication?.applicationId != null;
  const place = [job.restaurantName, job.localityDisplay ?? job.outletName].filter(Boolean).join(' · ');
  // (restaurant + area only: the outlet name is usually the area again)

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={PRESS_OPACITY} style={styles.jobCard} accessibilityRole="button" accessibilityLabel={`${job.title}, ${place}`}>
      <View style={styles.jobTop}>
        <Avatar name={job.restaurantName} uri={job.logoUrl} size="md" shape="rounded" />
        <View style={{ flex: 1 }}>
          <Txt variant="subheading" numberOfLines={2}>
            {job.title}
          </Txt>
          <Txt variant="caption" color={Colors.textSecondary} numberOfLines={1}>
            {place}
          </Txt>
        </View>
        {applied ? (
          <Tag label={t('feed.applied')} icon="checkmark" tone="accent" />
        ) : showMatch && job.matchScore != null ? (
          <MatchPill score={job.matchScore} />
        ) : null}
      </View>

      <Txt variant="heading" style={{ marginTop: Spacing.md }}>
        {salaryRange(job.minSalary, job.maxSalary, job.salaryPeriod)}
      </Txt>

      <View style={styles.jobTags}>
        {/* Three at most: a card that wraps onto a second row of tags stops being scannable. */}
        {[
          <Tag key="j" label={t(`joining.${job.joiningRequirement}` as 'joining.IMMEDIATE')} icon="flash-outline" />,
          job.shift != null ? <Tag key="s" label={t(`shift.${job.shift}` as 'shift.MORNING')} icon="time-outline" /> : null,
          job.accommodationProvided ? <Tag key="a" label={t('job.accommodation')} icon="home-outline" /> : null,
          job.mealsProvided ? <Tag key="m" label={t('job.meals')} icon="restaurant-outline" /> : null,
        ]
          .filter(Boolean)
          .slice(0, 3)}
      </View>

      {job.publishedAt != null && (
        <Txt variant="caption" color={Colors.textTertiary} style={{ marginTop: Spacing.sm }}>
          {relativeTime(job.publishedAt)}
        </Txt>
      )}
    </TouchableOpacity>
  );
}

// ── Date & time pickers ──────────────────────────────────────────────────────

/** A horizontal strip of the next `days` days. */
export function DayStrip({ value, onChange, days = 14, startOffset = 0 }: { value: Date | null; onChange: (d: Date) => void; days?: number; startOffset?: number }) {
  const list = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i + startOffset);
      return d;
    });
  }, [days, startOffset]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm, paddingRight: Spacing.lg }}>
      {list.map((d) => {
        const on = value != null && d.toDateString() === value.toDateString();
        const { weekday, month } = dayParts(d);
        return (
          <TouchableOpacity
            key={d.toISOString()}
            onPress={() => onChange(d)}
            activeOpacity={PRESS_OPACITY}
            accessibilityRole="button"
            accessibilityLabel={dayLabel(d)}
            accessibilityState={{ selected: on }}
            style={[styles.day, on && styles.dayOn]}
          >
            <Txt variant="micro" color={on ? Colors.white : Colors.textSecondary}>
              {weekday.toUpperCase()}
            </Txt>
            <Txt variant="heading" color={on ? Colors.white : Colors.textPrimary}>
              {d.getDate()}
            </Txt>
            <Txt variant="micro" color={on ? Colors.white : Colors.textTertiary}>
              {month}
            </Txt>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

/** Half-hour slots across service hours; past slots on today are hidden. */
export function TimeGrid({ day, value, onChange, from = 9, to = 22 }: { day: Date | null; value: Date | null; onChange: (d: Date) => void; from?: number; to?: number }) {
  const slots = useMemo(() => {
    if (!day) return [];
    const out: Date[] = [];
    for (let h = from; h <= to; h++) {
      for (const m of [0, 30]) {
        const d = new Date(day);
        d.setHours(h, m, 0, 0);
        if (d.getTime() > Date.now() + 15 * 60 * 1000) out.push(d);
      }
    }
    return out;
  }, [day, from, to]);

  return (
    <View style={styles.timeGrid}>
      {slots.map((s) => {
        const on = value != null && s.getTime() === value.getTime();
        return (
          <TouchableOpacity
            key={s.toISOString()}
            onPress={() => onChange(s)}
            activeOpacity={PRESS_OPACITY}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[styles.slot, on && styles.slotOn]}
          >
            <Txt variant="captionStrong" color={on ? Colors.white : Colors.textPrimary}>
              {timeLabel(s)}
            </Txt>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Money input ──────────────────────────────────────────────────────────────

export function AmountInput({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder?: string; label?: string }) {
  const { font } = useFontFamily();
  return (
    <View style={{ flex: 1 }}>
      {label != null && (
        <Txt variant="caption" color={Colors.textSecondary} style={{ marginBottom: 6 }}>
          {label}
        </Txt>
      )}
      <View style={styles.amount}>
        <Txt variant="subheading" color={Colors.textSecondary}>
          ₹
        </Txt>
        <TextInput
          value={value}
          onChangeText={(v) => onChange(v.replace(/\D/g, '').slice(0, 7))}
          keyboardType="number-pad"
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          style={[styles.amountInput, { fontFamily: font('semibold') }]}
          accessibilityLabel={label ?? placeholder}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  otpRow: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'space-between' },
  otpBox: {
    flex: 1,
    maxWidth: 56,
    aspectRatio: 0.86,
    borderRadius: Spacing.radiusMd,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  otpActive: { borderColor: Colors.primary, borderWidth: 2 },
  otpFilled: { backgroundColor: Colors.background },
  otpHidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  match: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Spacing.radiusFull },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Spacing.radiusFull },
  jobCard: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
  },
  jobTop: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  jobTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: Spacing.sm },
  day: {
    width: 60,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.radiusMd,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  dayOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  slot: {
    minWidth: 88,
    minHeight: 40,
    paddingHorizontal: Spacing.md,
    borderRadius: Spacing.radiusSm + 2,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotOn: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  amount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.radiusMd,
    paddingHorizontal: Spacing.lg,
    minHeight: 52,
  },
  amountInput: { flex: 1, ...WEB_NO_OUTLINE, fontSize: FontSize.lg, color: Colors.textPrimary, paddingVertical: Spacing.sm },
});
