import { useCallback, useEffect, useState } from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeStackParamList } from '@/navigation/types';
import { getHomeCampaigns } from '@/api/campaigns';
import { Campaign } from '@/types/campaign';
import { CountdownTimer } from '@/components/home/CountdownTimer';
import { ProductCardSkeleton } from '@/components/home/HomeSkeletons';
import { ProductCard } from '@/components/ProductCard';
import { EmptyState } from '@/components/ui';
import { useThemeSettings } from '@/hooks/useThemeSettings';
import { cloudinaryUrl } from '@/utils/cloudinary';
import { resolveAssetUrl } from '@/utils/assetUrl';
import { colors, spacing, typography } from '@/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;

type FetchState = 'loading' | 'ready' | 'error';

/**
 * Campaign landing screen — the Home CTA / "+N more deals" destination.
 * `GET /campaigns/home` is the only documented campaign endpoint, so this
 * looks the campaign up by slug from it and shows the products it carries
 * (the first 10). A dedicated paginated campaign-products endpoint can
 * replace this lookup later without touching Home.
 */
export function CampaignScreen() {
  const route = useRoute<RouteProp<HomeStackParamList, 'Campaign'>>();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const insets = useSafeAreaInsets();
  const { colors: brand } = useThemeSettings();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [state, setState] = useState<FetchState>('loading');
  const [expired, setExpired] = useState(false);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const campaigns = await getHomeCampaigns();
      setCampaign(campaigns.find((c) => c.slug === route.params.slug) ?? null);
      setState('ready');
    } catch {
      setState('error');
    }
  }, [route.params.slug]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePressProduct = useCallback(
    (slug: string) => navigation.navigate('ProductDetail', { productSlug: slug }),
    [navigation],
  );

  const themeColor =
    campaign?.themeColor && /^#[0-9a-fA-F]{6}$/.test(campaign.themeColor)
      ? campaign.themeColor
      : brand.brand600;
  const banner = campaign?.mobileBannerUrl || campaign?.desktopBannerUrl;

  const listHeader = campaign ? (
    <View style={styles.headerBlock}>
      {banner ? (
        <Image
          source={{ uri: cloudinaryUrl(resolveAssetUrl(banner), 800) }}
          style={styles.banner}
          contentFit="cover"
        />
      ) : null}
      <Text style={typography.h1}>{campaign.name}</Text>
      {campaign.description ? <Text style={typography.body}>{campaign.description}</Text> : null}
      <View style={styles.countdownRow}>
        <Text style={styles.endsIn}>ENDS IN</Text>
        <CountdownTimer
          endDate={campaign.endDate}
          numberColor={themeColor}
          onExpire={() => setExpired(true)}
        />
      </View>
      <Text style={typography.muted}>{campaign.productCount} deals in this campaign</Text>
    </View>
  ) : null;

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <View style={styles.navRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.gray900} />
        </Pressable>
        <Text style={typography.h2} numberOfLines={1}>
          {campaign?.name ?? 'Campaign'}
        </Text>
      </View>

      {state === 'loading' ? (
        <View style={styles.skeletonGrid}>
          {[0, 1, 2, 3].map((i) => (
            <ProductCardSkeleton key={i} width={CARD_WIDTH} />
          ))}
        </View>
      ) : state === 'error' ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Couldn't load this campaign"
          message="Check your connection and try again."
          actionLabel="Retry"
          onAction={load}
        />
      ) : !campaign || expired ? (
        <EmptyState
          icon="time-outline"
          title="This sale has ended"
          message="Check the Home screen for what's running now."
        />
      ) : (
        <FlatList
          data={campaign.products ?? []}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={[styles.gridContent, { paddingBottom: insets.bottom + spacing.xl }]}
          ListHeaderComponent={listHeader}
          renderItem={({ item }) => (
            <ProductCard product={item} onPress={() => handlePressProduct(item.slug)} width={CARD_WIDTH} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.gray50 },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerBlock: { gap: spacing.sm, paddingBottom: spacing.md },
  banner: {
    width: '100%',
    aspectRatio: 2,
    borderRadius: 16,
    backgroundColor: colors.gray100,
    marginBottom: spacing.xs,
  },
  countdownRow: { gap: spacing.xs, marginTop: spacing.xs },
  endsIn: { fontSize: 10, fontWeight: '700', color: colors.gray500, letterSpacing: 1 },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    padding: spacing.lg,
  },
  gridRow: { gap: spacing.md, paddingHorizontal: spacing.lg },
  gridContent: { gap: spacing.md, paddingTop: spacing.xs },
});
