import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme';

interface Props {
  onSubmit: (query: string) => void;
  placeholder?: string;
}

/** Navigates into the listing screen with a query — full filtering lands in Prompt 4. */
export function SearchBar({ onSubmit, placeholder = 'Search products' }: Props) {
  const [query, setQuery] = useState('');

  const handleSubmit = () => {
    const trimmed = query.trim();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <View style={styles.container}>
      <Ionicons name="search" size={18} color={colors.gray500} />
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder}
        placeholderTextColor={colors.gray400}
        returnKeyType="search"
        onSubmitEditing={handleSubmit}
      />
      <Pressable onPress={handleSubmit} hitSlop={8}>
        <Ionicons name="arrow-forward-circle" size={22} color={colors.brand600} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
  },
  input: { flex: 1, fontSize: 14, color: colors.gray900 },
});
