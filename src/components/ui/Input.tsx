import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

/**
 * Single source of truth for every labeled text field — border/radius/error
 * styling was previously copy-pasted verbatim into nearly every screen with a
 * form (02-REACT-NATIVE-PROMPTS.md Prompt 9). Pass `multiline`/`style` through
 * for textarea usages (reviews, questions, return reasons).
 */
export function Input({ label, error, style, ...rest }: InputProps) {
  return (
    <View style={styles.field}>
      {label ? <Text style={typography.label}>{label}</Text> : null}
      <TextInput style={[styles.input, error && styles.inputError, style]} placeholderTextColor={colors.gray400} {...rest} />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.gray900,
  },
  inputError: { borderColor: colors.danger600 },
  fieldError: { fontSize: 12, color: colors.danger600 },
});
