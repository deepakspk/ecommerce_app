import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ApplyCouponResponse, applyCoupon } from '@/api/cart';
import { getErrorMessage } from '@/utils/errorHelpers';
import { Button, Input } from '@/components/ui';
import { colors, spacing } from '@/theme';

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
        <View style={styles.inputWrap}>
          <Input value={code} onChangeText={setCode} placeholder="Coupon code" autoCapitalize="characters" />
        </View>
        <Button title="Apply" onPress={handleApply} loading={submitting} fullWidth={false} />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  inputWrap: { flex: 1 },
  error: { color: colors.danger600, fontSize: 12 },
});
