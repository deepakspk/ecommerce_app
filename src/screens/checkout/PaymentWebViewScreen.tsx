import { useCallback, useMemo, useRef, useState } from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { CartStackParamList } from '@/navigation/types';
import { verifyKhalti, verifyEsewa } from '@/api/payments';
import { getErrorMessage } from '@/utils/errorHelpers';
import { Button } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

const KHALTI_CALLBACK_MARKER = '/payment/khalti/callback';
const ESEWA_CALLBACK_MARKER = '/payment/esewa/callback';

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Dependency-free base64 decode (ASCII payload only) — mirrors the web app's `atob` usage without assuming a global that may not exist in Hermes. */
function base64Decode(input: string): string {
  const clean = input.replace(/[^A-Za-z0-9+/=]/g, '');
  let output = '';
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < clean.length; i++) {
    if (clean[i] === '=') break;
    const value = BASE64_CHARS.indexOf(clean[i]);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}

function getQueryParams(url: string): URLSearchParams {
  const [, queryString] = url.split('?');
  return new URLSearchParams(queryString ?? '');
}

function extractPidx(url: string): string | null {
  return getQueryParams(url).get('pidx');
}

/** Same decode logic as the web app's `EsewaCallbackPage` — base64 `data` param first, bare `transaction_uuid` as fallback. */
function extractEsewaTransactionUuid(url: string): string | null {
  const params = getQueryParams(url);
  const data = params.get('data');
  if (data) {
    try {
      const decoded = JSON.parse(base64Decode(data));
      if (decoded.transaction_uuid) return decoded.transaction_uuid;
    } catch {
      // fall through to the bare param
    }
  }
  return params.get('transaction_uuid');
}

function escapeHtmlAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/**
 * Intercepts the gateway's redirect back to `FRONTEND_URL` client-side —
 * zero backend changes needed (01-DOCUMENTATION.md §2.11). Never trusts the
 * redirect alone: a matched callback triggers a real server-to-server verify
 * call before navigating anywhere.
 */
export function PaymentWebViewScreen() {
  const route = useRoute<RouteProp<CartStackParamList, 'PaymentWebView'>>();
  const navigation = useNavigation<NativeStackNavigationProp<CartStackParamList>>();
  const { gateway, orderId, paymentUrl, esewaFormUrl, esewaFields } = route.params;

  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const handledRef = useRef(false);

  const source = useMemo(() => {
    if (gateway === 'KHALTI') {
      return { uri: paymentUrl ?? '' };
    }
    const fields = esewaFields ?? ({} as Record<string, unknown>);
    const inputs = Object.entries(fields)
      .map(([key, value]) => `<input type="hidden" name="${escapeHtmlAttr(key)}" value="${escapeHtmlAttr(String(value))}" />`)
      .join('');
    const html = `<!DOCTYPE html><html><body><form method="POST" action="${esewaFormUrl}">${inputs}</form><script>document.forms[0].submit();</script></body></html>`;
    return { html };
  }, [gateway, paymentUrl, esewaFormUrl, esewaFields]);

  const handleShouldStart = useCallback(
    (request: WebViewNavigation) => {
      const { url } = request;
      const isKhaltiCallback = gateway === 'KHALTI' && url.includes(KHALTI_CALLBACK_MARKER);
      const isEsewaCallback = gateway === 'ESEWA' && url.includes(ESEWA_CALLBACK_MARKER);
      if (!isKhaltiCallback && !isEsewaCallback) return true;
      if (handledRef.current) return false;
      handledRef.current = true;
      setVerifying(true);

      if (isKhaltiCallback) {
        const pidx = extractPidx(url);
        if (!pidx) {
          setError('Missing payment reference from Khalti.');
          setVerifying(false);
          return false;
        }
        verifyKhalti(pidx)
          .then(() => navigation.replace('OrderDetail', { orderId }))
          .catch((err) => {
            setError(getErrorMessage(err));
            setVerifying(false);
          });
      } else {
        const transactionUuid = extractEsewaTransactionUuid(url);
        if (!transactionUuid) {
          setError('Missing payment reference from eSewa.');
          setVerifying(false);
          return false;
        }
        verifyEsewa(transactionUuid)
          .then(() => navigation.replace('OrderDetail', { orderId }))
          .catch((err) => {
            setError(getErrorMessage(err));
            setVerifying(false);
          });
      }
      return false;
    },
    [gateway, orderId, navigation],
  );

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={typography.h3}>{gateway === 'KHALTI' ? 'Pay with Khalti' : 'Pay with eSewa'}</Text>
        <Pressable onPress={() => navigation.replace('OrderDetail', { orderId })} hitSlop={8}>
          <Ionicons name="close" size={22} color={colors.gray700} />
        </Pressable>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={typography.muted}>
            Your order was created and may still be pending payment — check its status from Order Detail.
          </Text>
          <Button
            title="Go to Order Detail"
            onPress={() => navigation.replace('OrderDetail', { orderId })}
            fullWidth={false}
          />
        </View>
      ) : (
        <WebView
          source={source}
          onShouldStartLoadWithRequest={handleShouldStart}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.center}>
              <ActivityIndicator color={colors.brand600} size="large" />
            </View>
          )}
        />
      )}

      {verifying && !error ? (
        <View style={styles.verifyingOverlay}>
          <ActivityIndicator color={colors.white} size="large" />
          <Text style={styles.verifyingText}>Confirming your payment…</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorText: { color: colors.danger700, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  verifyingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  verifyingText: { color: colors.white, fontWeight: '600' },
});
