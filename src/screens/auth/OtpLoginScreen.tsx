import { useEffect, useState } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { AuthStackParamList, RootStackParamList } from '@/navigation/types';
import { requestOtp } from '@/api/auth';
import { useAuth } from '@/hooks/useAuth';
import { isValidNepaliPhone, isValidOtp } from '@/utils/validators';
import { getErrorMessage, getStatusCode } from '@/utils/errorHelpers';
import { Button, FormError, Input } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpLogin'>;

/** Two-stage flow: request a code, then verify it (01-DOCUMENTATION.md §4.1). */
export function OtpLoginScreen({ navigation }: Props) {
  const rootNavigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { loginWithOtp } = useAuth();

  const [stage, setStage] = useState<'request' | 'verify'>('request');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    return () => setCode('');
  }, []);

  const handleRequestCode = async () => {
    if (submitting) return;
    setFormError(null);
    setFieldError(null);

    if (!isValidNepaliPhone(phone)) {
      setFieldError('Enter a valid Nepali phone number');
      return;
    }

    setSubmitting(true);
    try {
      await requestOtp(phone.trim());
      setStage('verify');
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (submitting) return;
    setFormError(null);
    setFieldError(null);

    if (!isValidOtp(code)) {
      setFieldError('Enter the 6-digit code');
      return;
    }

    setSubmitting(true);
    try {
      await loginWithOtp(phone.trim(), code.trim());
      rootNavigation.goBack();
    } catch (err) {
      const status = getStatusCode(err);
      if (status === 400) setFormError('Invalid or expired code');
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
        <Text style={typography.h1}>Log in with OTP</Text>

        <FormError message={formError} />

        {stage === 'request' ? (
          <>
            <Input
              label="Phone number"
              value={phone}
              onChangeText={setPhone}
              error={fieldError ?? undefined}
              keyboardType="phone-pad"
              placeholder="98XXXXXXXX"
            />

            <Button title="Send Code" onPress={handleRequestCode} loading={submitting} />
          </>
        ) : (
          <>
            <Text style={[typography.muted, styles.note]}>
              Enter the 6-digit code sent to {phone}
            </Text>
            <Input
              label="Verification code"
              value={code}
              onChangeText={setCode}
              error={fieldError ?? undefined}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="123456"
            />

            <Button title="Verify" onPress={handleVerify} loading={submitting} />

            <Pressable
              style={styles.link}
              onPress={() => setStage('request')}
              disabled={submitting}
            >
              <Text style={styles.linkText}>Use a different phone number</Text>
            </Pressable>
          </>
        )}

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
