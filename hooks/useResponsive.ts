import { Platform, useWindowDimensions } from 'react-native';
import {
  ContentMaxWidth,
  WEB_FRAME_WIDTH,
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
  const window = useWindowDimensions();
  // On web the layout lives inside the phone frame (components/app/WebFrame), so
  // it is the frame's width that decides the layout, not the browser window's.
  const width = Platform.OS === 'web' ? Math.min(window.width, WEB_FRAME_WIDTH) : window.width;
  const height = window.height;
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
