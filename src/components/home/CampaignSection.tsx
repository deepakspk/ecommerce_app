import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Campaign } from '@/types/campaign';
import { useThemeSettings } from '@/hooks/useThemeSettings';
import { cloudinaryUrl } from '@/utils/cloudinary';
import { resolveAssetUrl } from '@/utils/assetUrl';
import { CountdownTimer } from './CountdownTimer';
import { ProductCardRail, RAIL_CARD_WIDTH } from './ProductCardRail';
import { colors, radius, spacing } from '@/theme';

/** `#rrggbb` + a 2-hex-digit alpha byte (e.g. `0d` ≈ 5%); non-hex inputs pass through untinted. */
function tint(hex: string, alphaByte: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? `${hex}${alphaByte}` : hex;
}

interface Props {
  campaign: Campaign;
  onPressProduct: (slug: string) => void;
  /** CTA button, and the "+N more deals" tile — both open the Campaign screen. */
  onPressViewAll: (campaign: Campaign) => void;
  /** Countdown hit zero — the parent must remove this whole section. */
  onExpire: (campaignId: string) => void;
}

/**
 * Flash-sale section card (docs/PROMPT-home-screen.md §5): themeColor-tinted
 * background, HOT badge, live per-second countdown (DAYS box only when
 * days > 0), CTA, a ≤10-product rail, and a dashed "+N more deals" tile when
 * `productCount` exceeds the products carried in the response.
 */
export function CampaignSection({ campaign, onPressProduct, onPressViewAll, onExpire }: Props) {
  const { colors: brand } = useThemeSettings();
  const themeColor =
    campaign.themeColor && /^#[0-9a-fA-F]{6}$/.test(campaign.themeColor)
      ? campaign.themeColor
      : brand.brand600;

  const products = campaign.products ?? [];
  const moreCount = campaign.productCount - products.length;

  const viewMoreTile =
    moreCount > 0 ? (
      <Pressable
        style={[styles.viewMore, { borderColor: tint(themeColor, '66') }]}
        onPress={() => onPressViewAll(campaign)}
      >
        <Text style={[styles.viewMoreCount, { color: themeColor }]}>+{moreCount}</Text>
        <Text style={styles.viewMoreLabel}>more deals</Text>
        <Text style={[styles.viewMoreLink, { color: themeColor }]}>View All →</Text>
      </Pressable>
    ) : null;

  return (
    <View style={[styles.card, { backgroundColor: tint(themeColor, '0d') }]}>
      <View style={styles.headerRow}>
        {campaign.actionImageUrl ? (
          <Image
            source={{ uri: cloudinaryUrl(resolveAssetUrl(campaign.actionImageUrl), 120) }}
            style={styles.actionImage}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.actionFallback, { backgroundColor: tint(themeColor, '1a') }]}>
            <Ionicons name="time-outline" size={24} color={themeColor} />
          </View>
        )}
        <View style={styles.titleCol}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {campaign.name}
            </Text>
            <View style={styles.hotBadge}>
              <Text style={styles.hotText}>HOT</Text>
            </View>
          </View>
          {campaign.description ? (
            <Text style={styles.description} numberOfLines={1}>
              {campaign.description}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.countdownRow}>
        <View style={styles.countdownCol}>
          <Text style={styles.endsIn}>ENDS IN</Text>
          <CountdownTimer
            endDate={campaign.endDate}
            numberColor={themeColor}
            onExpire={() => onExpire(campaign._id)}
          />
        </View>
        <Pressable style={[styles.cta, { backgroundColor: themeColor }]} onPress={() => onPressViewAll(campaign)}>
          <Text style={styles.ctaText}>{campaign.buttonLabel || 'Shop Now'}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.white} />
        </Pressable>
      </View>

      <View style={styles.divider} />

      <ProductCardRail products={products} onPressProduct={onPressProduct} footer={viewMoreTile} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    paddingVertical: spacing.lg,
    marginHorizontal: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  actionImage: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.gray100 },
  actionFallback: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { flexShrink: 1, fontSize: 21, fontWeight: '800', color: colors.gray900 },
  hotBadge: {
    backgroundColor: '#facc15',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
  },
  hotText: { fontSize: 10, fontWeight: '700', color: colors.gray900, letterSpacing: 0.5 },
  description: { fontSize: 12, color: colors.gray500 },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  countdownCol: { gap: spacing.xs },
  endsIn: { fontSize: 10, fontWeight: '700', color: colors.gray500, letterSpacing: 1 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  ctaText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    opacity: 0.6,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
  },
  viewMore: {
    width: RAIL_CARD_WIDTH,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    alignSelf: 'stretch',
    minHeight: RAIL_CARD_WIDTH * 1.5,
  },
  viewMoreCount: { fontSize: 24, fontWeight: '800' },
  viewMoreLabel: { fontSize: 12, color: colors.gray500 },
  viewMoreLink: { fontSize: 13, fontWeight: '700' },
});
