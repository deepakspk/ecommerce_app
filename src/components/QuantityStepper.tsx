import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme';

const DEBOUNCE_MS = 300;

interface Props {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
  max: number;
}

/**
 * The displayed value updates immediately for responsiveness; the actual
 * `onChange` (which fires a network request) is debounced so a fast
 * double-tap doesn't fire two overlapping requests that could race
 * (02-REACT-NATIVE-PROMPTS.md Prompt 5).
 */
export function QuantityStepper({ quantity, onChange, min = 1, max }: Props) {
  const [localQuantity, setLocalQuantity] = useState(quantity);
  const [prevQuantity, setPrevQuantity] = useState(quantity);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Adjust local state during render when the prop changes externally
  // (e.g. after a server refresh), rather than syncing via an effect.
  if (quantity !== prevQuantity) {
    setPrevQuantity(quantity);
    setLocalQuantity(quantity);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const commit = (next: number) => {
    setLocalQuantity(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(next), DEBOUNCE_MS);
  };

  return (
    <View style={styles.row}>
      <Pressable
        style={[styles.btn, localQuantity <= min && styles.btnDisabled]}
        onPress={() => commit(Math.max(min, localQuantity - 1))}
        disabled={localQuantity <= min}
        hitSlop={8}
      >
        <Ionicons name="remove" size={16} color={colors.gray700} />
      </Pressable>
      <Text style={styles.quantity}>{localQuantity}</Text>
      <Pressable
        style={[styles.btn, localQuantity >= max && styles.btnDisabled]}
        onPress={() => commit(Math.min(max, localQuantity + 1))}
        disabled={localQuantity >= max}
        hitSlop={8}
      >
        <Ionicons name="add" size={16} color={colors.gray700} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  btn: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  quantity: { minWidth: 20, textAlign: 'center', fontSize: 14, fontWeight: '600', color: colors.gray900 },
});
