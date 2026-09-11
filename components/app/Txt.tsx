import React from 'react';
import { Text, type TextProps, type TextStyle, type StyleProp } from 'react-native';
import { Colors } from '@/constants/colors';
import { FontSize, type FontWeightName } from '@/constants/typography';
import { useFontFamily } from '@/hooks/useFontFamily';

/**
 * Text with a script-correct typeface and line height.
 *
 * design-system.md §8 keeps the primitives wrapper-free to stay close to the ops
 * app. Screens are different: forty of them each calling `useFontFamily()` and
 * spreading `font('semibold')` into every `<Text>` is forty chances to forget,
 * and a forgotten one renders Hindi in the platform fallback face. So screens use
 * this; `components/ui` stays as it is.
 */
export type TxtVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'captionStrong'
  | 'micro';

const VARIANTS: Record<TxtVariant, { size: number; weight: FontWeightName; tracking?: number; density: 'tight' | 'normal' }> = {
  display: { size: FontSize.xxl, weight: 'bold', tracking: -0.4, density: 'tight' },
  title: { size: FontSize.xl, weight: 'bold', tracking: -0.2, density: 'tight' },
  heading: { size: FontSize.lg, weight: 'semibold', density: 'tight' },
  subheading: { size: FontSize.md, weight: 'semibold', density: 'normal' },
  body: { size: FontSize.base, weight: 'regular', density: 'normal' },
  bodyStrong: { size: FontSize.base, weight: 'semibold', density: 'normal' },
  caption: { size: FontSize.sm, weight: 'regular', density: 'normal' },
  captionStrong: { size: FontSize.sm, weight: 'semibold', density: 'normal' },
  micro: { size: FontSize.xs, weight: 'semibold', tracking: 0.2, density: 'normal' },
};

interface TxtProps extends TextProps {
  variant?: TxtVariant;
  color?: string;
  weight?: FontWeightName;
  align?: TextStyle['textAlign'];
  style?: StyleProp<TextStyle>;
}

export function Txt({ variant = 'body', color = Colors.textPrimary, weight, align, style, ...rest }: TxtProps) {
  const { font, lineHeight } = useFontFamily();
  const v = VARIANTS[variant];
  return (
    <Text
      {...rest}
      style={[
        {
          fontSize: v.size,
          fontFamily: font(weight ?? v.weight),
          lineHeight: lineHeight(v.size, v.density),
          letterSpacing: v.tracking,
          color,
          textAlign: align,
        },
        style,
      ]}
    />
  );
}
