import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeSettings } from '@/hooks/useThemeSettings';
import { colors, spacing } from '@/theme';

interface Badge {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}

const BADGES: Badge[] = [
  { icon: 'car-outline', title: 'Nationwide Delivery', subtitle: 'Fast shipping across Nepal' },
  { icon: 'pricetag-outline', title: 'Daily Deals & Discounts', subtitle: 'Save more with campaign offers' },
  { icon: 'shield-checkmark-outline', title: 'Secure Payments', subtitle: 'COD · eSewa · Khalti' },
];

/**
 * Static trust strip — 3 compact info cards right after the category capsules
 * (docs/PROMPT-home-screen.md §4). Hard-coded, no API call.
 */
export function TrustBadges() {
  const { colors: brand } = useThemeSettings();

  return (
    <View style={styles.container}>
      {BADGES.map((badge) => (
        <View key={badge.title} style={styles.card}>
          <View style={[styles.iconTile, { backgroundColor: brand.brand50 }]}>
            <Ionicons name={badge.icon} size={18} color={brand.brand600} />
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {badge.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {badge.subtitle}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  iconTile: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 13, fontWeight: '600', color: colors.gray900, textAlign: 'center' },
  subtitle: { fontSize: 11, color: colors.gray500, textAlign: 'center' },
});
