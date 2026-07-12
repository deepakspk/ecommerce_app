import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/theme';

interface Props {
  children: ReactNode;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Consistent bordered-white-surface wrapper — used everywhere a bordered
 * card previously got its own local `borderWidth/borderColor/borderRadius/
 * padding` block (address cards, order rows, return item rows, ...)
 * (02-REACT-NATIVE-PROMPTS.md Prompt 9). Renders as `Pressable` when `onPress`
 * is given, `View` otherwise.
 */
export function Card({ children, selected, onPress, style }: Props) {
  const Component = (onPress ? Pressable : View) as typeof Pressable;
  return (
    <Component style={[styles.base, selected && styles.selected, style]} onPress={onPress}>
      {children}
    </Component>
  );
}

const styles = StyleSheet.create({
  base: { borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
  selected: { borderColor: colors.brand600, backgroundColor: colors.brand50 },
});
