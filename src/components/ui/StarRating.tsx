import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';

interface Props {
  rating: number;
  size?: number;
  maxStars?: number;
  /** Omit for a read-only display; provide to make the stars tappable (ReviewForm). */
  onChange?: (rating: number) => void;
}

export function StarRating({ rating, size = 16, maxStars = 5, onChange }: Props) {
  const stars = Array.from({ length: maxStars }, (_, i) => i + 1);

  return (
    <View style={styles.row}>
      {stars.map((star) => {
        const icon = (
          <Ionicons
            name={star <= Math.round(rating) ? 'star' : 'star-outline'}
            size={size}
            color={colors.warning600}
          />
        );
        return onChange ? (
          <Pressable key={star} onPress={() => onChange(star)} hitSlop={4}>
            {icon}
          </Pressable>
        ) : (
          <View key={star}>{icon}</View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
});
