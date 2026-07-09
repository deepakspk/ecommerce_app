import { useEffect, useRef } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/theme';

/**
 * Generic "require login" wrapper: `<AuthGuard><RealScreen/></AuthGuard>`.
 * If `user` is absent, presents AuthStack modally instead of rendering
 * children, and listens to context state (not a one-shot check) so the
 * protected content renders automatically the moment login succeeds.
 * Will wrap Cart-checkout, Addresses, Settings, Orders, and Account screens
 * once those land (02-REACT-NATIVE-PROMPTS.md Prompt 2).
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const hasPromptedRef = useRef(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      if (!hasPromptedRef.current) {
        hasPromptedRef.current = true;
        navigation.navigate('AuthModal', { screen: 'Login' });
      }
    } else {
      hasPromptedRef.current = false;
    }
  }, [user, loading, navigation]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.brand600} size="large" />
      </View>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
});
