import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeSettings } from '@/hooks/useThemeSettings';
import { BANNER_HEIGHT } from '@/components/BannerCarousel';
import { colors, radius, spacing } from '@/theme';

const SCRIM_HEIGHT = 90;

interface Props {
  /** Home scroll offset — drives the solid-white pinned background fade-in. */
  scrollY: Animated.Value;
  onPressSearch: () => void;
  onPressNotifications: () => void;
}

/**
 * Floating header OVER the hero banner (docs/PROMPT-home-screen.md §2):
 * long pill search *button* · notification bell, padded down by the
 * safe-area top inset, kept legible by a top-down dark scrim. Once the user
 * scrolls past the banner the same row pins as a solid white bar (animated
 * background-opacity interpolation on the scroll offset).
 */
export function HomeHeader({ scrollY, onPressSearch, onPressNotifications }: Props) {
  const insets = useSafeAreaInsets();
  const { colors: brand } = useThemeSettings();

  const bgOpacity = scrollY.interpolate({
    inputRange: [BANNER_HEIGHT - 140, BANNER_HEIGHT - 70],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container} pointerEvents="box-none">
      <LinearGradient
        colors={['rgba(0,0,0,0.35)', 'transparent']}
        style={[styles.scrim, { height: SCRIM_HEIGHT + insets.top }]}
        pointerEvents="none"
      />
      <Animated.View style={[styles.solidBg, { opacity: bgOpacity }]} pointerEvents="none" />
      <View style={[styles.row, { marginTop: insets.top + spacing.xs }]}>
        <Pressable style={styles.searchPill} onPress={onPressSearch}>
          <Ionicons name="search" size={16} color={colors.gray500} />
          <Text style={styles.searchText} numberOfLines={1}>
            Search for products…
          </Text>
        </Pressable>

        <Pressable style={styles.bellChip} onPress={onPressNotifications} hitSlop={4}>
          <Ionicons name="notifications-outline" size={18} color={colors.gray700} />
          <View style={[styles.badgeDot, { backgroundColor: brand.brand600 }]} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingBottom: spacing.sm,
  },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0 },
  solidBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  searchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    height: 38,
    shadowColor: colors.black,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  searchText: { flex: 1, fontSize: 13, color: colors.gray500 },
  bellChip: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  badgeDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
});
