import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartItem } from '@/types/cart';
import { QuantityStepper } from './QuantityStepper';
import { variantLabel } from '@/utils/variantLabel';
import { getDiscountedPrice } from '@/utils/pricing';
import { cloudinaryUrl } from '@/utils/cloudinary';
import { resolveAssetUrl } from '@/utils/assetUrl';
import { colors, radius, spacing, typography } from '@/theme';

const THUMB_SIZE = 72;

interface Props {
  item: CartItem;
  onChangeQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export function CartLineItem({ item, onChangeQuantity, onRemove }: Props) {
  const variant = item.variantId;
  const product = variant.productId;
  const image = variant.imageUrl ?? product.images[0]?.url;
  const price = getDiscountedPrice(variant.price ?? product.basePrice, product.discountType, product.discountValue);
  const lineTotal = price * item.quantity;
  const label = variantLabel(variant);

  return (
    <View style={styles.container}>
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
        {label ? <Text style={typography.muted}>{label}</Text> : null}
        <View style={styles.bottomRow}>
          <QuantityStepper quantity={item.quantity} onChange={onChangeQuantity} max={variant.stockQuantity} />
          <Text style={typography.priceList}>Rs. {lineTotal.toLocaleString()}</Text>
        </View>
      </View>

      <Pressable onPress={onRemove} hitSlop={8} style={styles.removeBtn}>
        <Ionicons name="trash-outline" size={18} color={colors.danger600} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  image: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: radius.md, backgroundColor: colors.gray100 },
  imagePlaceholder: { backgroundColor: colors.gray100 },
  details: { flex: 1, gap: spacing.xs, justifyContent: 'space-between' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  removeBtn: { alignSelf: 'flex-start', padding: spacing.xs },
});
