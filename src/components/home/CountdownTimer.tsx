import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/theme';

interface Remaining {
  total: number;
  days: number;
  hours: number;
  mins: number;
  secs: number;
}

function getRemaining(endDate: string): Remaining {
  const diffMs = new Date(endDate).getTime() - Date.now();
  const total = Math.max(0, Math.floor(diffMs / 1000));
  return {
    total,
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    mins: Math.floor((total % 3600) / 60),
    secs: total % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

interface Props {
  /** Single source of truth — remaining time is recomputed from it every tick. */
  endDate: string;
  /** Color of the big 2-digit numbers (the campaign's theme color). */
  numberColor: string;
  /** Fired exactly once when remaining time reaches zero. */
  onExpire: () => void;
}

/**
 * DAYS : HOURS : MINS : SECS boxes ticking once per second (one interval,
 * cleared on unmount). The DAYS box only appears while days > 0
 * (docs/PROMPT-home-screen.md §Countdown timer).
 */
export function CountdownTimer({ endDate, numberColor, onExpire }: Props) {
  const [remaining, setRemaining] = useState<Remaining>(() => getRemaining(endDate));
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    const fireExpire = () => {
      if (expiredRef.current) return;
      expiredRef.current = true;
      onExpireRef.current();
    };

    if (getRemaining(endDate).total <= 0) {
      fireExpire();
      return undefined;
    }

    const timer = setInterval(() => {
      const next = getRemaining(endDate);
      setRemaining(next);
      if (next.total <= 0) {
        clearInterval(timer);
        fireExpire();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  const boxes: { label: string; value: number }[] = [
    ...(remaining.days > 0 ? [{ label: 'DAYS', value: remaining.days }] : []),
    { label: 'HRS', value: remaining.hours },
    { label: 'MINS', value: remaining.mins },
    { label: 'SECS', value: remaining.secs },
  ];

  return (
    <View style={styles.row}>
      {boxes.map((box, i) => (
        <View key={box.label} style={styles.group}>
          {i > 0 ? <Text style={styles.colon}>:</Text> : null}
          <View style={styles.box}>
            <Text style={[styles.number, { color: numberColor }]}>{pad(box.value)}</Text>
            <Text style={styles.label}>{box.label}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  group: { flexDirection: 'row', alignItems: 'center' },
  colon: { fontSize: 16, fontWeight: '700', color: colors.gray400, marginHorizontal: 3 },
  box: {
    minWidth: 44,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 10,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  number: { fontSize: 17, fontWeight: '800', lineHeight: 20 },
  label: { fontSize: 8, fontWeight: '600', color: colors.gray500, letterSpacing: 0.5 },
});
