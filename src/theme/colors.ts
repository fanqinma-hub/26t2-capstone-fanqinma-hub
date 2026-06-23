export const BrandColors = {
  tangerine: '#FD902B',
  mimosa: '#FDD652',
  marsala: '#673F40',
  pewter: '#D0D1D3',
} as const;

export const SemanticColors = {
  background: '#FFF9F1',
  surface: '#FFFFFF',
  surfaceMuted: '#F3EEE8',
  surfaceAccent: '#FFF0D9',
  primaryText: '#2B1B1C',
  secondaryText: '#5D4A4B',
  success: '#2E7D32',
  warning: '#8A5A00',
  error: '#B42318',
  focus: '#205A8B',
  disabled: '#8C8C8C',
} as const;

export const Colors = {
  light: {
    text: SemanticColors.primaryText,
    background: SemanticColors.background,
    backgroundElement: SemanticColors.surfaceMuted,
    backgroundSelected: SemanticColors.surfaceAccent,
    textSecondary: SemanticColors.secondaryText,
    surface: SemanticColors.surface,
    primary: BrandColors.tangerine,
    accent: BrandColors.mimosa,
    success: SemanticColors.success,
    warning: SemanticColors.warning,
    error: SemanticColors.error,
    focus: SemanticColors.focus,
    disabled: SemanticColors.disabled,
  },
  dark: {
    text: '#FFF9F1',
    background: '#2B1B1C',
    backgroundElement: '#493536',
    backgroundSelected: BrandColors.marsala,
    textSecondary: '#E3D6CF',
    surface: '#3A292A',
    primary: BrandColors.tangerine,
    accent: BrandColors.mimosa,
    success: '#76C779',
    warning: '#FFD166',
    error: '#FF8D85',
    focus: '#8CC8FF',
    disabled: BrandColors.pewter,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
