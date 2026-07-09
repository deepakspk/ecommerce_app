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
import { Banner } from '@/types/banner';
import { HomeStackParamList } from '@/navigation/types';
import { cloudinaryUrl } from '@/utils/cloudinary';
import { colors, radius, spacing } from '@/theme';

const AUTO_ADVANCE_MS = 5000;
const SCREEN_WIDTH = Dimensions.get('window').width;

interface Props {
  banners: Banner[];
}

/**
 * Auto-advances every 5s, paused while the user is touching it; tap navigates
 * in-app for an internal link or opens the system browser for an external one
 * (`http(s)://`); renders nothing if there are no active banners
 * (01-DOCUMENTATION.md §2.2, mirrored exactly for parity with the web app).
 */
export function BannerCarousel({ banners }: Props) {
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
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

  if (banners.length === 0) return null;

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
            <Image
              source={{ uri: cloudinaryUrl(item.imageUrl, SCREEN_WIDTH) }}
              style={styles.image}
              contentFit="cover"
            />
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
  container: { width: SCREEN_WIDTH },
  image: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.5, backgroundColor: colors.gray100 },
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
});
