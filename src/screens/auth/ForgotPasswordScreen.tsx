import { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AuthStackParamList } from '@/navigation/types';
import { forgotPassword } from '@/api/auth';
import { isValidEmail } from '@/utils/validators';
import { getErrorMessage } from '@/utils/errorHelpers';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

/**
 * The server's response is intentionally generic (no email enumeration,
 * 01-DOCUMENTATION.md §4.1) — show the same confirmation regardless of
 * whether the address exists.
 */
export function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;
    setFormError(null);
    setFieldError(null);

    if (!isValidEmail(email)) {
      setFieldError('Enter a valid email address');
      return;
    }

    setSubmitting(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={typography.h1}>Forgot password</Text>
        <Text style={[typography.muted, styles.note]}>
          Enter your account email and we&apos;ll send you a reset link.
        </Text>

        {formError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{formError}</Text>
          </View>
        ) : null}

        {sent ? (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>
              If an account exists for that email, a reset link is on its way.
            </Text>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={typography.label}>Email</Text>
          <TextInput
            style={[styles.input, fieldError && styles.inputError]}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="you@example.com"
            editable={!sent}
          />
          {fieldError ? <Text style={styles.fieldError}>{fieldError}</Text> : null}
        </View>

        {!sent ? (
          <Pressable
            style={[styles.primaryBtn, submitting && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryBtnText}>Send Reset Link</Text>
            )}
          </Pressable>
        ) : null}

        <Pressable style={styles.link} onPress={() => navigation.navigate('ResetPassword')}>
          <Text style={styles.linkText}>Already have a reset token? Enter it here</Text>
        </Pressable>

        <Pressable style={styles.link} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Back to login</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.white,
  },
  note: { marginBottom: spacing.sm },
  field: { gap: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.gray900,
  },
  inputError: { borderColor: colors.danger600 },
  fieldError: { fontSize: 12, color: colors.danger600 },
  errorBanner: {
    backgroundColor: colors.danger50,
    borderRadius: 8,
    padding: spacing.md,
  },
  errorBannerText: { color: colors.danger700, fontSize: 13 },
  successBanner: {
    backgroundColor: colors.success50,
    borderRadius: 8,
    padding: spacing.md,
  },
  successBannerText: { color: colors.success700, fontSize: 13 },
  primaryBtn: {
    backgroundColor: colors.brand600,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: colors.white, fontWeight: '600' },
  link: { alignItems: 'center', paddingVertical: spacing.xs },
  linkText: { color: colors.brand600, fontSize: 13, fontWeight: '500' },
});
