import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/theme';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

/** One row of the Account screen's menu — icon + label (+ chevron unless it's a terminal action like Logout). */
export function AccountMenuItem({ icon, label, onPress, danger = false }: Props) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.left}>
        <Ionicons name={icon} size={20} color={danger ? colors.danger600 : colors.gray700} />
        <Text style={[typography.body, danger && styles.dangerText]}>{label}</Text>
      </View>
      {!danger ? <Ionicons name="chevron-forward" size={18} color={colors.gray400} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dangerText: { color: colors.danger600, fontWeight: '600' },
});
