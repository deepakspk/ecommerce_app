import { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { AuthStackParamList } from '@/navigation/types';
import { forgotPassword } from '@/api/auth';
import { isValidEmail } from '@/utils/validators';
import { getErrorMessage } from '@/utils/errorHelpers';
import { Button, FormError, Input } from '@/components/ui';
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

        <FormError message={formError} />
        <FormError
          variant="success"
          message={sent ? 'If an account exists for that email, a reset link is on its way.' : null}
        />

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          error={fieldError ?? undefined}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="you@example.com"
          editable={!sent}
        />

        {!sent ? <Button title="Send Reset Link" onPress={handleSubmit} loading={submitting} /> : null}

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
  link: { alignItems: 'center', paddingVertical: spacing.xs },
  linkText: { color: colors.brand600, fontSize: 13, fontWeight: '500' },
});
