import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from './Modal';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { colors, radius, spacing, typography } from '@/theme';

export interface SelectProps {
  label?: string;
  value?: string;
  placeholder?: string;
  options: string[];
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  /** Off for short lists (e.g. country) where a search box adds nothing. Default on — needed at municipality-list scale (753 entries). */
  searchable?: boolean;
}

/**
 * Trigger row + searchable full-screen picker — formalizes the pattern
 * `AddressFormScreen` built ad hoc five times over (country/province/
 * district/municipality/branch) as its own local `SearchableListModal`
 * (02-REACT-NATIVE-PROMPTS.md Prompt 9).
 */
export function Select({
  label,
  value,
  placeholder = 'Select',
  options,
  onChange,
  error,
  disabled,
  searchable = true,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  // Debounced so filtering a long static list (e.g. Nepal's 753 municipalities)
  // on every keystroke stays smooth (02-REACT-NATIVE-PROMPTS.md Prompt 6).
  const debouncedQuery = useDebouncedValue(query, 150);

  const filtered = useMemo(
    () =>
      searchable && debouncedQuery
        ? options.filter((opt) => opt.toLowerCase().includes(debouncedQuery.trim().toLowerCase()))
        : options,
    [options, debouncedQuery, searchable],
  );

  const handleSelect = (opt: string) => {
    onChange(opt);
    setQuery('');
    setOpen(false);
  };

  return (
    <View style={styles.field}>
      {label ? <Text style={typography.label}>{label}</Text> : null}
      <Pressable
        style={[styles.trigger, !!error && styles.triggerError, disabled && styles.triggerDisabled]}
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
      >
        <Text style={value ? typography.body : styles.placeholder}>{value || placeholder}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.gray500} />
      </Pressable>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}

      <Modal visible={open} onClose={() => setOpen(false)} title={label ?? placeholder}>
        <View style={styles.modalBody}>
          {searchable ? (
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search"
              placeholderTextColor={colors.gray400}
              autoFocus
            />
          ) : null}
          <ScrollView keyboardShouldPersistTaps="handled">
            {filtered.map((opt) => (
              <Pressable key={opt} style={styles.row} onPress={() => handleSelect(opt)}>
                <Text style={typography.body}>{opt}</Text>
              </Pressable>
            ))}
            {filtered.length === 0 ? <Text style={[typography.muted, styles.empty]}>No matches.</Text> : null}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  trigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  triggerError: { borderColor: colors.danger600 },
  triggerDisabled: { opacity: 0.5 },
  placeholder: { fontSize: 14, color: colors.gray400 },
  fieldError: { fontSize: 12, color: colors.danger600 },
  modalBody: { flex: 1, padding: spacing.lg, gap: spacing.md },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
  },
  row: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  empty: { textAlign: 'center', marginTop: spacing.xl },
});
