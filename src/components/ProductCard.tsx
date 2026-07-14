import { useEffect, useRef, useState } from 'react';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ProductSummary } from '@/types/product';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useThemeSettings } from '@/hooks/useThemeSettings';
import { getProductBySlug } from '@/api/products';
import { WishlistButton } from './WishlistButton';
import { cloudinaryUrl } from '@/utils/cloudinary';
import { resolveAssetUrl } from '@/utils/assetUrl';
import { StarRating } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

const DEFAULT_WIDTH = 160;
const ADDED_RESET_MS = 2000;

interface Props {
  product: ProductSummary;
  onPress: () => void;
  width?: number;
}

type AddState = 'idle' | 'adding' | 'added';

/**
 * Card-ready fields (`finalPrice`/`hasDiscount`/`discountPercent`/ratings) are
 * server-computed and authoritative — never recomputed on-device
 * (docs/PROMPT-home-screen.md). Older endpoints may omit the newer
 * `hasDiscount`/`discountPercent` fields, so both fall back to the
 * `discountType`-based derivation this card always used.
 *
 * Button rule: `variantCount > 1` → "Select Options" (opens the detail screen
 * so the user can pick a variant); otherwise "Add to Cart" fetches the single
 * variant on demand and adds qty 1 via the cart context.
 */
export function ProductCard({ product, onPress, width = DEFAULT_WIDTH }: Props) {
  const image = product.images?.[0]?.url;
  const hasDiscount =
    product.hasDiscount ?? (product.discountType !== null && product.finalPrice < product.basePrice);
  const discountPercent =
    product.discountPercent ??
    (product.basePrice > 0
      ? Math.round(((product.basePrice - product.finalPrice) / product.basePrice) * 100)
      : 0);

  const { colors: brand } = useThemeSettings();
  const { isWishlisted, toggleItem } = useWishlist();
  const { addItem } = useCart();
  const wishlisted = isWishlisted(product._id);

  const [addState, setAddState] = useState<AddState>('idle');
  const [addError, setAddError] = useState<string | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  const handleAddToCart = async () => {
    if (addState !== 'idle') return;
    setAddError(null);
    setAddState('adding');
    try {
      const { product: detail, variants } = await getProductBySlug(product.slug);
      const variant =
        variants.find((v) => v.isDefault && v.stockQuantity > 0) ??
        variants.find((v) => v.stockQuantity > 0);
      if (!variant) {
        setAddError('Out of stock');
        setAddState('idle');
        return;
      }
      // Same populated-variant mapping ProductDetailScreen's add-to-cart uses.
      await addItem(
        {
          _id: variant._id,
          productId: {
            _id: detail._id,
            name: detail.name,
            slug: detail.slug,
            basePrice: detail.basePrice,
            discountType: detail.discountType,
            discountValue: detail.discountValue,
            images: detail.images,
          },
          size: variant.size,
          color: variant.color,
          sku: variant.sku,
          price: variant.price,
          stockQuantity: variant.stockQuantity,
          imageUrl: variant.imageUrl,
          isDefault: variant.isDefault,
        },
        1,
      );
      setAddState('added');
      resetTimer.current = setTimeout(() => setAddState('idle'), ADDED_RESET_MS);
    } catch {
      setAddError("Couldn't add to cart");
      setAddState('idle');
    }
  };

  const selectOptions = product.variantCount > 1;

  return (
    <Pressable style={[styles.container, { width }]} onPress={onPress}>
      <View style={[styles.imageWrap, { width: width - 2, height: width - 2 }]}>
        {image ? (
          <Image
            source={{ uri: cloudinaryUrl(resolveAssetUrl(image), 400) }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.noImageText}>No image</Text>
          </View>
        )}
        {hasDiscount && discountPercent > 0 ? (
          <View style={[styles.badge, { backgroundColor: brand.brand600 }]}>
            <Text style={styles.badgeText}>-{discountPercent}%</Text>
          </View>
        ) : null}
        <WishlistButton
          active={wishlisted}
          onPress={() => toggleItem(product)}
          size={18}
          style={styles.wishlistBtn}
        />
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        {product.reviewCount > 0 ? (
          <View style={styles.ratingRow}>
            <StarRating rating={product.averageRating ?? 0} size={11} />
            <Text style={styles.ratingText}>({product.reviewCount})</Text>
          </View>
        ) : (
          <Text style={styles.noRatings}>No ratings yet</Text>
        )}

        <View style={styles.priceRow}>
          <Text style={[styles.price, hasDiscount ? { color: brand.brand600 } : null]}>
            Rs. {product.finalPrice.toLocaleString()}
          </Text>
          {hasDiscount ? (
            <Text style={styles.strikePrice}>Rs. {product.basePrice.toLocaleString()}</Text>
          ) : null}
        </View>

        <Pressable
          style={[
            styles.button,
            { backgroundColor: brand.brand600 },
            addState === 'added' && styles.buttonAdded,
            addState === 'adding' && styles.buttonDisabled,
          ]}
          disabled={addState !== 'idle'}
          onPress={selectOptions ? onPress : handleAddToCart}
        >
          {addState === 'adding' ? <ActivityIndicator size={12} color={colors.white} /> : null}
          <Text style={styles.buttonText}>
            {selectOptions
              ? 'Select Options'
              : addState === 'added'
                ? 'Added!'
                : addState === 'adding'
                  ? 'Adding…'
                  : 'Add to Cart'}
          </Text>
        </Pressable>
        {addError ? <Text style={styles.addError}>{addError}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray100,
    shadowColor: colors.black,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  imageWrap: {
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    overflow: 'hidden',
    backgroundColor: colors.gray100,
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  noImageText: { fontSize: 12, color: colors.gray400 },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  wishlistBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  body: { padding: spacing.md, gap: spacing.xs },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray900,
    lineHeight: 18,
    minHeight: 36,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  ratingText: { fontSize: 11, color: colors.gray500 },
  noRatings: { fontSize: 11, color: colors.gray400 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, flexWrap: 'wrap' },
  price: { fontSize: 15, fontWeight: '700', color: colors.gray900 },
  strikePrice: { fontSize: 11, color: colors.gray500, textDecorationLine: 'line-through' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    marginTop: 2,
  },
  buttonAdded: { backgroundColor: colors.success600 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  addError: { fontSize: 10, color: colors.danger600 },
});
