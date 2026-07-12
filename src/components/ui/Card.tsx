import { ReactNode, useMemo } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useThemeSettings } from '@/hooks/useThemeSettings';
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
 * is given, `View` otherwise. `selected`'s brand-tinted border/background is
 * the only part that reads the live theme (Prompt 11) so it re-skins with a
 * Super-Admin-picked brand color — the neutral base border stays static.
 */
export function Card({ children, selected, onPress, style }: Props) {
  const { colors: liveColors } = useThemeSettings();
  const selectedStyle = useMemo<ViewStyle>(
    () => ({ borderColor: liveColors.brand600, backgroundColor: liveColors.brand50 }),
    [liveColors],
  );
  const Component = (onPress ? Pressable : View) as typeof Pressable;

  return (
    <Component style={[styles.base, selected && selectedStyle, style]} onPress={onPress}>
      {children}
    </Component>
  );
}

const styles = StyleSheet.create({
  base: { borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
});
