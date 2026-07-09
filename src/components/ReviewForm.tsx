import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Review } from '@/types/review';
import { StarRating } from './StarRating';
import { colors, spacing, typography } from '@/theme';

const MAX_COMMENT_LENGTH = 1000;

interface Props {
  /** Present when the user already reviewed this product — form becomes an edit (upsert, 01-DOCUMENTATION.md §2.5). */
  existingReview?: Review | null;
  onSubmit: (input: { rating: number; comment?: string }) => Promise<void>;
}

export function ReviewForm({ existingReview, onSubmit }: Props) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [comment, setComment] = useState(existingReview?.comment ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (submitting) return;
    if (rating < 1 || rating > 5) {
      setError('Select a rating from 1 to 5');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({ rating, comment: comment.trim() || undefined });
    } catch {
      setError('Could not submit your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={typography.label}>{existingReview ? 'Edit your review' : 'Write a review'}</Text>
      <StarRating rating={rating} onChange={setRating} size={26} />

      <TextInput
        style={styles.textarea}
        value={comment}
        onChangeText={(text) => setComment(text.slice(0, MAX_COMMENT_LENGTH))}
        placeholder="Share your thoughts (optional)"
        placeholderTextColor={colors.gray400}
        multiline
        numberOfLines={4}
      />
      <Text style={styles.counter}>
        {comment.length} / {MAX_COMMENT_LENGTH}
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.submitText}>
            {existingReview ? 'Update Review' : 'Submit Review'}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  textarea: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 14,
    color: colors.gray900,
    minHeight: 88,
    textAlignVertical: 'top',
  },
  counter: { alignSelf: 'flex-end', fontSize: 11, color: colors.gray400 },
  error: { fontSize: 12, color: colors.danger600 },
  submitBtn: {
    backgroundColor: colors.brand600,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { color: colors.white, fontWeight: '600' },
});
