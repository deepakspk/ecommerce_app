import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { getHomeCampaigns } from '@/api/campaigns';
import { Campaign } from '@/types/campaign';
import { MainTabParamList } from '@/navigation/types';
import { useThemeSettings } from '@/hooks/useThemeSettings';
import { cloudinaryUrl } from '@/utils/cloudinary';
import { resolveAssetUrl } from '@/utils/assetUrl';
import { colors, radius } from '@/theme';

const SIZE = 60;
/** How far the circle floats above the tab bar's top edge. Kept modest — on
 * Android, touches outside the tab bar's bounds aren't delivered, so most of
 * the button must stay inside the bar to remain tappable. */
const OVERHANG = 28;

/** `#rrggbb` + a 2-hex-digit alpha byte; non-hex inputs pass through untinted. */
function tint(hex: string, alphaByte: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? `${hex}${alphaByte}` : hex;
}

/**
 * Center slot of the bottom tab bar: a floating circular button showing the
 * first running campaign's action image inside a white ring on the campaign's
 * theme color, haloed by concentric theme-tinted glow layers. Tapping it opens
 * that campaign's landing screen (HomeTab > Campaign, by slug). Renders
 * nothing while loading or when no campaign is running.
 */
export function CampaignTabButton() {
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();
  const { colors: brand } = useThemeSettings();
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    let mounted = true;
    getHomeCampaigns()
      .then((campaigns) => {
        if (mounted) setCampaign(campaigns[0] ?? null);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  if (!campaign) return null;

  const themeColor =
    campaign.themeColor && /^#[0-9a-fA-F]{6}$/.test(campaign.themeColor)
      ? campaign.themeColor
      : brand.brand600;

  return (
    <View style={styles.slot} pointerEvents="box-none">
      <View style={styles.float} pointerEvents="box-none">
        <View style={[styles.glow, styles.glowOuter, { backgroundColor: tint(themeColor, '14') }]} />
        <View style={[styles.glow, { backgroundColor: tint(themeColor, '2b') }]} />
        <Pressable
          onPress={() =>
            navigation.navigate('HomeTab', { screen: 'Campaign', params: { slug: campaign.slug } })
          }
          style={({ pressed }) => [
            styles.circle,
            { backgroundColor: themeColor },
            pressed && styles.pressed,
          ]}
        >
          {campaign.actionImageUrl ? (
            <Image
              source={{ uri: cloudinaryUrl(resolveAssetUrl(campaign.actionImageUrl), SIZE * 2) }}
              style={styles.image}
              contentFit="cover"
            />
          ) : (
            <Ionicons name="flash" size={26} color={colors.white} />
          )}
        </Pressable>
        <Ionicons name="sparkles" size={13} color="#fbbf24" style={styles.sparkleTopRight} />
        <Ionicons name="sparkles" size={10} color="#fbbf24" style={styles.sparkleBottomLeft} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { flex: 1, alignItems: 'center' },
  // Absolute children with no top/left honor the parent's centering, so the
  // glow circles stay concentric with the button at any size.
  float: {
    marginTop: -OVERHANG,
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: SIZE + 16,
    height: SIZE + 16,
    borderRadius: radius.full,
  },
  glowOuter: { width: SIZE + 32, height: SIZE + 32 },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: radius.full,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: 6,
    shadowColor: colors.black,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  pressed: { transform: [{ scale: 0.92 }] },
  image: { width: SIZE - 8, height: SIZE - 8, borderRadius: radius.full },
  sparkleTopRight: { position: 'absolute', top: -6, right: -10 },
  sparkleBottomLeft: { position: 'absolute', bottom: -8, left: -12 },
});
