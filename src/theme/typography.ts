import { Platform } from 'react-native';

export const FontFamilies = {
  bodyRegular: 'Nunito_400Regular',
  bodySemiBold: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
  headingSemiBold: 'Raleway_600SemiBold',
  headingBold: 'Raleway_700Bold',
} as const;

export const Typography = {
  body: {
    fontFamily: FontFamilies.bodyRegular,
    fontSize: 20,
    lineHeight: 30,
  },
  bodyStrong: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 20,
    lineHeight: 30,
  },
  bodySmall: {
    fontFamily: FontFamilies.bodyRegular,
    fontSize: 18,
    lineHeight: 26,
  },
  label: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 20,
    lineHeight: 28,
  },
  heading: {
    fontFamily: FontFamilies.headingBold,
    fontSize: 36,
    lineHeight: 44,
  },
  headingSmall: {
    fontFamily: FontFamilies.headingSemiBold,
    fontSize: 26,
    lineHeight: 34,
  },
  status: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 22,
    lineHeight: 30,
  },
  speech: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 24,
    lineHeight: 34,
  },
  button: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 22,
    lineHeight: 28,
  },
} as const;

export const Fonts = {
  sans: FontFamilies.bodyRegular,
  serif: FontFamilies.headingSemiBold,
  rounded: FontFamilies.bodyRegular,
  mono: Platform.select({ ios: 'ui-monospace', default: 'monospace', web: 'var(--font-mono)' }) ?? 'monospace',
} as const;
