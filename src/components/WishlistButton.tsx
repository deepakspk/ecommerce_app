import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '@/theme';

interface Props {
  active: boolean;
  onPress: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/** Heart icon toggle, filled red when active — usable as a ProductCard overlay or inline on ProductDetailScreen. */
export function WishlistButton({ active, onPress, size = 20, style }: Props) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={[styles.btn, style]}>
      <Ionicons
        name={active ? 'heart' : 'heart-outline'}
        size={size}
        color={active ? colors.danger600 : colors.gray400}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.white,
    borderRadius: radius.full,
    padding: 4,
  },
});
