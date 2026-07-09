import { useState } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/hooks/useAuth';
import { colors, spacing } from '@/theme';

const MAX_QUESTION_LENGTH = 500;

interface Props {
  onSubmit: (question: string) => Promise<void>;
}

/**
 * The ask box stays visible to guests too (so they can read Q&A regardless) —
 * only the submit *attempt* is gated: a logged-out tap opens the auth modal
 * instead of hiding the whole section (01-DOCUMENTATION.md Prompt 4 spec).
 */
export function QuestionForm({ onSubmit }: Props) {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (submitting) return;
    if (!user) {
      navigation.navigate('AuthModal', { screen: 'Login' });
      return;
    }
    if (!question.trim()) {
      setError('Enter a question');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(question.trim());
      setQuestion('');
    } catch {
      setError('Could not submit your question. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={question}
        onChangeText={(text) => setQuestion(text.slice(0, MAX_QUESTION_LENGTH))}
        placeholder="Ask a question about this product"
        placeholderTextColor={colors.gray400}
        multiline
      />
      <Text style={styles.counter}>
        {question.length} / {MAX_QUESTION_LENGTH}
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
          <Text style={styles.submitText}>Ask</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 14,
    color: colors.gray900,
    minHeight: 60,
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
