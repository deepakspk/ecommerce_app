import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductSummary } from '@/types/product';
import { useWishlist } from '@/hooks/useWishlist';
import { WishlistButton } from './WishlistButton';
import { cloudinaryUrl } from '@/utils/cloudinary';
import { resolveAssetUrl } from '@/utils/assetUrl';
import { colors, radius, spacing, typography } from '@/theme';

const DEFAULT_WIDTH = 140;

interface Props {
  product: ProductSummary;
  onPress: () => void;
  width?: number;
}

/**
 * Uses the server's precomputed `finalPrice`/`averageRating`/`reviewCount` —
 * never recomputes discount math on-device (01-DOCUMENTATION.md §2.3). The
 * rating row only renders when the product actually has reviews.
 */
export function ProductCard({ product, onPress, width = DEFAULT_WIDTH }: Props) {
  const image = product.images[0]?.url;
  const hasDiscount = product.discountType !== null && product.finalPrice < product.basePrice;
  const { isWishlisted, toggleItem } = useWishlist();
  const wishlisted = isWishlisted(product._id);

  return (
    <Pressable style={[styles.container, { width }]} onPress={onPress}>
      <View style={[styles.imageWrap, { width, height: width }]}>
        {image ? (
          <Image
            source={{ uri: cloudinaryUrl(resolveAssetUrl(image), width * 2) }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}
        {hasDiscount ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {product.discountType === 'PERCENTAGE'
                ? `-${product.discountValue}%`
                : `-Rs. ${product.discountValue}`}
            </Text>
          </View>
        ) : null}
        <WishlistButton
          active={wishlisted}
          onPress={() => toggleItem(product)}
          size={16}
          style={styles.wishlistBtn}
        />
      </View>

      <Text style={[typography.h3, styles.name]} numberOfLines={2}>
        {product.name}
      </Text>

      <View style={styles.priceRow}>
        <Text style={typography.priceList}>Rs. {product.finalPrice.toLocaleString()}</Text>
        {hasDiscount ? (
          <Text style={styles.strikePrice}>Rs. {product.basePrice.toLocaleString()}</Text>
        ) : null}
      </View>

      {product.reviewCount > 0 ? (
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={12} color={colors.warning600} />
          <Text style={styles.ratingText}>
            {(product.averageRating ?? 0).toFixed(1)} ({product.reviewCount})
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  imageWrap: { borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.gray100 },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { backgroundColor: colors.gray100 },
  badge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.danger600,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  wishlistBtn: { position: 'absolute', top: spacing.xs, right: spacing.xs },
  name: { minHeight: 34 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  strikePrice: { fontSize: 12, color: colors.gray500, textDecorationLine: 'line-through' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: 11, color: colors.gray500 },
});
