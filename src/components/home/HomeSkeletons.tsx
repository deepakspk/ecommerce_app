import { StyleSheet, View } from 'react-native';
import { LoadingSkeleton } from '@/components/ui';
import { RAIL_CARD_WIDTH } from './ProductCardRail';
import { colors, spacing } from '@/theme';

/**
 * Per-section shimmer skeletons mirroring each final layout — every Home
 * section loads independently and shows its own placeholder rather than
 * blocking the screen (docs/PROMPT-home-screen.md §Data loading).
 */

export function ProductCardSkeleton({ width = RAIL_CARD_WIDTH }: { width?: number }) {
  return (
    <View style={[styles.cardSkeleton, { width }]}>
      <LoadingSkeleton width={width - 2} height={width - 2} style={styles.cardImage} />
      <View style={styles.cardBody}>
        <LoadingSkeleton width="90%" height={12} />
        <LoadingSkeleton width="60%" height={12} />
        <LoadingSkeleton width="100%" height={28} style={styles.cardButton} />
      </View>
    </View>
  );
}

/** Six shimmer capsules for the category row. */
export function CapsuleRowSkeleton() {
  return (
    <View style={styles.capsuleRow}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <LoadingSkeleton key={i} width={104} height={38} style={styles.capsule} />
      ))}
    </View>
  );
}

/** Campaign/feature section placeholder: icon tile + title lines + a rail of card skeletons. */
export function SectionSkeleton() {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <LoadingSkeleton width={48} height={48} style={styles.sectionTile} />
        <View style={styles.sectionTitleCol}>
          <LoadingSkeleton width="60%" height={16} />
          <LoadingSkeleton width="40%" height={12} />
        </View>
      </View>
      <View style={styles.sectionRail}>
        {[0, 1, 2].map((i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </View>
    </View>
  );
}

/** 2-column grid placeholder for the "For You" section. */
export function GridSkeleton({ cardWidth }: { cardWidth: number }) {
  return (
    <View style={styles.grid}>
      {[0, 1, 2, 3].map((i) => (
        <ProductCardSkeleton key={i} width={cardWidth} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cardSkeleton: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  cardImage: { borderTopLeftRadius: 15, borderTopRightRadius: 15, borderRadius: 0 },
  cardBody: { padding: spacing.md, gap: spacing.xs },
  cardButton: { borderRadius: 12, marginTop: 2 },
  capsuleRow: { flexDirection: 'row', gap: spacing.sm + 2, paddingHorizontal: spacing.lg },
  capsule: { borderRadius: 999 },
  sectionCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: 16,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    gap: spacing.md,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sectionTile: { borderRadius: 14 },
  sectionTitleCol: { flex: 1, gap: spacing.xs },
  sectionRail: { flexDirection: 'row', gap: spacing.md, overflow: 'hidden' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});
