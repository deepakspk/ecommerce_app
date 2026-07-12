import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { AccountStackParamList } from '@/navigation/types';
import { changePassword } from '@/api/auth';
import { isValidPassword } from '@/utils/validators';
import { getErrorMessage, getFieldErrors, getStatusCode } from '@/utils/errorHelpers';
import { Button, FormError, Input } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

/**
 * `currentPassword` isn't required for OTP/Google-only accounts, but the
 * client has no field on `user` that says so (01-DOCUMENTATION.md §4.1) — the
 * field is shown with a hint and sent only if filled; the server is
 * authoritative on whether it was actually needed (Prompt 8).
 */
export function ChangePasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AccountStackParamList>>();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    return () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    };
  }, []);

  const handleSubmit = async () => {
    if (submitting) return;
    setFormError(null);
    setFieldErrors({});

    const nextFieldErrors: Record<string, string> = {};
    if (!isValidPassword(newPassword)) nextFieldErrors.newPassword = 'Password must be at least 8 characters';
    if (confirmPassword !== newPassword) nextFieldErrors.confirmPassword = "Passwords don't match";
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      await changePassword({ newPassword, currentPassword: currentPassword || undefined });
      navigation.goBack();
    } catch (err) {
      const serverFieldErrors = getFieldErrors(err);
      const status = getStatusCode(err);
      if (Object.keys(serverFieldErrors).length > 0) {
        setFieldErrors(serverFieldErrors);
      } else if (status === 400 || status === 401) {
        setFieldErrors({ currentPassword: getErrorMessage(err) });
      } else {
        setFormError(getErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={typography.h1}>Change Password</Text>

        <FormError message={formError} />

        <Input
          label="Current Password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          error={fieldErrors.currentPassword}
          secureTextEntry
          autoComplete="current-password"
          placeholder="Leave blank if you signed up with Google or OTP"
        />

        <Input
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          error={fieldErrors.newPassword}
          secureTextEntry
          autoComplete="new-password"
          placeholder="••••••••"
        />

        <Input
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={fieldErrors.confirmPassword}
          secureTextEntry
          autoComplete="new-password"
          placeholder="••••••••"
        />

        <Button title="Update Password" onPress={handleSubmit} loading={submitting} style={styles.submitBtn} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  container: { padding: spacing.xl, gap: spacing.md, backgroundColor: colors.white },
  submitBtn: { marginTop: spacing.md },
});
