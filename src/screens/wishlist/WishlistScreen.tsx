import { useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { WishlistStackParamList } from '@/navigation/types';
import { useWishlist } from '@/hooks/useWishlist';
import { useCart } from '@/hooks/useCart';
import { getProductBySlug } from '@/api/products';
import { getDiscountedPrice } from '@/utils/pricing';
import { cloudinaryUrl } from '@/utils/cloudinary';
import { resolveAssetUrl } from '@/utils/assetUrl';
import { getErrorMessage } from '@/utils/errorHelpers';
import { WishlistItem } from '@/types/wishlist';
import { Button, EmptyState, FormError } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';

const THUMB_SIZE = 72;

/**
 * A wishlist entry has no variant of its own — "Move to Cart" re-fetches the
 * product to resolve a default/first-available variant before adding it,
 * matching the web app's approach (01-DOCUMENTATION.md §2.7).
 */
export function WishlistScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<WishlistStackParamList>>();
  const { items, loading, removeItem, clearWishlist } = useWishlist();
  const { addItem } = useCart();
  const [movingSlug, setMovingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMoveToCart = useCallback(
    async (item: WishlistItem) => {
      setError(null);
      setMovingSlug(item.productId.slug);
      try {
        const { variants } = await getProductBySlug(item.productId.slug);
        const variant = variants.find((v) => v.isDefault) ?? variants[0];
        if (!variant) {
          setError('This product has no purchasable variant.');
          return;
        }
        await addItem(
          {
            _id: variant._id,
            productId: {
              _id: item.productId._id,
              name: item.productId.name,
              slug: item.productId.slug,
              basePrice: item.productId.basePrice,
              discountType: null,
              images: item.productId.images,
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
        await removeItem(item.productId._id);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setMovingSlug(null);
      }
    },
    [addItem, removeItem],
  );

  if (!loading && items.length === 0) {
    return (
      <View style={styles.flex}>
        <EmptyState icon="heart-outline" title="Your wishlist is empty" message="Save products you love for later." />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.productId._id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={typography.h1}>Wishlist</Text>
            {items.length > 0 ? (
              <Pressable onPress={clearWishlist}>
                <Text style={styles.clearText}>Clear all</Text>
              </Pressable>
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          const product = item.productId;
          const image = product.images[0]?.url;
          const price = getDiscountedPrice(product.basePrice, null);
          const moving = movingSlug === product.slug;

          return (
            <Pressable
              style={styles.row}
              onPress={() => navigation.navigate('ProductDetail', { productSlug: product.slug })}
            >
              {image ? (
                <Image
                  source={{ uri: cloudinaryUrl(resolveAssetUrl(image), THUMB_SIZE * 2) }}
                  style={styles.image}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]} />
              )}
              <View style={styles.details}>
                <Text style={typography.h3} numberOfLines={2}>
                  {product.name}
                </Text>
                <Text style={typography.priceList}>Rs. {price.toLocaleString()}</Text>
                <View style={styles.actionsRow}>
                  <Button
                    title="Move to Cart"
                    onPress={() => handleMoveToCart(item)}
                    loading={moving}
                    size="sm"
                    fullWidth={false}
                  />
                  <Pressable onPress={() => removeItem(product._id)} hitSlop={8}>
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          );
        }}
      />

      {error ? (
        <View style={styles.errorBannerWrap}>
          <FormError message={error} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  clearText: { color: colors.danger600, fontWeight: '600', fontSize: 13 },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  image: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: radius.md, backgroundColor: colors.gray100 },
  imagePlaceholder: { backgroundColor: colors.gray100 },
  details: { flex: 1, gap: spacing.xs },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
  removeText: { color: colors.danger600, fontSize: 12, fontWeight: '500' },
  errorBannerWrap: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
});
