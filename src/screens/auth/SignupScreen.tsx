import { useEffect, useState } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { AuthStackParamList, RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/hooks/useAuth';
import { isValidEmail, isValidNepaliPhone, isValidPassword } from '@/utils/validators';
import { getErrorMessage, getFieldErrors, getStatusCode } from '@/utils/errorHelpers';
import { Button, FormError, Input } from '@/components/ui';
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

        <FormError message={formError} />

        <Input label="Name" value={name} onChangeText={setName} error={fieldErrors.name} placeholder="Your full name" />

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
          label="Phone (optional)"
          value={phone}
          onChangeText={setPhone}
          error={fieldErrors.phone}
          keyboardType="phone-pad"
          placeholder="98XXXXXXXX"
        />

        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          error={fieldErrors.password}
          secureTextEntry
          autoComplete="password-new"
          placeholder="At least 8 characters"
        />

        <Button title="Create Account" onPress={handleSubmit} loading={submitting} />

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
  link: { alignItems: 'center', paddingVertical: spacing.xs },
  linkText: { color: colors.brand600, fontSize: 13, fontWeight: '500' },
  closeBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  closeBtnText: { color: colors.gray500, fontSize: 13 },
});
