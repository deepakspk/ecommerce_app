import { useCallback, useEffect, useRef, useState } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import {
  Dimensions,
  FlatList,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgUri } from 'react-native-svg';
import { Banner } from '@/types/banner';
import { HomeStackParamList } from '@/navigation/types';
import { useThemeSettings } from '@/hooks/useThemeSettings';
import { cloudinaryUrl } from '@/utils/cloudinary';
import { resolveAssetUrl } from '@/utils/assetUrl';
import { LoadingSkeleton } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

const AUTO_ADVANCE_MS = 5000;
const SCREEN_WIDTH = Dimensions.get('window').width;
/** 16:9 hero, flush with the very top of the physical screen (docs/PROMPT-home-screen.md §1). */
export const BANNER_HEIGHT = Math.round(SCREEN_WIDTH * 0.5625);

interface Props {
  banners: Banner[];
  loading?: boolean;
}

/**
 * expo-image's SVG decoder letterboxes instead of honoring `contentFit="cover"`,
 * so SVG banners (the backend's seed assets are 1680×360 SVGs) go through
 * react-native-svg with `preserveAspectRatio="slice"` — SVG's own cover mode.
 */
function BannerImage({ banner }: { banner: Banner }) {
  const url = resolveAssetUrl(banner.imageUrl);
  if (/\.svg(\?|$)/i.test(url)) {
    return (
      <View style={styles.image}>
        <SvgUri
          uri={url}
          width={SCREEN_WIDTH}
          height={BANNER_HEIGHT}
          preserveAspectRatio="xMidYMid slice"
        />
      </View>
    );
  }
  return <Image source={{ uri: cloudinaryUrl(url, 800) }} style={styles.image} contentFit="cover" />;
}

/**
 * Edge-to-edge hero drawn behind the (translucent) status bar. Auto-advances
 * every 5s with an infinite modulo loop, paused while the user is touching it;
 * tap navigates in-app for an internal link or opens the system browser for an
 * external one. While loading it's a full-width shimmer; with zero banners it
 * degrades to a brand gradient block of the same height so the floating header
 * always has a background (docs/PROMPT-home-screen.md §1).
 */
export function BannerCarousel({ banners, loading = false }: Props) {
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
  const { colors: brand } = useThemeSettings();
  const listRef = useRef<FlatList<Banner>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || banners.length <= 1) return undefined;
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % banners.length;
        listRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [paused, banners.length]);

  const handleMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
    setActiveIndex(next);
  }, []);

  const handlePress = useCallback(
    (banner: Banner) => {
      const parsed = parseBannerLink(banner.link);
      if (!parsed) return;
      if (parsed.type === 'external') {
        Linking.openURL(parsed.url).catch(() => {});
      } else {
        navigation.navigate('ProductList', parsed.params);
      }
    },
    [navigation],
  );

  if (loading) {
    return <LoadingSkeleton width={SCREEN_WIDTH} height={BANNER_HEIGHT} style={styles.skeleton} />;
  }

  if (banners.length === 0) {
    return (
      <LinearGradient
        colors={[brand.brand600, brand.brand800]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={banners}
        keyExtractor={(item) => item._id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        onScrollBeginDrag={() => setPaused(true)}
        onScrollEndDrag={() => setPaused(false)}
        renderItem={({ item }) => (
          <Pressable onPress={() => handlePress(item)}>
            <BannerImage banner={item} />
          </Pressable>
        )}
      />
      {banners.length > 1 ? (
        <View style={styles.dots}>
          {banners.map((banner, i) => (
            <View key={banner._id} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

type ParsedBannerLink =
  | { type: 'external'; url: string }
  | { type: 'internal'; params: HomeStackParamList['ProductList'] };

/**
 * The web app resolves banner links via react-router `Link`; there's no
 * equivalent URL router on mobile, so an internal link is pattern-matched
 * into `ProductList` filter params instead (category/featureType/search).
 */
function parseBannerLink(link: string | undefined): ParsedBannerLink | null {
  if (!link) return null;
  if (/^https?:\/\//i.test(link)) return { type: 'external', url: link };

  try {
    const [path, queryString] = link.split('?');
    const params = new URLSearchParams(queryString ?? '');
    const categorySlug = params.get('category') ?? undefined;
    const featureType = params.get('featureType') ?? undefined;
    const search = params.get('search') ?? undefined;
    if (path.startsWith('/products') || categorySlug || featureType || search) {
      return { type: 'internal', params: { categorySlug, featureType, search } };
    }
    return null;
  } catch {
    return null;
  }
}

const styles = StyleSheet.create({
  container: { width: SCREEN_WIDTH, height: BANNER_HEIGHT },
  skeleton: { borderRadius: 0 },
  image: { width: SCREEN_WIDTH, height: BANNER_HEIGHT, backgroundColor: colors.gray100 },
  dots: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    opacity: 0.6,
  },
  dotActive: { width: 24, opacity: 0.95 },
});
