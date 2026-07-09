import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { SignupScreen } from '@/screens/auth/SignupScreen';
import { ForgotPasswordScreen } from '@/screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '@/screens/auth/ResetPasswordScreen';
import { OtpLoginScreen } from '@/screens/auth/OtpLoginScreen';
import { GoogleAuthWebViewScreen } from '@/screens/auth/GoogleAuthWebViewScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Presented modally from RootNavigator whenever a protected action needs auth
 * (see AuthGuard, 02-REACT-NATIVE-PROMPTS.md Prompt 2). Login is the entry
 * point; every other screen is reached from it.
 */
export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="OtpLogin" component={OtpLoginScreen} />
      <Stack.Screen name="GoogleAuthWebView" component={GoogleAuthWebViewScreen} />
    </Stack.Navigator>
  );
}
