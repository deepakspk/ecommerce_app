import { NavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { AuthStackParamList, RootStackParamList } from '@/navigation/types';
import { LoginForm } from '@/components/auth/LoginForm';
import { colors, spacing } from '@/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

/**
 * Email/password login + entry points to Signup, OTP login, Google OAuth and
 * Forgot Password (02-REACT-NATIVE-PROMPTS.md Prompt 2). Form logic lives in
 * `LoginForm`, shared with the Account tab's logged-out state.
 */
export function LoginScreen({ navigation }: Props) {
  const rootNavigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <LoginForm
          onSuccess={() => rootNavigation.goBack()}
          onForgotPassword={() => navigation.navigate('ForgotPassword')}
          onOtpLogin={() => navigation.navigate('OtpLogin')}
          onGoogleAuth={() => navigation.navigate('GoogleAuthWebView')}
          onSignup={() => navigation.navigate('Signup')}
        />

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
  closeBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  closeBtnText: { color: colors.gray500, fontSize: 13 },
});
