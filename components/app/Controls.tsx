import React, { useMemo, useState } from 'react';
import { StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/colors';
import { WEB_NO_OUTLINE } from '@/constants/platform';
import { FontSize } from '@/constants/typography';
import { Spacing, Touch } from '@/constants/spacing';
import { PRESS_OPACITY } from '@/constants/motion';
import { useFontFamily } from '@/hooks/useFontFamily';
import { Chip } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { Sheet } from './Sheet';
import { Txt } from './Txt';

type IconName = keyof typeof Ionicons.glyphMap;

// ── OptionCard ───────────────────────────────────────────────────────────────

/** A large selectable card: language, intent, outcome. The whole card is the target. */
export function OptionCard({
  title,
  subtitle,
  icon,
  selected,
  onPress,
  trailing,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  selected?: boolean;
  onPress: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={PRESS_OPACITY}
      accessibilityRole="radio"
      accessibilityState={{ selected: !!selected }}
      style={[styles.option, selected && styles.optionSelected]}
    >
      {icon != null && (
        <View style={[styles.optionIcon, selected && { backgroundColor: Colors.primary }]}>
          <Ionicons name={icon} size={22} color={selected ? Colors.white : Colors.primary} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Txt variant="subheading">{title}</Txt>
        {subtitle != null && (
          <Txt variant="caption" color={Colors.textSecondary} style={{ marginTop: 2 }}>
            {subtitle}
          </Txt>
        )}
      </View>
      {trailing ?? (
        <View style={[styles.radio, selected && styles.radioOn]}>
          {selected && <Ionicons name="checkmark" size={14} color={Colors.white} />}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── ChipGroup ────────────────────────────────────────────────────────────────

export interface ChipOption<V> {
  value: V;
  label: string;
  icon?: IconName;
}

/** A wrapping set of chips. Single choice unless `multiple`. */
export function ChipGroup<V extends string | number>({
  options,
  value,
  onChange,
  multiple,
  allowDeselect,
}: {
  options: ChipOption<V>[];
  value: V | V[] | null | undefined;
  onChange: (next: any) => void;
  multiple?: boolean;
  allowDeselect?: boolean;
}) {
  const selected = (v: V) => (Array.isArray(value) ? value.includes(v) : value === v);
  const toggle = (v: V) => {
    if (multiple) {
      const list = Array.isArray(value) ? value : [];
      onChange(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
    } else {
      onChange(allowDeselect && value === v ? null : v);
    }
  };
  return (
    <View style={styles.chipWrap}>
      {options.map((o) => (
        <Chip key={String(o.value)} label={o.label} icon={o.icon} selected={selected(o.value)} onPress={() => toggle(o.value)} />
      ))}
    </View>
  );
}

// ── Segmented ────────────────────────────────────────────────────────────────

export function Segmented<V extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: V; label: string; count?: number }[];
  value: V;
  onChange: (v: V) => void;
}) {
  return (
    <View style={styles.segment}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <TouchableOpacity
            key={o.value}
            onPress={() => onChange(o.value)}
            activeOpacity={PRESS_OPACITY}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.segmentItem, on && styles.segmentOn]}
          >
            <Txt variant="captionStrong" color={on ? Colors.textPrimary : Colors.textSecondary}>
              {o.label}
              {o.count != null ? `  ${o.count}` : ''}
            </Txt>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Field label ──────────────────────────────────────────────────────────────

export function FieldLabel({ children, hint }: { children: string; hint?: string }) {
  return (
    <View style={{ marginBottom: Spacing.sm }}>
      <Txt variant="captionStrong">{children}</Txt>
      {hint != null && (
        <Txt variant="caption" color={Colors.textSecondary}>
          {hint}
        </Txt>
      )}
    </View>
  );
}

export function Section({ title, children, action }: { title?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <View style={styles.section}>
      {(title != null || action != null) && (
        <View style={styles.sectionHead}>
          {title != null && <Txt variant="subheading">{title}</Txt>}
          {action}
        </View>
      )}
      {children}
    </View>
  );
}

// ── Select ───────────────────────────────────────────────────────────────────

export interface SelectOption<V> {
  value: V;
  label: string;
  group?: string;
  description?: string;
}

/**
 * A field that opens a searchable list in a sheet. For long lists — roles,
 * localities — where chips would not fit.
 */
export function SelectField<V extends string | number>({
  label,
  placeholder,
  options,
  value,
  onChange,
  multiple,
  searchable = true,
  error,
  icon,
}: {
  label?: string;
  placeholder: string;
  options: SelectOption<V>[];
  value: V | V[] | null | undefined;
  onChange: (next: any) => void;
  multiple?: boolean;
  searchable?: boolean;
  error?: string;
  icon?: IconName;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabels = options
    .filter((o) => (Array.isArray(value) ? value.includes(o.value) : o.value === value))
    .map((o) => o.label);

  return (
    <View>
      {label != null && <FieldLabel>{label}</FieldLabel>}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={PRESS_OPACITY}
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder}
        style={[styles.select, error != null && { borderColor: Colors.danger }]}
      >
        {icon != null && <Ionicons name={icon} size={18} color={Colors.textTertiary} />}
        <Txt
          variant="body"
          numberOfLines={1}
          color={selectedLabels.length ? Colors.textPrimary : Colors.textTertiary}
          style={{ flex: 1, fontSize: FontSize.md }}
        >
          {selectedLabels.length ? selectedLabels.join(', ') : placeholder}
        </Txt>
        <Ionicons name="chevron-down" size={18} color={Colors.textTertiary} />
      </TouchableOpacity>
      {error != null && (
        <Txt variant="caption" color={Colors.danger} style={{ marginTop: 6 }}>
          {error}
        </Txt>
      )}
      <SelectSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={label ?? placeholder}
        options={options}
        value={value}
        multiple={multiple}
        searchable={searchable}
        onChange={(next) => {
          onChange(next);
          if (!multiple) setOpen(false);
        }}
      />
    </View>
  );
}

export function SelectSheet<V extends string | number>({
  visible,
  onClose,
  title,
  options,
  value,
  onChange,
  multiple,
  searchable = true,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: SelectOption<V>[];
  value: V | V[] | null | undefined;
  onChange: (next: any) => void;
  multiple?: boolean;
  searchable?: boolean;
}) {
  const { t } = useT();
  const { font } = useFontFamily();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const isOn = (v: V) => (Array.isArray(value) ? value.includes(v) : value === v);
  const toggle = (v: V) => {
    if (multiple) {
      const list = Array.isArray(value) ? value : [];
      onChange(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
    } else {
      onChange(v);
    }
  };

  let lastGroup: string | undefined;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={title}
      tall={options.length > 8}
      footer={multiple ? <PrimaryDone label={t('common.done')} onPress={onClose} /> : undefined}
    >
      {searchable && options.length > 8 && (
        <View style={styles.search}>
          <Ionicons name="search" size={18} color={Colors.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('common.searchPlaceholder')}
            placeholderTextColor={Colors.textTertiary}
            style={[styles.searchInput, { fontFamily: font('regular') }]}
          />
        </View>
      )}
      {filtered.length === 0 && (
        <Txt variant="body" color={Colors.textSecondary} style={{ paddingVertical: Spacing.xl }} align="center">
          {t('common.noMatches')}
        </Txt>
      )}
      {filtered.map((o) => {
        const header = o.group && o.group !== lastGroup ? o.group : null;
        lastGroup = o.group;
        const on = isOn(o.value);
        return (
          <View key={String(o.value)}>
            {header != null && (
              <Txt variant="micro" color={Colors.textTertiary} style={styles.groupHeader}>
                {header.toUpperCase()}
              </Txt>
            )}
            <TouchableOpacity
              onPress={() => toggle(o.value)}
              activeOpacity={PRESS_OPACITY}
              accessibilityRole={multiple ? 'checkbox' : 'radio'}
              accessibilityState={{ checked: on }}
              style={styles.selectRow}
            >
              <View style={{ flex: 1 }}>
                <Txt variant={on ? 'bodyStrong' : 'body'}>{o.label}</Txt>
                {o.description != null && (
                  <Txt variant="caption" color={Colors.textSecondary}>
                    {o.description}
                  </Txt>
                )}
              </View>
              {on && <Ionicons name={multiple ? 'checkbox' : 'checkmark-circle'} size={22} color={Colors.accent} />}
              {!on && multiple && <Ionicons name="square-outline" size={22} color={Colors.border} />}
            </TouchableOpacity>
          </View>
        );
      })}
    </Sheet>
  );
}

function PrimaryDone({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={PRESS_OPACITY} style={styles.done} accessibilityRole="button">
      <Txt variant="bodyStrong" color={Colors.white}>
        {label}
      </Txt>
    </TouchableOpacity>
  );
}

// ── Rows ─────────────────────────────────────────────────────────────────────

export function ListGroup({ children }: { children: React.ReactNode }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.group}>
      {items.map((child, i) => (
        <View key={i}>
          {child}
          {i < items.length - 1 && <View style={styles.divider} />}
        </View>
      ))}
    </View>
  );
}

export function ListRow({
  icon,
  iconColor = Colors.textSecondary,
  title,
  subtitle,
  value,
  onPress,
  danger,
  right,
}: {
  icon?: IconName;
  iconColor?: string;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  right?: React.ReactNode;
}) {
  const body = (
    <>
      {icon != null && (
        <View style={styles.rowIcon}>
          <Ionicons name={icon} size={20} color={danger ? Colors.danger : iconColor} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Txt variant="body" color={danger ? Colors.danger : Colors.textPrimary} weight="medium">
          {title}
        </Txt>
        {subtitle != null && (
          <Txt variant="caption" color={Colors.textSecondary}>
            {subtitle}
          </Txt>
        )}
      </View>
      {value != null && (
        <Txt variant="body" color={Colors.textSecondary} numberOfLines={1} style={{ maxWidth: '45%' }}>
          {value}
        </Txt>
      )}
      {right}
      {onPress != null && right == null && <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />}
    </>
  );
  return onPress ? (
    <TouchableOpacity onPress={onPress} activeOpacity={PRESS_OPACITY} style={styles.row} accessibilityRole="button">
      {body}
    </TouchableOpacity>
  ) : (
    <View style={styles.row}>{body}</View>
  );
}

export function ToggleRow({
  title,
  subtitle,
  value,
  onChange,
  disabled,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <ListRow
      title={title}
      subtitle={subtitle}
      right={
        <Switch
          value={value}
          onValueChange={onChange}
          disabled={disabled}
          trackColor={{ true: Colors.accent, false: Colors.border }}
          thumbColor={Colors.white}
        />
      }
    />
  );
}

/** A two-up grid of label/value tiles: salary, experience, joining, shift. */
export function Tiles({ items }: { items: { icon: IconName; label: string; value: string }[] }) {
  return (
    <View style={styles.tiles}>
      {items.map((it) => (
        <View key={it.label} style={styles.tile}>
          <Ionicons name={it.icon} size={18} color={Colors.accent} />
          <Txt variant="caption" color={Colors.textSecondary} style={{ marginTop: 6 }}>
            {it.label}
          </Txt>
          <Txt variant="bodyStrong">{it.value}</Txt>
        </View>
      ))}
    </View>
  );
}

// ── Stepper ──────────────────────────────────────────────────────────────────

export function Stepper({ value, onChange, min = 0, max = 99 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <View style={styles.stepper}>
      <StepButton icon="remove" disabled={value <= min} onPress={() => onChange(Math.max(min, value - 1))} />
      <Txt variant="heading" style={{ minWidth: 40 }} align="center">
        {value}
      </Txt>
      <StepButton icon="add" disabled={value >= max} onPress={() => onChange(Math.min(max, value + 1))} />
    </View>
  );
}

function StepButton({ icon, onPress, disabled }: { icon: IconName; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={PRESS_OPACITY}
      style={[styles.stepButton, disabled && { opacity: 0.35 }]}
      accessibilityRole="button"
      accessibilityLabel={icon === 'add' ? 'Increase' : 'Decrease'}
    >
      <Ionicons name={icon} size={20} color={Colors.textPrimary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Spacing.radiusLg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    minHeight: 72,
  },
  optionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  segment: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSunken,
    borderRadius: Spacing.radiusMd,
    padding: 3,
  },
  segmentItem: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.radiusSm + 2,
    paddingHorizontal: Spacing.sm,
  },
  segmentOn: {
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  section: { marginTop: Spacing.xxl },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: Touch.inputHeight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.radiusMd,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceSunken,
    borderRadius: Spacing.radiusMd,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
    marginBottom: Spacing.sm,
  },
  searchInput: { flex: 1, ...WEB_NO_OUTLINE, fontSize: FontSize.md, color: Colors.textPrimary, paddingVertical: Spacing.sm },
  groupHeader: { marginTop: Spacing.lg, marginBottom: Spacing.xs },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Touch.min + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.md,
  },
  done: {
    backgroundColor: Colors.primary,
    minHeight: Touch.buttonHeightMd,
    borderRadius: Spacing.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
  },
  group: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginLeft: Spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 56,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  rowIcon: { width: 24, alignItems: 'center' },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: Colors.background,
    borderRadius: Spacing.radiusMd,
    padding: Spacing.md,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
