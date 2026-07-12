import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/theme';

interface Badge {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}

const BADGES: Badge[] = [
  { icon: 'car-outline', title: 'Nationwide Delivery', subtitle: 'Cash on Delivery available' },
  { icon: 'card-outline', title: 'Secure Payments', subtitle: 'Khalti · eSewa · COD' },
  { icon: 'arrow-undo-outline', title: 'Easy Returns', subtitle: 'Within the return window' },
];

/**
 * Static trust signals — ports the web app's `TrustBadges` component
 * (01-DOCUMENTATION.md's component table). Copy is deliberately limited to
 * what this app actually supports (real payment methods, real return flow)
 * rather than generic marketing claims we have no data to back (e.g. a
 * blanket discount percentage).
 */
export function TrustBadges() {
  return (
    <View style={styles.container}>
      {BADGES.map((badge) => (
        <View key={badge.title} style={styles.badge}>
          <Ionicons name={badge.icon} size={18} color={colors.brand600} />
          <Text style={[typography.label, styles.title]} numberOfLines={1}>
            {badge.title}
          </Text>
          <Text style={[typography.muted, styles.subtitle]} numberOfLines={2}>
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
    marginHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  badge: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: spacing.xs },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center' },
});
