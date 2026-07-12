import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { colors, spacing, typography } from '@/theme';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Icon + title + message + optional action — replaces ad hoc empty/error
 * text built per-screen. The action uses the shared `Button` (rather than
 * its own local Pressable) so it also picks up the live brand color from
 * `ThemeSettingsContext` (02-REACT-NATIVE-PROMPTS.md Prompt 11) for free.
 */
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
        <Button title={actionLabel} onPress={onAction} size="sm" fullWidth={false} style={styles.actionBtn} />
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
  actionBtn: { marginTop: spacing.sm },
});
