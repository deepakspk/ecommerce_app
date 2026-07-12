import { useState } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input } from '@/components/ui';
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
      <Input
        style={styles.input}
        value={question}
        onChangeText={(text) => setQuestion(text.slice(0, MAX_QUESTION_LENGTH))}
        placeholder="Ask a question about this product"
        multiline
      />
      <Text style={styles.counter}>
        {question.length} / {MAX_QUESTION_LENGTH}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Ask" onPress={handleSubmit} loading={submitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  input: { minHeight: 60, textAlignVertical: 'top' },
  counter: { alignSelf: 'flex-end', fontSize: 11, color: colors.gray400 },
  error: { fontSize: 12, color: colors.danger600 },
});
