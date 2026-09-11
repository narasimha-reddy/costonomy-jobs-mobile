import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { WEB_NO_OUTLINE } from '@/constants/platform';
import { FontSize } from '@/constants/typography';
import { Spacing, Touch } from '@/constants/spacing';
import { useFontFamily } from '@/hooks/useFontFamily';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  /** Persistent helper text. Replaced by `error` when one is present. */
  hint?: string;
  /**
   * The validation message. Rendered **inline, under the field** — never as a
   * toast or a top-of-screen summary (05-mobile-screens §6). A candidate
   * fixing a phone number needs the message next to the box they're fixing.
   */
  error?: string;
  required?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Fixed text pinned inside the field's left edge — "+91", "₹". */
  prefix?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function TextField({
  label,
  hint,
  error,
  required = false,
  icon,
  prefix,
  containerStyle,
  onFocus,
  onBlur,
  editable = true,
  ...inputProps
}: TextFieldProps) {
  const { font } = useFontFamily();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? Colors.danger : focused ? Colors.accent : Colors.border;

  return (
    <View style={containerStyle}>
      {label != null && (
        <Text style={[styles.label, { fontFamily: font('semibold') }]}>
          {label}
          {required && <Text style={{ color: Colors.danger }}> *</Text>}
        </Text>
      )}

      <View
        style={[
          styles.field,
          { borderColor, backgroundColor: editable ? Colors.surface : Colors.borderLight },
          // A 2px focus ring rather than a colour change alone: on the cheap
          // LCD panels this audience often carries, a hue shift at this
          // saturation is genuinely hard to see in daylight.
          focused && !error && styles.focused,
        ]}
      >
        {icon != null && <Ionicons name={icon} size={18} color={Colors.textTertiary} />}
        {prefix != null && (
          <Text style={[styles.prefix, { fontFamily: font('medium') }]}>{prefix}</Text>
        )}
        <TextInput
          {...inputProps}
          editable={editable}
          placeholderTextColor={Colors.textTertiary}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          accessibilityLabel={label}
          // Announces the error to a screen reader, which a coloured border alone
          // does not.
          accessibilityHint={error ?? hint}
          style={[styles.input, { fontFamily: font('regular') }]}
        />
      </View>

      {error != null ? (
        <View style={styles.messageRow}>
          <Ionicons name="alert-circle" size={13} color={Colors.danger} />
          <Text style={[styles.error, { fontFamily: font('medium') }]}>{error}</Text>
        </View>
      ) : hint != null ? (
        <Text style={[styles.hint, { fontFamily: font('regular') }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: Touch.inputHeight,
    borderWidth: 1,
    borderRadius: Spacing.radiusMd,
    paddingHorizontal: Spacing.lg,
  },
  focused: {
    borderWidth: 2,
    // Keep the content from shifting a pixel when the border thickens.
    paddingHorizontal: Spacing.lg - 1,
  },
  prefix: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  input: {
    flex: 1, ...WEB_NO_OUTLINE,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs + 2,
  },
  error: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.danger,
  },
  hint: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs + 2,
  },
});

export default TextField;
