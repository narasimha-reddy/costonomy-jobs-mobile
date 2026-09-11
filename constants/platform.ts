import { Platform, type TextStyle } from 'react-native';

/**
 * Removes the browser's default focus outline from text inputs on the web build.
 * The fields draw their own focus ring (TextField) or sit inside a container that
 * already reads as focused, and a second, blue, rectangular one inside a rounded
 * field looks broken. No effect on iOS or Android.
 */
export const WEB_NO_OUTLINE: TextStyle = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : {};
