import { StyleSheet, Text, View } from 'react-native';
import { Review } from '@/types/review';
import { StarRating } from './StarRating';
import { Pagination } from './Pagination';
import { colors, spacing, typography } from '@/theme';

interface Props {
  reviews: Review[];
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
}

export function ReviewList({ reviews, page, pages, onPageChange }: Props) {
  if (reviews.length === 0) {
    return <Text style={typography.muted}>No reviews yet — be the first to write one.</Text>;
  }

  return (
    <View style={styles.container}>
      {reviews.map((review) => (
        <View key={review._id} style={styles.item}>
          <View style={styles.itemHeader}>
            <Text style={typography.label}>{review.user?.name ?? 'Customer'}</Text>
            <StarRating rating={review.rating} size={14} />
          </View>
          {review.comment ? <Text style={typography.body}>{review.comment}</Text> : null}
          <Text style={styles.date}>{new Date(review.createdAt).toLocaleDateString()}</Text>
        </View>
      ))}
      <Pagination page={page} pages={pages} onChange={onPageChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  item: {
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    paddingBottom: spacing.md,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 11, color: colors.gray400 },
});
