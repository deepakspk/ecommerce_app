import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Category } from '@/types/category';
import { cloudinaryUrl } from '@/utils/cloudinary';
import { resolveAssetUrl } from '@/utils/assetUrl';
import { colors, radius, spacing, typography } from '@/theme';

const AVATAR_SIZE = 28;

interface Props {
  category: Category;
  onPress: () => void;
}

/** Horizontal pill (icon avatar + label) for Home's category quick-access row — letter-avatar fallback since most categories won't have an image set (01-DOCUMENTATION.md §2.2). */
export function CategoryTile({ category, onPress }: Props) {
  return (
    <Pressable style={styles.pill} onPress={onPress}>
      {category.image ? (
        <Image
          source={{ uri: cloudinaryUrl(resolveAssetUrl(category.image), AVATAR_SIZE * 2) }}
          style={styles.avatar}
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
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
  },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: radius.full, backgroundColor: colors.gray100 },
  fallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: { fontSize: 13, fontWeight: '700', color: colors.gray500 },
  name: { maxWidth: 140, color: colors.gray900, fontWeight: '500', fontSize: 13 },
});
