import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Category } from '@/types/category';
import { cloudinaryUrl } from '@/utils/cloudinary';
import { resolveAssetUrl } from '@/utils/assetUrl';
import { colors, radius, spacing, typography } from '@/theme';

const TILE_SIZE = 64;

interface Props {
  category: Category;
  onPress: () => void;
}

/** Letter-avatar fallback since most categories won't have an image set (01-DOCUMENTATION.md §2.2). */
export function CategoryTile({ category, onPress }: Props) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      {category.image ? (
        <Image
          source={{ uri: cloudinaryUrl(resolveAssetUrl(category.image), TILE_SIZE * 2) }}
          style={styles.image}
          contentFit="cover"
        />
      ) : (
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>{category.name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <Text style={[typography.label, styles.name]} numberOfLines={1}>
        {category.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { width: TILE_SIZE + spacing.lg, alignItems: 'center', gap: spacing.xs },
  image: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.gray100,
  },
  fallback: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.brand50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: { fontSize: 22, fontWeight: '700', color: colors.brand700 },
  name: { textAlign: 'center' },
});
