import { StyleSheet, Text, View } from 'react-native';
import { ProductQuestion } from '@/types/question';
import { colors, spacing, typography } from '@/theme';

interface Props {
  questions: ProductQuestion[];
}

/** Unanswered questions still display, with an "awaiting an answer" state (01-DOCUMENTATION.md §2.6). */
export function QuestionList({ questions }: Props) {
  if (questions.length === 0) {
    return <Text style={typography.muted}>No questions yet — be the first to ask.</Text>;
  }

  return (
    <View style={styles.container}>
      {questions.map((item) => (
        <View key={item._id} style={styles.item}>
          <Text style={typography.label}>Q: {item.question}</Text>
          {item.answer ? (
            <Text style={typography.body}>A: {item.answer}</Text>
          ) : (
            <Text style={typography.muted}>Awaiting an answer</Text>
          )}
        </View>
      ))}
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
});
