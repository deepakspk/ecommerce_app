import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/theme';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Icon + title + message + optional action — replaces ad hoc empty/error text built per-screen. */
export function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
  actionLabel,
  onAction,
}: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={40} color={colors.gray400} />
      <Text style={[typography.h2, styles.title]}>{title}</Text>
      {message ? <Text style={[typography.muted, styles.message]}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable style={styles.actionBtn} onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  title: { textAlign: 'center' },
  message: { textAlign: 'center' },
  actionBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.brand600,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  actionText: { color: colors.white, fontWeight: '600' },
});
