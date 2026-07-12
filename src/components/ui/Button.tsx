import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { useThemeSettings } from '@/hooks/useThemeSettings';
import { radius, spacing } from '@/theme';
import type { ColorPalette } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  /** Block button spanning its container (the default, and every full-width form CTA); set false for pill/inline placement. */
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Only `primary`'s fill and `ghost`'s text/spinner touch the brand color —
 * built from the live palette so the button re-renders the moment
 * `ThemeSettingsContext` resolves a Super-Admin-configured brand color
 * (02-REACT-NATIVE-PROMPTS.md Prompt 11), instead of the static default.
 */
function buildVariants(palette: ColorPalette) {
  const spinnerColor: Record<ButtonVariant, string> = {
    primary: palette.white,
    secondary: palette.brand600,
    danger: palette.danger600,
    ghost: palette.brand600,
  };
  const variantStyles: Record<ButtonVariant, ViewStyle> = {
    primary: { backgroundColor: palette.brand600 },
    secondary: { borderWidth: 1, borderColor: palette.gray300, backgroundColor: palette.white },
    danger: { borderWidth: 1, borderColor: palette.danger600, backgroundColor: palette.white },
    ghost: { backgroundColor: 'transparent' },
  };
  const textVariantStyles: Record<ButtonVariant, TextStyle> = {
    primary: { color: palette.white },
    secondary: { color: palette.gray700 },
    danger: { color: palette.danger600 },
    ghost: { color: palette.brand600 },
  };
  return { spinnerColor, variantStyles, textVariantStyles };
}

/**
 * Single source of truth for every button in the app — replaces the ~15
 * screen-local `primaryBtn`/`submitBtn`/`dangerActionBtn`/`secondaryBtn`
 * style duplicates built ad hoc across Prompts 2-8 (02-REACT-NATIVE-PROMPTS.md
 * Prompt 9). The label<->spinner swap never changes the button's own size,
 * since sizing comes from the button container, not its content.
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}: ButtonProps) {
  const { colors } = useThemeSettings();
  const { spinnerColor, variantStyles, textVariantStyles } = useMemo(() => buildVariants(colors), [colors]);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        variantStyles[variant],
        size === 'sm' ? styles.sizeSm : styles.sizeMd,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor[variant]} size="small" />
      ) : (
        <Text style={[styles.text, textVariantStyles[variant], size === 'sm' && styles.textSm]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  fullWidth: { alignSelf: 'stretch' },
  sizeMd: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  sizeSm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  disabled: { opacity: 0.7 },
  text: { fontWeight: '600', fontSize: 14 },
  textSm: { fontSize: 13 },
});
