import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';

type ToastVariant = 'success' | 'error';
interface ToastMessage {
  id: number;
  message: string;
  variant: ToastVariant;
}

let listener: ((toast: ToastMessage) => void) | null = null;
let nextId = 0;
const DISPLAY_MS = 2500;

/**
 * Lightweight, non-blocking confirmation (e.g. "Added to cart"). Per this
 * project's standing UX rule, a toast must never be the *only* signal for a
 * failure — inline `FormError` banners stay the durable error surface
 * everywhere; toasts are for supplementary success confirmations only
 * (02-REACT-NATIVE-PROMPTS.md Prompt 9).
 */
export function showToast(message: string, variant: ToastVariant = 'success') {
  listener?.({ id: nextId++, message, variant });
}

/** Mounted once near the app root (`App.tsx`). */
export function ToastHost() {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    listener = (next) => setToast(next);
    return () => {
      listener = null;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current));
    }, DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={[styles.toast, toast.variant === 'error' && styles.error]}>
        <Text style={styles.text}>{toast.message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.xxl,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  toast: {
    backgroundColor: colors.gray900,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    maxWidth: '100%',
  },
  error: { backgroundColor: colors.danger600 },
  text: { color: colors.white, fontSize: 13, fontWeight: '600' },
});
