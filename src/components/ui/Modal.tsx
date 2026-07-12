import { ReactNode } from 'react';
import { Modal as RNModal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * Full-screen page-sheet chrome (optional header + close) — generalizes the
 * outer shell that `FilterSheet` and `AddressFormScreen`'s searchable picker
 * each built independently as a one-off `<Modal presentationStyle="pageSheet">`
 * (02-REACT-NATIVE-PROMPTS.md Prompt 9).
 */
export function Modal({ visible, onClose, title, children }: Props) {
  return (
    <RNModal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {title ? (
          <View style={styles.header}>
            <Text style={typography.h2}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.gray700} />
            </Pressable>
          </View>
        ) : null}
        {children}
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
});
