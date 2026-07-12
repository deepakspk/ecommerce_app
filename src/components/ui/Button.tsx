import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/theme';

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

const SPINNER_COLOR: Record<ButtonVariant, string> = {
  primary: colors.white,
  secondary: colors.brand600,
  danger: colors.danger600,
  ghost: colors.brand600,
};

const VARIANT_STYLES: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: colors.brand600 },
  secondary: { borderWidth: 1, borderColor: colors.gray300, backgroundColor: colors.white },
  danger: { borderWidth: 1, borderColor: colors.danger600, backgroundColor: colors.white },
  ghost: { backgroundColor: 'transparent' },
};

const TEXT_VARIANT_STYLES: Record<ButtonVariant, TextStyle> = {
  primary: { color: colors.white },
  secondary: { color: colors.gray700 },
  danger: { color: colors.danger600 },
  ghost: { color: colors.brand600 },
};

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
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        VARIANT_STYLES[variant],
        size === 'sm' ? styles.sizeSm : styles.sizeMd,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={SPINNER_COLOR[variant]} size="small" />
      ) : (
        <Text style={[styles.text, TEXT_VARIANT_STYLES[variant], size === 'sm' && styles.textSm]}>{title}</Text>
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
