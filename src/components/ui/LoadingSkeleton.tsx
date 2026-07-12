import { useEffect, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius } from '@/theme';

interface Props {
  width?: number | `${number}%`;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Shimmering placeholder block — opacity-pulses via the RN-builtin `Animated`
 * API (no new animation library, per Prompt 9's performance note). Applied to
 * the product grid and orders list in place of a bare centered spinner.
 */
export function LoadingSkeleton({ width = '100%', height = 16, style }: Props) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.base, { width, height, opacity }, style]} />;
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.gray200, borderRadius: radius.sm },
});
