import { useCallback } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AccountStackParamList, MainTabParamList, RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/Avatar';
import { AccountMenuItem } from '@/components/AccountMenuItem';
import { LoginForm } from '@/components/auth/LoginForm';
import { colors, spacing, typography } from '@/theme';

/**
 * One consolidated Account screen (profile header + menu drill-ins) rather
 * than the web app's split /account + /settings — conventional for a mobile
 * Account tab (02-REACT-NATIVE-PROMPTS.md Prompt 8). Tapping the header opens
 * Edit Profile; the menu list is exactly Orders/Addresses/Wishlist/Change
 * Password/Terms/Logout per the prompt spec.
 *
 * Logged-out state renders the login form inline (not the AuthGuard modal)
 * so a guest lands on a usable page instead of a blank tab; Forgot
 * Password/OTP/Google/Signup still reuse AuthModal's existing screens.
 */
export function AccountScreen() {
  const navigation = useNavigation<NavigationProp<AccountStackParamList>>();
  const rootNavigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user, logout } = useAuth();

  const handleLogout = useCallback(() => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          // Never leave the user stranded on a now-inaccessible protected
          // screen — land back on a public, guest-usable screen.
          navigation.getParent<NavigationProp<MainTabParamList>>()?.navigate('HomeTab', { screen: 'Home' });
        },
      },
    ]);
  }, [logout, navigation]);

  const handleWishlist = useCallback(() => {
    navigation.getParent<NavigationProp<MainTabParamList>>()?.navigate('WishlistTab', { screen: 'WishlistRoot' });
  }, [navigation]);

  if (!user) {
    return (
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.authContainer} keyboardShouldPersistTaps="handled">
          <LoginForm
            onForgotPassword={() => rootNavigation.navigate('AuthModal', { screen: 'ForgotPassword' })}
            onOtpLogin={() => rootNavigation.navigate('AuthModal', { screen: 'OtpLogin' })}
            onGoogleAuth={() => rootNavigation.navigate('AuthModal', { screen: 'GoogleAuthWebView' })}
            onSignup={() => rootNavigation.navigate('AuthModal', { screen: 'Signup' })}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Pressable style={styles.header} onPress={() => navigation.navigate('EditProfile')}>
        <Avatar uri={user.avatarUrl} name={user.name} size={64} />
        <View style={styles.headerText}>
          <Text style={typography.h2}>{user.name}</Text>
          <Text style={typography.muted}>{user.email}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
      </Pressable>

      <View style={styles.menu}>
        <AccountMenuItem icon="receipt-outline" label="Orders" onPress={() => navigation.navigate('OrdersList')} />
        <AccountMenuItem icon="location-outline" label="Addresses" onPress={() => navigation.navigate('AddressList')} />
        <AccountMenuItem icon="heart-outline" label="Wishlist" onPress={handleWishlist} />
        <AccountMenuItem
          icon="lock-closed-outline"
          label="Change Password"
          onPress={() => navigation.navigate('ChangePassword')}
        />
        <AccountMenuItem icon="document-text-outline" label="Terms & Legal" onPress={() => navigation.navigate('Terms')} />
        <AccountMenuItem icon="log-out-outline" label="Logout" onPress={handleLogout} danger />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  container: { paddingBottom: spacing.xxl },
  authContainer: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerText: { flex: 1, gap: 2 },
  menu: { paddingHorizontal: spacing.lg },
});
