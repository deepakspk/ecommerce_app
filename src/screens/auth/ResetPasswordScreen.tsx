import { useEffect, useState } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
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
import { AuthStackParamList, RootStackParamList } from '@/navigation/types';
import { resetPassword } from '@/api/auth';
import { isValidPassword } from '@/utils/validators';
import { getErrorMessage } from '@/utils/errorHelpers';
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

        {formError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{formError}</Text>
          </View>
        ) : null}

        {done ? (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>
              Password reset. You can log in with your new password now.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.field}>
              <Text style={typography.label}>Reset token</Text>
              <TextInput
                style={[styles.input, fieldErrors.token && styles.inputError]}
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
                placeholder="Token from your email"
              />
              {fieldErrors.token ? (
                <Text style={styles.fieldError}>{fieldErrors.token}</Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={typography.label}>New password</Text>
              <TextInput
                style={[styles.input, fieldErrors.password && styles.inputError]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password-new"
                placeholder="At least 8 characters"
              />
              {fieldErrors.password ? (
                <Text style={styles.fieldError}>{fieldErrors.password}</Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={typography.label}>Confirm password</Text>
              <TextInput
                style={[styles.input, fieldErrors.confirmPassword && styles.inputError]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Re-enter new password"
              />
              {fieldErrors.confirmPassword ? (
                <Text style={styles.fieldError}>{fieldErrors.confirmPassword}</Text>
              ) : null}
            </View>

            <Pressable
              style={[styles.primaryBtn, submitting && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryBtnText}>Reset Password</Text>
              )}
            </Pressable>
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
