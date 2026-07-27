import { NavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={() => rootNavigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.gray900} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <LoginForm
          onSuccess={() => rootNavigation.goBack()}
          onForgotPassword={() => navigation.navigate('ForgotPassword')}
          onOtpLogin={() => navigation.navigate('OtpLogin')}
          onGoogleAuth={() => navigation.navigate('GoogleAuthWebView')}
          onSignup={() => navigation.navigate('Signup')}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.white,
  },
});
