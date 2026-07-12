import { useEffect, useState } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { AuthStackParamList, RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/hooks/useAuth';
import { isValidEmail, isValidPassword } from '@/utils/validators';
import { getErrorMessage, getStatusCode } from '@/utils/errorHelpers';
import { Button, FormError, Input } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

/**
 * Email/password login + entry points to Signup, OTP login, Google OAuth and
 * Forgot Password (02-REACT-NATIVE-PROMPTS.md Prompt 2).
 */
export function LoginScreen({ navigation }: Props) {
  const rootNavigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Never leave a password sitting in memory after this screen unmounts.
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
      rootNavigation.goBack();
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
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
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

        <Pressable style={styles.link} onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.linkText}>Forgot password?</Text>
        </Pressable>

        <Button title="Log In" onPress={handleSubmit} loading={submitting} />

        <Button
          title="Continue with Google"
          variant="secondary"
          onPress={() => navigation.navigate('GoogleAuthWebView')}
        />

        <Button title="Log in with phone OTP" variant="secondary" onPress={() => navigation.navigate('OtpLogin')} />

        <Pressable style={styles.link} onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.linkText}>New here? Create an account</Text>
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
