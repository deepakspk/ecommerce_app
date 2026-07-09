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
import { useAuth } from '@/hooks/useAuth';
import { isValidEmail, isValidNepaliPhone, isValidPassword } from '@/utils/validators';
import { getErrorMessage, getFieldErrors, getStatusCode } from '@/utils/errorHelpers';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

/** Signup auto-logs the user in on success, matching the web app (01-DOCUMENTATION.md §2.1). */
export function SignupScreen({ navigation }: Props) {
  const rootNavigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    return () => setPassword('');
  }, []);

  const handleSubmit = async () => {
    if (submitting) return;
    setFormError(null);
    setFieldErrors({});

    const nextFieldErrors: Record<string, string> = {};
    if (!name.trim()) nextFieldErrors.name = 'Name is required';
    if (!isValidEmail(email)) nextFieldErrors.email = 'Enter a valid email address';
    if (!isValidPassword(password))
      nextFieldErrors.password = 'Password must be at least 8 characters';
    if (phone.trim() && !isValidNepaliPhone(phone))
      nextFieldErrors.phone = 'Enter a valid Nepali phone number';
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      await signup({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      });
      rootNavigation.goBack();
    } catch (err) {
      const status = getStatusCode(err);
      if (status === 409) {
        setFieldErrors({ email: getErrorMessage(err) || 'This email is already in use' });
      } else {
        const fe = getFieldErrors(err);
        if (Object.keys(fe).length > 0) setFieldErrors(fe);
        else setFormError(getErrorMessage(err));
      }
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
        <Text style={typography.h1}>Create account</Text>

        {formError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{formError}</Text>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={typography.label}>Name</Text>
          <TextInput
            style={[styles.input, fieldErrors.name && styles.inputError]}
            value={name}
            onChangeText={setName}
            placeholder="Your full name"
          />
          {fieldErrors.name ? <Text style={styles.fieldError}>{fieldErrors.name}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={typography.label}>Email</Text>
          <TextInput
            style={[styles.input, fieldErrors.email && styles.inputError]}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          {fieldErrors.email ? <Text style={styles.fieldError}>{fieldErrors.email}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={typography.label}>Phone (optional)</Text>
          <TextInput
            style={[styles.input, fieldErrors.phone && styles.inputError]}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="98XXXXXXXX"
          />
          {fieldErrors.phone ? <Text style={styles.fieldError}>{fieldErrors.phone}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={typography.label}>Password</Text>
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

        <Pressable
          style={[styles.primaryBtn, submitting && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryBtnText}>Create Account</Text>
          )}
        </Pressable>

        <Pressable style={styles.link} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Already have an account? Log in</Text>
        </Pressable>

        <Pressable style={styles.closeBtn} onPress={() => rootNavigation.goBack()}>
          <Text style={styles.closeBtnText}>Close</Text>
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
  closeBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  closeBtnText: { color: colors.gray500, fontSize: 13 },
});
