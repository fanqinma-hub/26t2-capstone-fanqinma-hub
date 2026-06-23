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
    fontSize: 18,
    lineHeight: 26,
  },
  bodyStrong: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 18,
    lineHeight: 26,
  },
  bodySmall: {
    fontFamily: FontFamilies.bodyRegular,
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  heading: {
    fontFamily: FontFamilies.headingBold,
    fontSize: 30,
    lineHeight: 38,
  },
  headingSmall: {
    fontFamily: FontFamilies.headingSemiBold,
    fontSize: 22,
    lineHeight: 30,
  },
  status: {
    fontFamily: FontFamilies.bodyBold,
    fontSize: 20,
    lineHeight: 28,
  },
} as const;

export const Fonts = {
  sans: FontFamilies.bodyRegular,
  serif: FontFamilies.headingSemiBold,
  rounded: FontFamilies.bodyRegular,
  mono: Platform.select({ ios: 'ui-monospace', default: 'monospace', web: 'var(--font-mono)' }) ?? 'monospace',
} as const;
