import { useWindowDimensions } from 'react-native';
import {
  ContentMaxWidth,
  Gutter,
  sizeClassFor,
  type SizeClass,
} from '@/constants/breakpoints';

/**
 * The live window's size class, plus the layout values derived from it.
 *
 * Tracks `useWindowDimensions` rather than a value read once at import, so a
 * tablet resized in Split View or Stage Manager re-lays out correctly.
 */
export function useResponsive(): {
  width: number;
  height: number;
  sizeClass: SizeClass;
  isTablet: boolean;
  contentMaxWidth: number | null;
  gutter: number;
} {
  const { width, height } = useWindowDimensions();
  const sizeClass = sizeClassFor(width, height);

  return {
    width,
    height,
    sizeClass,
    isTablet: sizeClass !== 'compact',
    contentMaxWidth: ContentMaxWidth[sizeClass],
    gutter: Gutter[sizeClass],
  };
}
