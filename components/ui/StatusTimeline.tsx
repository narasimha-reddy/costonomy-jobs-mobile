import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/colors';
import { FontSize } from '@/constants/typography';
import { Spacing, Touch } from '@/constants/spacing';
import { PRESS_OPACITY } from '@/constants/motion';
import { useFontFamily } from '@/hooks/useFontFamily';
import { useT } from '@/lib/i18n';
import {
  APPLICATION_PIPELINE,
  APPLICATION_STATUS_DISPLAY,
  isTerminalApplicationStatus,
} from '@/lib/status-display';
import type { ApplicationStatus } from '@/constants/colors';

export interface TimelineEntry {
  status: ApplicationStatus;
  /** When this step happened. Absent for steps that haven't happened yet. */
  timestamp?: string;
  /** Extra context under the label — "Interview on 15 Sep, 10:30 AM". */
  detail?: string;
  /** Makes the row tappable — INTERVIEW → InterviewDetail, OFFERED → OfferDetail. */
  onPress?: () => void;
}

interface StatusTimelineProps {
  /** The application's current status. Drives which steps read as done. */
  current: ApplicationStatus;
  /** What actually happened, keyed by status. Steps not present render as upcoming. */
  entries?: Partial<Record<ApplicationStatus, Omit<TimelineEntry, 'status'>>>;
  /** The restaurant's optional reason, shown when `current` is REJECTED. */
  terminalReason?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * The vertical progress spine on `ApplicationDetail` — the one screen an
 * employee returns to for "what is happening with my application"
 * (05-mobile-screens §4, PRD §6.5).
 *
 * Three node states, and the distinction matters more here than it looks:
 *
 *   done      — filled in that status's own colour, from the shared ramp
 *   current   — filled, plus a halo ring, so the eye lands on it first
 *   upcoming  — hollow and grey: visible, so the candidate can see the whole
 *               road ahead, but clearly not yet reached
 *
 * Showing the upcoming steps at all is a deliberate product choice. The
 * alternative — render only what has happened — leaves someone at SHORTLISTED
 * with no idea whether anything else is coming, which is exactly the anxiety
 * this screen exists to remove.
 *
 * A terminal REJECTED/WITHDRAWN **replaces** the pipeline rather than appending
 * to it: those are not step nine of eight.
 */
export function StatusTimeline({ current, entries, terminalReason, style }: StatusTimelineProps) {
  const { font } = useFontFamily();
  const { tx } = useT();

  if (isTerminalApplicationStatus(current) && current !== 'JOINED') {
    return <TerminalState status={current} reason={terminalReason} style={style} />;
  }

  const currentIndex = APPLICATION_PIPELINE.indexOf(current);

  return (
    <View style={style}>
      {APPLICATION_PIPELINE.map((status, index) => {
        const display = APPLICATION_STATUS_DISPLAY[status];
        const entry = entries?.[status];
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isUpcoming = index > currentIndex;
        const isLast = index === APPLICATION_PIPELINE.length - 1;

        const nodeColor = isUpcoming ? Colors.border : display.token.fg;
        const labelColor = isUpcoming ? Colors.textTertiary : Colors.textPrimary;

        const row = (
          <View style={styles.row}>
            {/* Rail: node + the connector down to the next node. */}
            <View style={styles.rail}>
              {isCurrent && <View style={[styles.halo, { backgroundColor: display.token.bg }]} />}
              <View
                style={[
                  styles.node,
                  isUpcoming
                    ? { borderColor: nodeColor, backgroundColor: Colors.surface }
                    : { borderColor: nodeColor, backgroundColor: nodeColor },
                ]}
              >
                {!isUpcoming && (
                  <Ionicons
                    name={isDone ? 'checkmark' : display.icon}
                    size={11}
                    color={Colors.textInverse}
                  />
                )}
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.connector,
                    { backgroundColor: isDone ? display.token.fg : Colors.border },
                  ]}
                />
              )}
            </View>

            <View style={[styles.body, isLast && styles.bodyLast]}>
              <View style={styles.labelRow}>
                <Text
                  style={[
                    styles.label,
                    { color: labelColor, fontFamily: font(isCurrent ? 'bold' : 'medium') },
                  ]}
                >
                  {tx(display.labelKey, display.fallbackLabel)}
                </Text>
                {entry?.onPress != null && (
                  <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
                )}
              </View>
              {entry?.detail != null && (
                <Text style={[styles.detail, { fontFamily: font('regular') }]}>{entry.detail}</Text>
              )}
              {entry?.timestamp != null && (
                <Text style={[styles.timestamp, { fontFamily: font('regular') }]}>
                  {entry.timestamp}
                </Text>
              )}
            </View>
          </View>
        );

        return entry?.onPress != null ? (
          <TouchableOpacity
            key={status}
            onPress={entry.onPress}
            activeOpacity={PRESS_OPACITY}
            accessibilityRole="button"
            accessibilityLabel={tx(display.labelKey, display.fallbackLabel)}
          >
            {row}
          </TouchableOpacity>
        ) : (
          <View key={status}>{row}</View>
        );
      })}
    </View>
  );
}

function TerminalState({
  status,
  reason,
  style,
}: {
  status: ApplicationStatus;
  reason?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { font } = useFontFamily();
  const { tx } = useT();
  const display = APPLICATION_STATUS_DISPLAY[status];

  return (
    <View style={[styles.terminal, { backgroundColor: display.token.bg }, style]}>
      <Ionicons name={display.icon} size={22} color={display.token.fg} />
      <View style={styles.terminalText}>
        <Text style={[styles.terminalTitle, { color: display.token.fg, fontFamily: font('bold') }]}>
          {tx(display.labelKey, display.fallbackLabel)}
        </Text>
        {reason != null && (
          <Text style={[styles.terminalReason, { fontFamily: font('regular') }]}>{reason}</Text>
        )}
      </View>
    </View>
  );
}

const NODE_SIZE = 22;
const RAIL_WIDTH = 32;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  rail: {
    width: RAIL_WIDTH,
    alignItems: 'center',
  },
  halo: {
    position: 'absolute',
    top: -5,
    width: NODE_SIZE + 10,
    height: NODE_SIZE + 10,
    borderRadius: (NODE_SIZE + 10) / 2,
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connector: {
    flex: 1,
    width: 2,
    minHeight: Spacing.xxl,
    marginVertical: 2,
  },
  body: {
    flex: 1,
    paddingLeft: Spacing.md,
    paddingBottom: Spacing.xl,
    // Keeps the tappable rows at the 48pt floor even when a step has no detail.
    minHeight: Touch.min,
  },
  bodyLast: {
    paddingBottom: 0,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  label: {
    fontSize: FontSize.base,
    flexShrink: 1,
  },
  detail: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  timestamp: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  terminal: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.cardPaddingRoomy,
    borderRadius: Spacing.radiusLg,
  },
  terminalText: {
    flex: 1,
  },
  terminalTitle: {
    fontSize: FontSize.md,
  },
  terminalReason: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});

export default StatusTimeline;
