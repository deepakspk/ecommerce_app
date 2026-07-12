import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { AccountStackParamList } from '@/navigation/types';
import { changePassword } from '@/api/auth';
import { isValidPassword } from '@/utils/validators';
import { getErrorMessage, getFieldErrors, getStatusCode } from '@/utils/errorHelpers';
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

        {formError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{formError}</Text>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={typography.label}>Current Password</Text>
          <TextInput
            style={[styles.input, fieldErrors.currentPassword && styles.inputError]}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            autoComplete="current-password"
            placeholder="Leave blank if you signed up with Google or OTP"
          />
          {fieldErrors.currentPassword ? <Text style={styles.fieldError}>{fieldErrors.currentPassword}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={typography.label}>New Password</Text>
          <TextInput
            style={[styles.input, fieldErrors.newPassword && styles.inputError]}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoComplete="new-password"
            placeholder="••••••••"
          />
          {fieldErrors.newPassword ? <Text style={styles.fieldError}>{fieldErrors.newPassword}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={typography.label}>Confirm New Password</Text>
          <TextInput
            style={[styles.input, fieldErrors.confirmPassword && styles.inputError]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="new-password"
            placeholder="••••••••"
          />
          {fieldErrors.confirmPassword ? <Text style={styles.fieldError}>{fieldErrors.confirmPassword}</Text> : null}
        </View>

        <Pressable style={[styles.primaryBtn, submitting && styles.btnDisabled]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryBtnText}>Update Password</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  container: { padding: spacing.xl, gap: spacing.md, backgroundColor: colors.white },
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
  errorBanner: { backgroundColor: colors.danger50, borderRadius: 8, padding: spacing.md },
  errorBannerText: { color: colors.danger700, fontSize: 13 },
  primaryBtn: {
    backgroundColor: colors.brand600,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: colors.white, fontWeight: '600' },
});
