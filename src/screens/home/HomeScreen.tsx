import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigationProp, useIsFocused, useNavigation } from '@react-navigation/native';
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeStackParamList, MainTabParamList } from '@/navigation/types';
import { useCategories } from '@/hooks/useCategories';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useThemeSettings } from '@/hooks/useThemeSettings';
import { getBanners } from '@/api/banners';
import { getHomeCampaigns } from '@/api/campaigns';
import { getFeatureTypes, FeatureType } from '@/api/featureTypes';
import { getProducts, getProductsByFeatureType } from '@/api/products';
import { getPromotions } from '@/api/promotions';
import { Banner } from '@/types/banner';
import { Campaign } from '@/types/campaign';
import { Promotion } from '@/types/promotion';
import { ProductSummary } from '@/types/product';
import { BannerCarousel, BANNER_HEIGHT } from '@/components/BannerCarousel';
import { CategoryTile } from '@/components/CategoryTile';
import { ProductCard } from '@/components/ProductCard';
import { RecentlyViewedRail } from '@/components/RecentlyViewedRail';
import { TrustBadges } from '@/components/TrustBadges';
import { CampaignSection } from '@/components/home/CampaignSection';
import { FeatureSection } from '@/components/home/FeatureSection';
import { HomeFooter } from '@/components/home/HomeFooter';
import { HomeHeader } from '@/components/home/HomeHeader';
import { PromoBanner } from '@/components/home/PromoBanner';
import { CapsuleRowSkeleton, GridSkeleton, SectionSkeleton } from '@/components/home/HomeSkeletons';
import { colors, spacing } from '@/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const RAIL_LIMIT = 10;
const FOR_YOU_LIMIT = 10;
const GRID_CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;
/** Scroll offset past which the floating header pins as a solid white bar. */
const PIN_THRESHOLD = BANNER_HEIGHT - 100;

type FetchState = 'loading' | 'ready' | 'error';

interface SectionData<T> {
  data: T[];
  state: FetchState;
}

interface FeatureRail {
  featureType: FeatureType;
  products: ProductSummary[];
  state: FetchState;
}

/** Heterogeneous rows of the one vertical FlatList (docs/PROMPT-home-screen.md §Screen Layout). */
type Section =
  | { type: 'hero'; key: 'hero' }
  | { type: 'categories'; key: 'categories' }
  | { type: 'trust'; key: 'trust' }
  | { type: 'campaign'; key: string; campaign: Campaign }
  | { type: 'feature'; key: string; rail: FeatureRail }
  | { type: 'promo'; key: string; promotion: Promotion }
  | { type: 'sectionSkeleton'; key: string }
  | { type: 'forYou'; key: 'forYou' }
  | { type: 'recent'; key: 'recent' }
  | { type: 'footer'; key: 'footer' };

/**
 * §8's interleave rule: after the first campaign → feature → promotion cycle,
 * keep alternating in that priority until all three queues are empty — every
 * campaign, non-empty feature rail, and promotion appears exactly once.
 */
function interleaveSections(
  campaigns: Campaign[],
  rails: FeatureRail[],
  promotions: Promotion[],
): Section[] {
  const out: Section[] = [];
  const rounds = Math.max(campaigns.length, rails.length, promotions.length);
  for (let i = 0; i < rounds; i++) {
    if (i < campaigns.length)
      out.push({ type: 'campaign', key: `campaign-${campaigns[i]._id}`, campaign: campaigns[i] });
    if (i < rails.length)
      out.push({ type: 'feature', key: `feature-${rails[i].featureType._id}`, rail: rails[i] });
    if (i < promotions.length)
      out.push({ type: 'promo', key: `promo-${promotions[i]._id}`, promotion: promotions[i] });
  }
  return out;
}

function chunkPairs<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return rows;
}

/**
 * Home tab (docs/PROMPT-home-screen.md): edge-to-edge hero carousel behind a
 * translucent status bar with a floating header, category capsules, trust
 * strip, then campaign/feature/promotion sections interleaved per §8, a
 * "For You" grid, and an informational footer. All requests fire in parallel
 * on mount; each section loads, renders, and fails independently — a failed
 * or empty section disappears silently instead of blocking the screen.
 */
export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const tabNavigation = useNavigation<NavigationProp<MainTabParamList>>();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { categories, loading: categoriesLoading, refresh: refreshCategories } = useCategories();
  const { refresh: refreshCompany } = useCompanySettings();
  const { refresh: refreshTheme } = useThemeSettings();

  const [banners, setBanners] = useState<SectionData<Banner>>({ data: [], state: 'loading' });
  const [campaigns, setCampaigns] = useState<SectionData<Campaign>>({ data: [], state: 'loading' });
  const [expiredCampaignIds, setExpiredCampaignIds] = useState<string[]>([]);
  const [rails, setRails] = useState<FeatureRail[]>([]);
  const [railsState, setRailsState] = useState<FetchState>('loading');
  const [promotions, setPromotions] = useState<SectionData<Promotion>>({ data: [], state: 'loading' });
  const [forYou, setForYou] = useState<SectionData<ProductSummary>>({ data: [], state: 'loading' });
  const [refreshing, setRefreshing] = useState(false);
  const [pinned, setPinned] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => setPinned(value > PIN_THRESHOLD));
    return () => scrollY.removeListener(id);
  }, [scrollY]);

  const loadBanners = useCallback(async () => {
    try {
      setBanners({ data: await getBanners(), state: 'ready' });
    } catch {
      setBanners({ data: [], state: 'error' });
    }
  }, []);

  const loadCampaigns = useCallback(async () => {
    try {
      const data = await getHomeCampaigns();
      setExpiredCampaignIds([]);
      setCampaigns({ data, state: 'ready' });
    } catch {
      setCampaigns({ data: [], state: 'error' });
    }
  }, []);

  // Feature types first, then every rail's products in parallel; a rail that
  // errors or comes back empty is skipped entirely — never an empty rail (§6).
  const loadRails = useCallback(async () => {
    try {
      const featureTypes = await getFeatureTypes();
      const active = featureTypes.filter((ft) => ft.isActive);
      const results = await Promise.all(
        active.map(async (featureType): Promise<FeatureRail> => {
          try {
            const products = await getProductsByFeatureType(featureType.slug, RAIL_LIMIT);
            return { featureType, products: products ?? [], state: 'ready' };
          } catch {
            return { featureType, products: [], state: 'error' };
          }
        }),
      );
      setRails(results);
      setRailsState('ready');
    } catch {
      setRails([]);
      setRailsState('error');
    }
  }, []);

  const loadPromotions = useCallback(async () => {
    try {
      setPromotions({ data: await getPromotions(), state: 'ready' });
    } catch {
      setPromotions({ data: [], state: 'error' });
    }
  }, []);

  const loadForYou = useCallback(async () => {
    try {
      const res = await getProducts({ limit: FOR_YOU_LIMIT, sort: 'newest' });
      setForYou({ data: res.products ?? [], state: 'ready' });
    } catch {
      setForYou({ data: [], state: 'error' });
    }
  }, []);

  useEffect(() => {
    loadBanners();
    loadCampaigns();
    loadRails();
    loadPromotions();
    loadForYou();
  }, [loadBanners, loadCampaigns, loadRails, loadPromotions, loadForYou]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadBanners(),
      loadCampaigns(),
      loadRails(),
      loadPromotions(),
      loadForYou(),
      refreshCategories(),
      refreshCompany(),
      refreshTheme(),
    ]);
    setRefreshing(false);
  }, [loadBanners, loadCampaigns, loadRails, loadPromotions, loadForYou, refreshCategories, refreshCompany, refreshTheme]);

  const handleCampaignExpire = useCallback((campaignId: string) => {
    setExpiredCampaignIds((prev) => (prev.includes(campaignId) ? prev : [...prev, campaignId]));
  }, []);

  const handlePressProduct = useCallback(
    (slug: string) => navigation.navigate('ProductDetail', { productSlug: slug }),
    [navigation],
  );
  const handlePressSearch = useCallback(
    () => navigation.navigate('ProductList', { focusSearch: true, title: 'Search' }),
    [navigation],
  );
  const handlePressNotifications = useCallback(
    () => navigation.navigate('Notifications'),
    [navigation],
  );
  const handlePressCategory = useCallback(
    (slug: string, title: string) => navigation.navigate('ProductList', { categorySlug: slug, title }),
    [navigation],
  );
  const handleCampaignViewAll = useCallback(
    (campaign: Campaign) => navigation.navigate('Campaign', { slug: campaign.slug }),
    [navigation],
  );
  const handleFeatureViewAll = useCallback(
    (featureType: FeatureType) =>
      navigation.navigate('ProductList', { featureType: featureType.slug, title: featureType.name }),
    [navigation],
  );
  const handleViewAllProducts = useCallback(
    () => navigation.navigate('ProductList', { title: 'All Products' }),
    [navigation],
  );
  const handlePressTerms = useCallback(
    () => tabNavigation.navigate('AccountTab', { screen: 'Terms' }),
    [tabNavigation],
  );

  const sections = useMemo<Section[]>(() => {
    const list: Section[] = [
      { type: 'hero', key: 'hero' },
      { type: 'categories', key: 'categories' },
      { type: 'trust', key: 'trust' },
    ];

    const liveCampaigns = campaigns.data.filter((c) => !expiredCampaignIds.includes(c._id));
    const readyRails = rails.filter((rail) => rail.state === 'ready' && rail.products.length > 0);
    const livePromotions = promotions.data.filter((p) => p.mobileBannerUrl || p.webBannerUrl);

    list.push(...interleaveSections(liveCampaigns, readyRails, livePromotions));

    if (campaigns.state === 'loading') {
      list.push({ type: 'sectionSkeleton', key: 'campaigns-skeleton' });
    }
    if (railsState === 'loading') {
      list.push({ type: 'sectionSkeleton', key: 'rails-skeleton' });
    }

    list.push({ type: 'forYou', key: 'forYou' }, { type: 'recent', key: 'recent' }, { type: 'footer', key: 'footer' });
    return list;
  }, [campaigns, expiredCampaignIds, rails, railsState, promotions]);

  const renderSection = useCallback(
    ({ item }: { item: Section }) => {
      switch (item.type) {
        case 'hero':
          return <BannerCarousel banners={banners.data} loading={banners.state === 'loading'} />;

        case 'categories':
          if (categoriesLoading && categories.length === 0) {
            return (
              <View style={styles.categoriesGap}>
                <CapsuleRowSkeleton />
              </View>
            );
          }
          if (categories.length === 0) return null;
          return (
            <View style={styles.categoriesGap}>
              <FlatList
                data={categories}
                keyExtractor={(category) => category.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryRow}
                renderItem={({ item: category }) => (
                  <CategoryTile
                    category={category}
                    onPress={() => handlePressCategory(category.slug, category.name)}
                  />
                )}
              />
            </View>
          );

        case 'trust':
          return (
            <View style={styles.sectionGap}>
              <TrustBadges />
            </View>
          );

        case 'campaign':
          return (
            <View style={styles.sectionGap}>
              <CampaignSection
                campaign={item.campaign}
                onPressProduct={handlePressProduct}
                onPressViewAll={handleCampaignViewAll}
                onExpire={handleCampaignExpire}
              />
            </View>
          );

        case 'feature':
          return (
            <View style={styles.sectionGap}>
              <FeatureSection
                title={item.rail.featureType.name}
                products={item.rail.products}
                onPressProduct={handlePressProduct}
                onPressViewAll={() => handleFeatureViewAll(item.rail.featureType)}
              />
            </View>
          );

        case 'promo':
          return (
            <View style={styles.sectionGap}>
              <PromoBanner promotion={item.promotion} />
            </View>
          );

        case 'sectionSkeleton':
          return (
            <View style={styles.sectionGap}>
              <SectionSkeleton />
            </View>
          );

        case 'forYou':
          if (forYou.state === 'loading') {
            return (
              <View style={styles.sectionGap}>
                <Text style={styles.forYouTitle}>For You</Text>
                <View style={styles.forYouGap} />
                <GridSkeleton cardWidth={GRID_CARD_WIDTH} />
              </View>
            );
          }
          if (forYou.data.length === 0) return null;
          return (
            <View style={styles.sectionGap}>
              <Text style={styles.forYouTitle}>For You</Text>
              <View style={styles.grid}>
                {chunkPairs(forYou.data).map((row) => (
                  <View key={row[0]._id} style={styles.gridRow}>
                    {row.map((product) => (
                      <ProductCard
                        key={product._id}
                        product={product}
                        width={GRID_CARD_WIDTH}
                        onPress={() => handlePressProduct(product.slug)}
                      />
                    ))}
                  </View>
                ))}
              </View>
              <Pressable style={styles.viewAllBtn} onPress={handleViewAllProducts}>
                <Text style={styles.viewAllBtnText}>View All Products</Text>
              </Pressable>
            </View>
          );

        case 'recent':
          return (
            <View style={styles.sectionGap}>
              <RecentlyViewedRail onPressProduct={handlePressProduct} />
            </View>
          );

        case 'footer':
          return (
            <View style={styles.footerGap}>
              <HomeFooter onPressTerms={handlePressTerms} />
            </View>
          );

        default:
          return null;
      }
    },
    [
      banners,
      categories,
      categoriesLoading,
      forYou,
      handleCampaignExpire,
      handleCampaignViewAll,
      handleFeatureViewAll,
      handlePressCategory,
      handlePressProduct,
      handlePressTerms,
      handleViewAllProducts,
    ],
  );

  return (
    <View style={styles.flex}>
      {isFocused ? (
        <StatusBar style={pinned ? 'dark' : 'light'} translucent backgroundColor="transparent" />
      ) : null}

      <Animated.FlatList
        data={sections}
        keyExtractor={(section) => section.key}
        renderItem={renderSection}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            progressViewOffset={insets.top + 44}
          />
        }
      />

      <HomeHeader
        scrollY={scrollY}
        pinned={pinned}
        onPressSearch={handlePressSearch}
        onPressNotifications={handlePressNotifications}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.gray50 },
  categoriesGap: { marginTop: spacing.md },
  sectionGap: { marginTop: spacing.xl },
  footerGap: { marginTop: spacing.xxl },
  categoryRow: { paddingHorizontal: spacing.lg, gap: spacing.sm + 2 },
  forYouTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.gray900,
    paddingHorizontal: spacing.lg,
  },
  forYouGap: { height: spacing.md },
  grid: { gap: spacing.md, paddingHorizontal: spacing.lg, marginTop: spacing.md },
  gridRow: { flexDirection: 'row', gap: spacing.md },
  viewAllBtn: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  viewAllBtnText: { fontSize: 14, fontWeight: '700', color: colors.gray900 },
});
