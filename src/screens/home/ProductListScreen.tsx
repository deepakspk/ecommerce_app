import { useCallback, useEffect, useMemo, useState } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList } from '@/navigation/types';
import { useCategories } from '@/hooks/useCategories';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  AvailableFilters,
  getAvailableFilters,
  getProducts,
  ProductListParams,
  SortOption,
} from '@/api/products';
import { Category } from '@/types/category';
import { ProductSummary } from '@/types/product';
import { ProductCard } from '@/components/ProductCard';
import { FilterPill } from '@/components/FilterPill';
import { FilterSheet, FilterValue } from '@/components/FilterSheet';
import { SortSheet } from '@/components/SortSheet';
import { EmptyState, LoadingSkeleton } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

const PAGE_SIZE = 20;
const COLUMNS = 2;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / COLUMNS;

type FetchState = 'loading' | 'ready' | 'error';

interface SelectedCategoryNode {
  root: Category;
  sub?: Category;
}

function ProductCardSkeleton({ width }: { width: number }) {
  return (
    <View style={{ width, gap: spacing.xs }}>
      <LoadingSkeleton width={width} height={width} style={{ borderRadius: 12 }} />
      <LoadingSkeleton width="80%" height={14} />
      <LoadingSkeleton width="40%" height={14} />
    </View>
  );
}

function findCategoryNode(categories: Category[], slug: string): SelectedCategoryNode | null {
  for (const root of categories) {
    if (root.slug === slug) return { root };
    const sub = root.children?.find((s) => s.slug === slug);
    if (sub) return { root, sub };
  }
  return null;
}

async function fetchFirstPage(
  params: ProductListParams,
  setProducts: (products: ProductSummary[]) => void,
  setPage: (page: number) => void,
  setPages: (pages: number) => void,
  setState: (state: FetchState) => void,
) {
  setState('loading');
  try {
    const res = await getProducts({ ...params, page: 1 });
    setProducts(res.products);
    setPage(res.page);
    setPages(res.pages);
    setState('ready');
  } catch {
    setState('error');
  }
}

/**
 * Reused by both `HomeStack` and `CategoriesTab` (02-REACT-NATIVE-PROMPTS.md
 * Prompt 4) — accepts optional initial filters via route params so a category
 * tile tap, a rail's "See All", or a search submission all land here
 * pre-filtered. Prefers infinite scroll over numbered pagination, per spec.
 */
export function ProductListScreen() {
  const route = useRoute<RouteProp<HomeStackParamList, 'ProductList'>>();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { categories } = useCategories();

  const initialParams = route.params;

  const [searchText, setSearchText] = useState(initialParams?.search ?? '');
  const [searchVisible, setSearchVisible] = useState(!!initialParams?.search);
  const debouncedSearch = useDebouncedValue(searchText, 400);

  const [categorySlug, setCategorySlug] = useState(initialParams?.categorySlug);
  const [featureType] = useState(initialParams?.featureType);
  const [size, setSize] = useState<string | undefined>();
  const [color, setColor] = useState<string | undefined>();
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [minRating, setMinRating] = useState<number | undefined>();
  const [sort, setSort] = useState<SortOption>('newest');

  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [availableFilters, setAvailableFilters] = useState<AvailableFilters | null>(null);

  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [state, setState] = useState<FetchState>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    getAvailableFilters()
      .then(setAvailableFilters)
      .catch(() => {});
  }, []);

  const selectedNode = useMemo(
    () => (categorySlug ? findCategoryNode(categories, categorySlug) : null),
    [categories, categorySlug],
  );

  const queryParams: ProductListParams = useMemo(
    () => ({
      limit: PAGE_SIZE,
      category: categorySlug,
      featureType,
      search: debouncedSearch.trim() || undefined,
      size,
      color,
      minPrice,
      maxPrice,
      minRating,
      sort,
    }),
    [categorySlug, featureType, debouncedSearch, size, color, minPrice, maxPrice, minRating, sort],
  );

  useEffect(() => {
    fetchFirstPage(queryParams, setProducts, setPage, setPages, setState);
  }, [queryParams]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFirstPage(queryParams, setProducts, setPage, setPages, setState).finally(() =>
      setRefreshing(false),
    );
  }, [queryParams]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || state !== 'ready' || page >= pages) return;
    setLoadingMore(true);
    getProducts({ ...queryParams, page: page + 1 })
      .then((res) => {
        setProducts((prev) => [...prev, ...res.products]);
        setPage(res.page);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }, [loadingMore, state, page, pages, queryParams]);

  const handleSelectRoot = useCallback((root: Category) => {
    setCategorySlug((prev) => (prev === root.slug ? undefined : root.slug));
  }, []);

  const handleSelectSub = useCallback(
    (sub: Category) => {
      setCategorySlug((prev) => (prev === sub.slug ? selectedNode?.root.slug : sub.slug));
    },
    [selectedNode],
  );

  const handlePressProduct = useCallback(
    (slug: string) => navigation.navigate('ProductDetail', { productSlug: slug }),
    [navigation],
  );

  const filterValue: FilterValue = { size, color, minPrice, maxPrice, minRating };
  const activeFilterCount = [size, color, minPrice, maxPrice, minRating].filter(
    (v) => v !== undefined,
  ).length;

  const listHeader = (
    <View style={styles.headerContainer}>
      <View style={styles.titleRow}>
        <Text style={typography.h1} numberOfLines={1}>
          {initialParams?.title ??
            selectedNode?.sub?.name ??
            selectedNode?.root.name ??
            'All Products'}
        </Text>
        <Pressable onPress={() => setSearchVisible((v) => !v)} hitSlop={8}>
          <Ionicons name="search" size={22} color={colors.gray700} />
        </Pressable>
      </View>

      {searchVisible ? (
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search products"
          placeholderTextColor={colors.gray400}
          returnKeyType="search"
          autoFocus
        />
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillRow}
      >
        <FilterPill
          label="All"
          selected={!categorySlug}
          onPress={() => setCategorySlug(undefined)}
        />
        {categories.map((root) => (
          <FilterPill
            key={root.id}
            label={root.name}
            selected={selectedNode?.root.slug === root.slug}
            onPress={() => handleSelectRoot(root)}
          />
        ))}
      </ScrollView>

      {selectedNode?.root.children && selectedNode.root.children.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
        >
          {selectedNode.root.children.map((sub) => (
            <FilterPill
              key={sub.id}
              label={sub.name}
              selected={selectedNode.sub?.slug === sub.slug}
              onPress={() => handleSelectSub(sub)}
            />
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.actionsRow}>
        <Pressable style={styles.actionBtn} onPress={() => setFilterSheetOpen(true)}>
          <Ionicons name="options-outline" size={16} color={colors.gray700} />
          <Text style={styles.actionText}>
            Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={() => setSortSheetOpen(true)}>
          <Ionicons name="swap-vertical-outline" size={16} color={colors.gray700} />
          <Text style={styles.actionText}>Sort</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.flex}>
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        numColumns={COLUMNS}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          state === 'loading' ? (
            <View style={styles.skeletonGrid}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <ProductCardSkeleton key={i} width={CARD_WIDTH} />
              ))}
            </View>
          ) : state === 'error' ? (
            <EmptyState
              icon="alert-circle-outline"
              title="Couldn't load products"
              message="Check your connection and try again."
              actionLabel="Retry"
              onAction={handleRefresh}
            />
          ) : (
            <EmptyState
              icon="search-outline"
              title="No products found"
              message="Try adjusting your filters."
            />
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={styles.loadingIndicator} color={colors.brand600} />
          ) : null
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => handlePressProduct(item.slug)}
            width={CARD_WIDTH}
          />
        )}
      />

      <FilterSheet
        visible={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        availableFilters={availableFilters}
        value={filterValue}
        onApply={(next) => {
          setSize(next.size);
          setColor(next.color);
          setMinPrice(next.minPrice);
          setMaxPrice(next.maxPrice);
          setMinRating(next.minRating);
        }}
      />

      <SortSheet
        visible={sortSheetOpen}
        onClose={() => setSortSheetOpen(false)}
        value={sort}
        onChange={setSort}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  headerContainer: { gap: spacing.md, paddingBottom: spacing.md },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  searchInput: {
    marginHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.gray900,
  },
  pillRow: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  actionsRow: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionText: { fontSize: 13, color: colors.gray700, fontWeight: '500' },
  gridRow: { gap: spacing.md, paddingHorizontal: spacing.lg },
  gridContent: { paddingBottom: spacing.xxl, gap: spacing.md },
  loadingIndicator: { marginVertical: spacing.xxl },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});
