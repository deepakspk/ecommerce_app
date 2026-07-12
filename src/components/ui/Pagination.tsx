import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';

interface Props {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}

/** Numbered pager — used where a bounded sub-list (e.g. reviews) pages rather than infinite-scrolls. */
export function Pagination({ page, pages, onChange }: Props) {
  if (pages <= 1) return null;

  return (
    <View style={styles.row}>
      <Pressable
        style={[styles.btn, page <= 1 && styles.btnDisabled]}
        onPress={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        <Text style={styles.btnText}>Prev</Text>
      </Pressable>
      <Text style={styles.pageText}>
        {page} / {pages}
      </Text>
      <Pressable
        style={[styles.btn, page >= pages && styles.btnDisabled]}
        onPress={() => onChange(page + 1)}
        disabled={page >= pages}
      >
        <Text style={styles.btnText}>Next</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  btn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 13, color: colors.gray700, fontWeight: '500' },
  pageText: { fontSize: 13, color: colors.gray500 },
});
