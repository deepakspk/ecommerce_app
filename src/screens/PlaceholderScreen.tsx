import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';

/**
 * Generic stand-in for a screen that a later prompt will build for real.
 * Used only during Prompt 1 scaffolding so every tab/stack has something to render.
 */
export function PlaceholderScreen({ label }: { label: string }) {
  return (
    <View style={styles.container}>
      <Text style={typography.h2}>{label}</Text>
      <Text style={[typography.muted, styles.note]}>Built in a later prompt.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  note: {
    marginTop: spacing.xs,
  },
});
