import { useEffect, useState } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { AuthStackParamList, RootStackParamList } from '@/navigation/types';
import { resetPassword } from '@/api/auth';
import { isValidPassword } from '@/utils/validators';
import { getErrorMessage } from '@/utils/errorHelpers';
import { Button, FormError, Input } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

/**
 * The emailed link points at a web URL (`${FRONTEND_URL}/reset-password/:token`).
 * This app doesn't intercept arbitrary web links, so manual token entry is the
 * shipped fallback — a real deep link is optional/stretch (02-REACT-NATIVE-PROMPTS.md
 * Prompt 2).
 */
export function ResetPasswordScreen({ navigation }: Props) {
  const rootNavigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  useEffect(() => {
    return () => {
      setPassword('');
      setConfirmPassword('');
    };
  }, []);

  const handleSubmit = async () => {
    if (submitting) return;
    setFormError(null);
    setFieldErrors({});

    const nextFieldErrors: Record<string, string> = {};
    if (!token.trim()) nextFieldErrors.token = 'Paste the token from your reset email';
    if (!isValidPassword(password))
      nextFieldErrors.password = 'Password must be at least 8 characters';
    if (confirmPassword !== password) nextFieldErrors.confirmPassword = 'Passwords do not match';
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(token.trim(), password);
      setDone(true);
      setPassword('');
      setConfirmPassword('');
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
        <Text style={typography.h1}>Reset password</Text>
        <Text style={[typography.muted, styles.note]}>
          Paste the token from the reset email, then choose a new password.
        </Text>

        <FormError message={formError} />

        {done ? (
          <FormError variant="success" message="Password reset. You can log in with your new password now." />
        ) : (
          <>
            <Input
              label="Reset token"
              value={token}
              onChangeText={setToken}
              error={fieldErrors.token}
              autoCapitalize="none"
              placeholder="Token from your email"
            />

            <Input
              label="New password"
              value={password}
              onChangeText={setPassword}
              error={fieldErrors.password}
              secureTextEntry
              autoComplete="password-new"
              placeholder="At least 8 characters"
            />

            <Input
              label="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={fieldErrors.confirmPassword}
              secureTextEntry
              placeholder="Re-enter new password"
            />

            <Button title="Reset Password" onPress={handleSubmit} loading={submitting} />
          </>
        )}

        <Pressable
          style={styles.link}
          onPress={() => (done ? navigation.navigate('Login') : rootNavigation.goBack())}
        >
          <Text style={styles.linkText}>{done ? 'Go to login' : 'Cancel'}</Text>
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
