import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { isValidEmail, isValidPassword } from '@/utils/validators';
import { getErrorMessage, getStatusCode } from '@/utils/errorHelpers';
import { Button, FormError, Input } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

export interface LoginFormProps {
  onSuccess?: () => void;
  onForgotPassword: () => void;
  onOtpLogin: () => void;
  onGoogleAuth: () => void;
  onSignup: () => void;
}

/**
 * Core email/password login body, shared by the modal `LoginScreen` (reached
 * via AuthGuard/AuthModal for protected actions) and the Account tab's
 * logged-out state — so validation/submit logic and the Forgot Password/OTP/
 * Google/Signup entry points exist exactly once.
 */
export function LoginForm({ onSuccess, onForgotPassword, onOtpLogin, onGoogleAuth, onSignup }: LoginFormProps) {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Never leave a password sitting in memory after this form unmounts.
    return () => setPassword('');
  }, []);

  const handleSubmit = async () => {
    if (submitting) return;
    setFormError(null);
    setFieldErrors({});

    const nextFieldErrors: Record<string, string> = {};
    if (!isValidEmail(email)) nextFieldErrors.email = 'Enter a valid email address';
    if (!isValidPassword(password))
      nextFieldErrors.password = 'Password must be at least 8 characters';
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      onSuccess?.();
    } catch (err) {
      const status = getStatusCode(err);
      if (status === 401) setFormError('Invalid email or password');
      else if (status === 423) setFormError('Too many attempts — try again in 15 minutes');
      else if (status === 403) setFormError('This account has been disabled');
      else setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={typography.h1}>Log in</Text>

      <FormError message={formError} />

      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={fieldErrors.email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="you@example.com"
      />

      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        error={fieldErrors.password}
        secureTextEntry
        autoComplete="password"
        placeholder="••••••••"
      />

      <Button title="Log In" onPress={handleSubmit} loading={submitting} />

      <View style={styles.linkRow}>
        <Pressable onPress={onForgotPassword}>
          <Text style={styles.linkText}>Forgot password?</Text>
        </Pressable>
        <Pressable onPress={onOtpLogin}>
          <Text style={styles.linkText}>Log in with phone OTP</Text>
        </Pressable>
      </View>

      <Button title="Continue with Google" variant="secondary" onPress={onGoogleAuth} />

      <Pressable style={styles.signupRow} onPress={onSignup}>
        <Text style={typography.muted}>
          Don&apos;t have an account? <Text style={styles.linkText}>Sign up</Text>
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between' },
  linkText: { color: colors.brand600, fontSize: 13, fontWeight: '600' },
  signupRow: { alignItems: 'center', paddingVertical: spacing.xs },
});
