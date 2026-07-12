import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ApplyCouponResponse, applyCoupon } from '@/api/cart';
import { getErrorMessage } from '@/utils/errorHelpers';
import { colors, radius, spacing } from '@/theme';

interface Props {
  onApplied: (result: ApplyCouponResponse) => void;
}

/**
 * Applies a coupon and reports the result up to the parent, which owns the
 * applied-coupon state and the staleness check against the live cart
 * subtotal (02-REACT-NATIVE-PROMPTS.md Prompt 6) — this component only
 * knows how to submit a code.
 */
export function CouponInput({ onApplied }: Props) {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (!code.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await applyCoupon(code.trim());
      onApplied(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={setCode}
          placeholder="Coupon code"
          placeholderTextColor={colors.gray400}
          autoCapitalize="characters"
        />
        <Pressable style={[styles.applyBtn, submitting && styles.applyBtnDisabled]} onPress={handleApply} disabled={submitting}>
          {submitting ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.applyText}>Apply</Text>}
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.gray900,
  },
  applyBtn: {
    backgroundColor: colors.brand600,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnDisabled: { opacity: 0.7 },
  applyText: { color: colors.white, fontWeight: '600', fontSize: 13 },
  error: { color: colors.danger600, fontSize: 12 },
});
