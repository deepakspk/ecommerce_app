import { useCallback, useEffect, useMemo, useState } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList, RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { getProductBySlug, ProductDetailResponse } from '@/api/products';
import { getReviewEligibility, getReviews, submitReview } from '@/api/reviews';
import { getQuestions, submitQuestion } from '@/api/questions';
import { createStockAlert } from '@/api/stockAlerts';
import { addRecentlyViewed } from '@/utils/recentlyViewed';
import { getDiscountedPrice } from '@/utils/pricing';
import { cloudinaryUrl } from '@/utils/cloudinary';
import { resolveAssetUrl } from '@/utils/assetUrl';
import { getErrorMessage } from '@/utils/errorHelpers';
import { Review, ReviewEligibility } from '@/types/review';
import { User } from '@/types/user';
import { ProductQuestion } from '@/types/question';
import { VariantPicker } from '@/components/VariantPicker';
import { StarRating } from '@/components/StarRating';
import { ReviewList } from '@/components/ReviewList';
import { ReviewForm } from '@/components/ReviewForm';
import { QuestionList } from '@/components/QuestionList';
import { QuestionForm } from '@/components/QuestionForm';
import { ProductRail } from '@/components/ProductRail';
import { RecentlyViewedRail } from '@/components/RecentlyViewedRail';
import { EmptyState } from '@/components/EmptyState';
import { WishlistButton } from '@/components/WishlistButton';
import { colors, radius, spacing, typography } from '@/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

type FetchState = 'loading' | 'ready' | 'error';
type Tab = 'description' | 'info' | 'shipping';

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchProduct(
  slug: string,
  setData: (data: ProductDetailResponse) => void,
  setState: (state: FetchState) => void,
  setSelectedSize: (size: string | undefined) => void,
  setSelectedColor: (color: string | undefined) => void,
  setQuantity: (quantity: number) => void,
  setGalleryIndex: (index: number) => void,
) {
  setState('loading');
  try {
    const res = await getProductBySlug(slug);
    setData(res);
    const defaultVariant = res.variants.find((v) => v.isDefault) ?? res.variants[0];
    setSelectedSize(defaultVariant?.size);
    setSelectedColor(defaultVariant?.color);
    setQuantity(1);
    setGalleryIndex(0);
    setState('ready');
    addRecentlyViewed(slug);
  } catch {
    setState('error');
  }
}

async function fetchReviews(
  productId: string,
  page: number,
  setReviews: (reviews: Review[]) => void,
  setPage: (page: number) => void,
  setPages: (pages: number) => void,
  setState: (state: FetchState) => void,
) {
  setState('loading');
  try {
    const res = await getReviews(productId, page);
    setReviews(res.reviews);
    setPage(res.page);
    setPages(res.pages);
    setState('ready');
  } catch {
    setState('error');
  }
}

async function fetchQuestions(
  productId: string,
  setQuestions: (questions: ProductQuestion[]) => void,
  setState: (state: FetchState) => void,
) {
  setState('loading');
  try {
    const res = await getQuestions(productId);
    setQuestions(res.questions);
    setState('ready');
  } catch {
    setState('error');
  }
}

async function fetchEligibility(
  productId: string,
  setEligibility: (eligibility: ReviewEligibility | null) => void,
) {
  try {
    const data = await getReviewEligibility(productId);
    setEligibility(data);
  } catch {
    setEligibility(null);
  }
}

function syncEligibility(
  data: ProductDetailResponse | null,
  user: User | null,
  setEligibility: (eligibility: ReviewEligibility | null) => void,
) {
  if (!data || !user) {
    setEligibility(null);
    return;
  }
  fetchEligibility(data.product._id, setEligibility);
}

/**
 * Image gallery, variant selection, reviews, Q&A, related + recently-viewed
 * rails (02-REACT-NATIVE-PROMPTS.md Prompt 4). Add-to-Cart and the wishlist
 * toggle are stubs here — real wiring lands in Prompt 5.
 */
export function ProductDetailScreen() {
  const route = useRoute<RouteProp<HomeStackParamList, 'ProductDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const rootNavigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { isWishlisted, toggleItem } = useWishlist();
  const { productSlug } = route.params;

  const [data, setData] = useState<ProductDetailResponse | null>(null);
  const [loadState, setLoadState] = useState<FetchState>('loading');

  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>('description');
  const [addingToCart, setAddingToCart] = useState(false);
  const [addToCartError, setAddToCartError] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsPages, setReviewsPages] = useState(1);
  const [reviewsState, setReviewsState] = useState<FetchState>('loading');

  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [questionsState, setQuestionsState] = useState<FetchState>('loading');

  useEffect(() => {
    fetchProduct(
      productSlug,
      setData,
      setLoadState,
      setSelectedSize,
      setSelectedColor,
      setQuantity,
      setGalleryIndex,
    );
  }, [productSlug]);

  useEffect(() => {
    if (!data) return;
    fetchReviews(data.product._id, 1, setReviews, setReviewsPage, setReviewsPages, setReviewsState);
    fetchQuestions(data.product._id, setQuestions, setQuestionsState);
  }, [data]);

  useEffect(() => {
    syncEligibility(data, user, setEligibility);
  }, [data, user]);

  const variants = useMemo(() => data?.variants ?? [], [data]);

  const resolvedVariant = useMemo(
    () => variants.find((v) => v.size === selectedSize && v.color === selectedColor) ?? null,
    [variants, selectedSize, selectedColor],
  );

  const variantBasePrice = resolvedVariant?.price ?? data?.product.basePrice ?? 0;
  const resolvedPrice = useMemo(
    () =>
      data
        ? getDiscountedPrice(
            variantBasePrice,
            data.product.discountType,
            data.product.discountValue,
          )
        : 0,
    [data, variantBasePrice],
  );

  const galleryImages = useMemo(() => {
    const base = data?.product.images.map((img) => img.url) ?? [];
    if (resolvedVariant?.imageUrl && !base.includes(resolvedVariant.imageUrl)) {
      return [resolvedVariant.imageUrl, ...base];
    }
    return base;
  }, [data, resolvedVariant]);

  const handleRetryProduct = useCallback(() => {
    fetchProduct(
      productSlug,
      setData,
      setLoadState,
      setSelectedSize,
      setSelectedColor,
      setQuantity,
      setGalleryIndex,
    );
  }, [productSlug]);

  const handleReviewsPageChange = useCallback(
    (page: number) => {
      if (!data) return;
      fetchReviews(
        data.product._id,
        page,
        setReviews,
        setReviewsPage,
        setReviewsPages,
        setReviewsState,
      );
    },
    [data],
  );

  const retryQuestions = useCallback(() => {
    if (!data) return;
    fetchQuestions(data.product._id, setQuestions, setQuestionsState);
  }, [data]);

  const handleSubmitReview = useCallback(
    async (input: { rating: number; comment?: string }) => {
      if (!data) return;
      await submitReview(data.product._id, input);
      await fetchEligibility(data.product._id, setEligibility);
      fetchReviews(
        data.product._id,
        1,
        setReviews,
        setReviewsPage,
        setReviewsPages,
        setReviewsState,
      );
    },
    [data],
  );

  const handleSubmitQuestion = useCallback(
    async (question: string) => {
      if (!data) return;
      await submitQuestion(data.product._id, question);
      fetchQuestions(data.product._id, setQuestions, setQuestionsState);
    },
    [data],
  );

  const handleAddToCart = useCallback(async () => {
    if (!resolvedVariant || !data) return;
    const product = data.product;
    setAddToCartError(null);
    setAddingToCart(true);
    try {
      await addItem(
        {
          _id: resolvedVariant._id,
          productId: {
            _id: product._id,
            name: product.name,
            slug: product.slug,
            basePrice: product.basePrice,
            discountType: product.discountType,
            discountValue: product.discountValue,
            images: product.images,
          },
          size: resolvedVariant.size,
          color: resolvedVariant.color,
          sku: resolvedVariant.sku,
          price: resolvedVariant.price,
          stockQuantity: resolvedVariant.stockQuantity,
          imageUrl: resolvedVariant.imageUrl,
          isDefault: resolvedVariant.isDefault,
        },
        quantity,
      );
      Alert.alert('Added to cart', `${product.name} has been added to your cart.`);
    } catch (err) {
      setAddToCartError(getErrorMessage(err));
    } finally {
      setAddingToCart(false);
    }
  }, [resolvedVariant, data, quantity, addItem]);

  const handleNotifyMe = useCallback(async () => {
    if (!user) {
      rootNavigation.navigate('AuthModal', { screen: 'Login' });
      return;
    }
    if (!resolvedVariant) return;
    try {
      await createStockAlert(resolvedVariant._id);
      Alert.alert('Done', "We'll email you when this is back in stock.");
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    }
  }, [user, resolvedVariant, rootNavigation]);

  const handlePressRelated = useCallback(
    (slug: string) => navigation.push('ProductDetail', { productSlug: slug }),
    [navigation],
  );

  if (loadState === 'loading') {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color={colors.brand600} size="large" />
      </View>
    );
  }

  if (loadState === 'error' || !data) {
    return (
      <View style={styles.centerState}>
        <EmptyState
          icon="alert-circle-outline"
          title="Couldn't load this product"
          message="Check your connection and try again."
          actionLabel="Retry"
          onAction={handleRetryProduct}
        />
      </View>
    );
  }

  const { product, relatedProducts } = data;
  const hasDiscount = resolvedPrice < variantBasePrice;

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <View style={styles.galleryContainer}>
        <FlatList
          data={galleryImages}
          keyExtractor={(url, i) => `${url}-${i}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const next = Math.round(
              e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width,
            );
            setGalleryIndex(next);
          }}
          renderItem={({ item }) => (
            <Image
              source={{ uri: cloudinaryUrl(resolveAssetUrl(item), SCREEN_WIDTH) }}
              style={styles.galleryImage}
              contentFit="cover"
            />
          )}
          ListEmptyComponent={<View style={[styles.galleryImage, styles.galleryPlaceholder]} />}
        />
        {galleryImages.length > 1 ? (
          <View style={styles.dots}>
            {galleryImages.map((_, i) => (
              <View key={i} style={[styles.dot, i === galleryIndex && styles.dotActive]} />
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.infoSection}>
        <View style={styles.nameRow}>
          <Text style={[typography.h1, styles.name]}>{product.name}</Text>
          <WishlistButton active={isWishlisted(product._id)} onPress={() => toggleItem(product)} size={26} />
        </View>

        <View style={styles.priceRow}>
          <Text style={typography.priceDetail}>Rs. {resolvedPrice.toLocaleString()}</Text>
          {hasDiscount ? (
            <Text style={styles.strikePrice}>Rs. {variantBasePrice.toLocaleString()}</Text>
          ) : null}
        </View>

        {product.reviewCount > 0 ? (
          <View style={styles.ratingRow}>
            <StarRating rating={product.averageRating ?? 0} size={14} />
            <Text style={typography.muted}>({product.reviewCount})</Text>
          </View>
        ) : null}

        <VariantPicker
          variants={variants}
          selectedSize={selectedSize}
          selectedColor={selectedColor}
          onSelectSize={setSelectedSize}
          onSelectColor={setSelectedColor}
        />

        {resolvedVariant ? (
          resolvedVariant.stockQuantity > 0 ? (
            <>
              <Text style={typography.muted}>{resolvedVariant.stockQuantity} in stock</Text>
              <View style={styles.quantityRow}>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <Ionicons name="remove" size={18} color={colors.gray700} />
                </Pressable>
                <Text style={styles.quantityText}>{quantity}</Text>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => setQuantity((q) => Math.min(resolvedVariant.stockQuantity, q + 1))}
                  disabled={quantity >= resolvedVariant.stockQuantity}
                >
                  <Ionicons name="add" size={18} color={colors.gray700} />
                </Pressable>
              </View>
              {addToCartError ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{addToCartError}</Text>
                </View>
              ) : null}
              <Pressable
                style={[styles.addToCartBtn, addingToCart && styles.addToCartBtnDisabled]}
                onPress={handleAddToCart}
                disabled={addingToCart}
              >
                {addingToCart ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.addToCartText}>Add to Cart</Text>
                )}
              </Pressable>
            </>
          ) : (
            <Pressable style={styles.notifyBtn} onPress={handleNotifyMe}>
              <Text style={styles.notifyText}>Notify Me When Available</Text>
            </Pressable>
          )
        ) : (
          <Text style={typography.muted}>Select options to see stock and price.</Text>
        )}
      </View>

      <View style={styles.tabBar}>
        {(['description', 'info', 'shipping'] as const).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'description'
                ? 'Description'
                : tab === 'info'
                  ? 'Additional Info'
                  : 'Shipping'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.section}>
        {activeTab === 'description' ? (
          <Text style={typography.body}>
            {stripHtml(product.description || product.shortDescription || '')}
          </Text>
        ) : activeTab === 'info' ? (
          product.additionalInformation && product.additionalInformation.length > 0 ? (
            product.additionalInformation.map((row, i) => (
              <View key={i} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
            ))
          ) : (
            <Text style={typography.muted}>No additional information.</Text>
          )
        ) : (
          <View style={styles.shippingInfo}>
            {product.weight ? (
              <Text style={typography.body}>Weight: {product.weight} kg</Text>
            ) : null}
            <Text style={typography.body}>
              Delivery fee is calculated at checkout based on your address. Cash on Delivery,
              Khalti, and eSewa are supported.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={typography.h2}>
          Reviews{product.reviewCount > 0 ? ` (${product.reviewCount})` : ''}
        </Text>
        {reviewsState === 'error' ? (
          <EmptyState
            icon="alert-circle-outline"
            title="Couldn't load reviews"
            actionLabel="Retry"
            onAction={() => handleReviewsPageChange(reviewsPage)}
          />
        ) : reviewsState === 'loading' ? (
          <ActivityIndicator color={colors.brand600} />
        ) : (
          <ReviewList
            reviews={reviews}
            page={reviewsPage}
            pages={reviewsPages}
            onPageChange={handleReviewsPageChange}
          />
        )}

        {user ? (
          eligibility?.hasPurchased ? (
            <ReviewForm
              existingReview={eligibility.alreadyReviewed ? eligibility.existingReview : null}
              onSubmit={handleSubmitReview}
            />
          ) : (
            <Text style={typography.muted}>Purchase this product to leave a review.</Text>
          )
        ) : (
          <Text style={typography.muted}>Log in and purchase this product to leave a review.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={typography.h2}>Questions & Answers</Text>
        {questionsState === 'error' ? (
          <EmptyState
            icon="alert-circle-outline"
            title="Couldn't load questions"
            actionLabel="Retry"
            onAction={retryQuestions}
          />
        ) : questionsState === 'loading' ? (
          <ActivityIndicator color={colors.brand600} />
        ) : (
          <QuestionList questions={questions} />
        )}
        <QuestionForm onSubmit={handleSubmitQuestion} />
      </View>

      {relatedProducts.length > 0 ? (
        <ProductRail
          title="Related Products"
          products={relatedProducts}
          onPressProduct={handlePressRelated}
        />
      ) : null}

      <RecentlyViewedRail excludeSlug={productSlug} onPressProduct={handlePressRelated} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  content: { paddingBottom: spacing.xxl, gap: spacing.lg },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  galleryContainer: { width: SCREEN_WIDTH },
  galleryImage: { width: SCREEN_WIDTH, height: SCREEN_WIDTH, backgroundColor: colors.gray100 },
  galleryPlaceholder: { backgroundColor: colors.gray100 },
  dots: {
    position: 'absolute',
    bottom: spacing.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    opacity: 0.5,
  },
  dotActive: { opacity: 1 },
  infoSection: { paddingHorizontal: spacing.lg, gap: spacing.md },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  name: { flex: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  strikePrice: { fontSize: 16, color: colors.gray500, textDecorationLine: 'line-through' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: { fontSize: 16, fontWeight: '600', color: colors.gray900 },
  addToCartBtn: {
    backgroundColor: colors.brand600,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  addToCartBtnDisabled: { opacity: 0.7 },
  addToCartText: { color: colors.white, fontWeight: '600' },
  errorBanner: { backgroundColor: colors.danger50, borderRadius: 8, padding: spacing.md },
  errorBannerText: { color: colors.danger700, fontSize: 13 },
  notifyBtn: {
    backgroundColor: colors.gray900,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  notifyText: { color: colors.white, fontWeight: '600' },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  tabBtn: { paddingVertical: spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: colors.brand600 },
  tabText: { fontSize: 13, color: colors.gray500, fontWeight: '500' },
  tabTextActive: { color: colors.brand600 },
  section: { paddingHorizontal: spacing.lg, gap: spacing.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  infoLabel: { fontSize: 13, color: colors.gray500 },
  infoValue: { fontSize: 13, color: colors.gray900, fontWeight: '500' },
  shippingInfo: { gap: spacing.xs },
});
