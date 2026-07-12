import { useCallback, useState } from 'react';
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { CartStackParamList } from '@/navigation/types';
import { deleteAddress, getAddresses, setDefaultAddress } from '@/api/addresses';
import { AddressCard } from '@/components/AddressCard';
import { EmptyState } from '@/components/EmptyState';
import { getErrorMessage } from '@/utils/errorHelpers';
import { Address } from '@/types/address';
import { colors, spacing, typography } from '@/theme';

type FetchState = 'loading' | 'ready' | 'error';

export function AddressListScreen() {
  const navigation = useNavigation<NavigationProp<CartStackParamList>>();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [state, setState] = useState<FetchState>('loading');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setState('loading');
    getAddresses()
      .then((data) => {
        setAddresses(data);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleSetDefault = useCallback(
    async (id: string) => {
      try {
        await setDefaultAddress(id);
        load();
      } catch (err) {
        setError(getErrorMessage(err));
      }
    },
    [load],
  );

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert('Delete address', 'Are you sure you want to delete this address?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAddress(id);
              load();
            } catch (err) {
              setError(getErrorMessage(err));
            }
          },
        },
      ]);
    },
    [load],
  );

  if (state === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand600} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <FlatList
        data={addresses}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={[typography.h1, styles.title]}>Address Book</Text>}
        ListEmptyComponent={
          state === 'error' ? (
            <EmptyState icon="alert-circle-outline" title="Couldn't load addresses" actionLabel="Retry" onAction={load} />
          ) : (
            <EmptyState icon="location-outline" title="No addresses yet" message="Add an address to speed up checkout." />
          )
        }
        renderItem={({ item }) => (
          <AddressCard
            address={item}
            onEdit={() => navigation.navigate('AddressForm', { address: item })}
            onDelete={() => handleDelete(item._id)}
            onSetDefault={() => handleSetDefault(item._id)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.footer}>
        <Pressable style={styles.addBtn} onPress={() => navigation.navigate('AddressForm', undefined)}>
          <Text style={styles.addText}>+ Add New Address</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { marginBottom: spacing.md },
  errorBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.danger50,
  },
  errorText: { color: colors.danger700, fontSize: 13 },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.gray100 },
  addBtn: {
    borderWidth: 1,
    borderColor: colors.brand600,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  addText: { color: colors.brand600, fontWeight: '600' },
});
