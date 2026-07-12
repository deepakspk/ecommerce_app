import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/theme';

interface Props {
  message?: string | null;
  variant?: 'error' | 'success';
}

/**
 * Single top-of-screen banner — replaces the ~15 duplicated
 * `errorBanner`/`successBanner` style pairs built ad hoc across every form
 * since Prompt 2 (02-REACT-NATIVE-PROMPTS.md Prompt 9). Renders nothing when
 * there's no message, so callers can render it unconditionally.
 */
export function FormError({ message, variant = 'error' }: Props) {
  if (!message) return null;
  return (
    <View style={[styles.banner, variant === 'success' && styles.success]}>
      <Text style={[styles.text, variant === 'success' && styles.successText]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: colors.danger50, borderRadius: 8, padding: spacing.md },
  text: { color: colors.danger700, fontSize: 13 },
  success: { backgroundColor: colors.success50 },
  successText: { color: colors.success700 },
});
