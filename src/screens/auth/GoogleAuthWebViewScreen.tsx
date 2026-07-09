import { useCallback, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/utils/errorHelpers';
import { colors, spacing, typography } from '@/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000/api';
const GOOGLE_AUTH_URL = `${API_URL}/auth/google`;
const CALLBACK_MARKER = '/oauth-callback';

/**
 * No backend changes needed: the server's `GET /auth/google` → Passport →
 * redirects the browser to `${FRONTEND_URL}/oauth-callback?token=<jwt>`
 * (01-DOCUMENTATION.md §2.1). We intercept that redirect client-side via
 * `onShouldStartLoadWithRequest`, cancel it (the page itself is meant for the
 * web app, not this one), pull the token out of the query string, and log in
 * with it directly (02-REACT-NATIVE-PROMPTS.md Prompt 2).
 */
export function GoogleAuthWebViewScreen() {
  const navigation = useNavigation();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const handledRef = useRef(false);

  const handleShouldStart = useCallback(
    (request: WebViewNavigation) => {
      const { url } = request;
      if (!url.includes(CALLBACK_MARKER)) return true;
      if (handledRef.current) return false;
      handledRef.current = true;

      const match = url.match(/[?&]token=([^&]+)/);
      const token = match ? decodeURIComponent(match[1]) : null;

      if (!token) {
        setError('Google sign-in did not return a token. Please try again.');
        return false;
      }

      loginWithToken(token)
        .then(() => navigation.goBack())
        .catch((err) => setError(getErrorMessage(err)));

      return false;
    },
    [loginWithToken, navigation],
  );

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <WebView
        source={{ uri: GOOGLE_AUTH_URL }}
        onShouldStartLoadWithRequest={handleShouldStart}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.center}>
            <ActivityIndicator color={colors.brand600} size="large" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.white,
  },
  errorText: { ...typography.body, color: colors.danger700, textAlign: 'center' },
});
