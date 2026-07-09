import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { HomeStackParamList } from '@/navigation/types';
import { useCategories } from '@/hooks/useCategories';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { getBanners } from '@/api/banners';
import { getFeatureTypes, FeatureType } from '@/api/featureTypes';
import { getProductsByFeatureType } from '@/api/products';
import { Banner } from '@/types/banner';
import { ProductSummary } from '@/types/product';
import { BannerCarousel } from '@/components/BannerCarousel';
import { CategoryTile } from '@/components/CategoryTile';
import { ProductRail } from '@/components/ProductRail';
import { RecentlyViewedRail } from '@/components/RecentlyViewedRail';
import { SearchBar } from '@/components/SearchBar';
import { colors, spacing, typography } from '@/theme';

const MAX_RAILS = 4;
const RAIL_LIMIT = 8;
const CATEGORY_COLUMNS = 4;

type FetchState = 'loading' | 'ready' | 'error';

interface FeatureRail {
  featureType: FeatureType;
  products: ProductSummary[];
  state: FetchState;
}

async function fetchBanners(
  setBanners: (banners: Banner[]) => void,
  setState: (state: FetchState) => void,
) {
  setState('loading');
  try {
    const data = await getBanners();
    setBanners(data);
    setState('ready');
  } catch {
    setState('error');
  }
}

function fetchRailProducts(
  index: number,
  featureType: FeatureType,
  setRails: Dispatch<SetStateAction<FeatureRail[]>>,
) {
  setRails((prev) => prev.map((rail, i) => (i === index ? { ...rail, state: 'loading' } : rail)));
  getProductsByFeatureType(featureType.slug, RAIL_LIMIT)
    .then((products) => {
      setRails((prev) =>
        prev.map((rail, i) => (i === index ? { ...rail, products, state: 'ready' } : rail)),
      );
    })
    .catch(() => {
      setRails((prev) => prev.map((rail, i) => (i === index ? { ...rail, state: 'error' } : rail)));
    });
}

async function fetchRails(setRails: Dispatch<SetStateAction<FeatureRail[]>>) {
  try {
    const featureTypes = await getFeatureTypes();
    const active = featureTypes.filter((ft) => ft.isActive).slice(0, MAX_RAILS);
    setRails(active.map((featureType) => ({ featureType, products: [], state: 'loading' })));
    active.forEach((featureType, index) => fetchRailProducts(index, featureType, setRails));
  } catch {
    setRails([]);
  }
}

/**
 * Home tab: banner carousel, category grid, up to `MAX_RAILS` feature-type
 * product rails, and a recently-viewed rail. Each data source (banners,
 * categories, each rail) fetches and fails independently, so one bad section
 * never blanks the rest of the page (02-REACT-NATIVE-PROMPTS.md Prompt 3/4).
 */
export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    refresh: refreshCategories,
  } = useCategories();
  const { company } = useCompanySettings();

  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannersState, setBannersState] = useState<FetchState>('loading');
  const [rails, setRails] = useState<FeatureRail[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadBanners = useCallback(() => fetchBanners(setBanners, setBannersState), []);
  const loadRails = useCallback(() => fetchRails(setRails), []);
  const retryRail = useCallback(
    (index: number, featureType: FeatureType) => fetchRailProducts(index, featureType, setRails),
    [],
  );

  useEffect(() => {
    fetchBanners(setBanners, setBannersState);
    fetchRails(setRails);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadBanners(), refreshCategories(), loadRails()]);
    setRefreshing(false);
  }, [loadBanners, refreshCategories, loadRails]);

  const handleSearch = useCallback(
    (query: string) => navigation.navigate('ProductList', { search: query, title: `"${query}"` }),
    [navigation],
  );

  const handlePressCategory = useCallback(
    (slug: string, title: string) =>
      navigation.navigate('ProductList', { categorySlug: slug, title }),
    [navigation],
  );

  const handlePressProduct = useCallback(
    (slug: string) => navigation.navigate('ProductDetail', { productSlug: slug }),
    [navigation],
  );

  const handleSeeAllRail = useCallback(
    (featureType: FeatureType) =>
      navigation.navigate('ProductList', {
        featureType: featureType.slug,
        title: featureType.name,
      }),
    [navigation],
  );

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View style={styles.brandRow}>
        {company.logoUrl ? (
          <Image source={{ uri: company.logoUrl }} style={styles.logo} contentFit="contain" />
        ) : null}
        <Text style={typography.h1}>{company.companyName ?? 'Store'}</Text>
      </View>

      <SearchBar onSubmit={handleSearch} />

      {bannersState === 'error' ? (
        <InlineRetry message="Couldn't load banners" onRetry={loadBanners} />
      ) : (
        <BannerCarousel banners={banners} />
      )}

      <View style={styles.section}>
        <Text style={[typography.h2, styles.sectionTitle]}>Shop by Category</Text>
        {categoriesError ? (
          <InlineRetry message={categoriesError} onRetry={refreshCategories} />
        ) : categories.length > 0 ? (
          <FlatList
            data={categories}
            keyExtractor={(item) => item._id}
            numColumns={CATEGORY_COLUMNS}
            scrollEnabled={false}
            contentContainerStyle={styles.categoryGrid}
            renderItem={({ item }) => (
              <CategoryTile
                category={item}
                onPress={() => handlePressCategory(item.slug, item.name)}
              />
            )}
          />
        ) : !categoriesLoading ? (
          <Text style={[typography.muted, styles.sectionTitle]}>No categories yet.</Text>
        ) : null}
      </View>

      {rails.map((rail, index) =>
        rail.state === 'error' ? (
          <View key={rail.featureType._id} style={styles.section}>
            <InlineRetry
              message={`Couldn't load "${rail.featureType.name}"`}
              onRetry={() => retryRail(index, rail.featureType)}
            />
          </View>
        ) : (
          <ProductRail
            key={rail.featureType._id}
            title={rail.featureType.name}
            products={rail.products}
            onPressProduct={handlePressProduct}
            onSeeAll={() => handleSeeAllRail(rail.featureType)}
          />
        ),
      )}

      <RecentlyViewedRail onPressProduct={handlePressProduct} />
    </ScrollView>
  );
}

function InlineRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.retryRow}>
      <Text style={typography.muted}>{message}</Text>
      <Pressable onPress={onRetry} hitSlop={8}>
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  content: { paddingBottom: spacing.xxl, gap: spacing.lg },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  logo: { width: 28, height: 28 },
  section: { gap: spacing.sm },
  sectionTitle: { paddingHorizontal: spacing.lg },
  categoryGrid: { paddingHorizontal: spacing.md },
  retryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.gray50,
  },
  retryText: { color: colors.brand600, fontWeight: '600', fontSize: 13 },
});
