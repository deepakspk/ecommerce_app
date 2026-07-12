import { useCallback, useMemo, useState } from 'react';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { CartStackParamList } from '@/navigation/types';
import { createAddress, updateAddress } from '@/api/addresses';
import { getBranches, LogisticsBranch } from '@/api/logistics';
import { NEPAL_GEO, getDistricts, getMunicipalities } from '@/constants/nepalGeoData';
import { COUNTRIES } from '@/constants/countries';
import { AddressInput } from '@/types/address';
import { getErrorMessage, getFieldErrors } from '@/utils/errorHelpers';
import { Button, FormError, Input, Select } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

const PROVINCES = Object.keys(NEPAL_GEO);

function branchDisplayName(branch: LogisticsBranch): string {
  return String(branch.name ?? branch.district_name);
}

/**
 * Cascading province -> district -> municipality (753 entries — a plain
 * dropdown is unusable at that size, so this uses the shared `Select`'s
 * searchable modal list) -> branch. Switching country away from "Nepal" swaps
 * to generic free-text fields (01-DOCUMENTATION.md §2.9).
 */
export function AddressFormScreen() {
  const navigation = useNavigation<NavigationProp<CartStackParamList>>();
  const route = useRoute<RouteProp<CartStackParamList, 'AddressForm'>>();
  const existing = route.params?.address;
  const isEdit = !!existing;

  const [label, setLabel] = useState(existing?.label ?? '');
  const [recipientName, setRecipientName] = useState(existing?.recipientName ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [country, setCountry] = useState(existing?.country ?? 'Nepal');
  const [province, setProvince] = useState(existing?.province ?? '');
  const [district, setDistrict] = useState(existing?.district ?? '');
  const [city, setCity] = useState(existing?.city ?? '');
  const [branchName, setBranchName] = useState(existing?.branchName ?? '');
  const [postalCode, setPostalCode] = useState(existing?.postalCode ?? '');
  const [area, setArea] = useState(existing?.area ?? '');
  const [street, setStreet] = useState(existing?.street ?? '');
  const [landmark, setLandmark] = useState(existing?.landmark ?? '');
  const [isDefault, setIsDefault] = useState(existing?.isDefault ?? false);

  const [branches, setBranches] = useState<LogisticsBranch[]>([]);
  const [branchesLoaded, setBranchesLoaded] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isNepal = country === 'Nepal';
  const districts = useMemo(() => (province ? getDistricts(province) : []), [province]);
  const municipalities = useMemo(
    () => (province && district ? getMunicipalities(province, district) : []),
    [province, district],
  );

  const loadBranches = useCallback(async (nextDistrict: string) => {
    setBranchesLoaded(false);
    try {
      const result = await getBranches(nextDistrict);
      setBranches(result);
    } catch {
      setBranches([]);
    } finally {
      setBranchesLoaded(true);
    }
  }, []);

  const handleSelectDistrict = useCallback(
    (nextDistrict: string) => {
      setDistrict(nextDistrict);
      setCity('');
      setBranchName('');
      loadBranches(nextDistrict);
    },
    [loadBranches],
  );

  const branchRequired = isNepal && branchesLoaded && branches.length > 0;

  const handleSubmit = async () => {
    if (submitting) return;
    setFormError(null);
    setFieldErrors({});

    const nextFieldErrors: Record<string, string> = {};
    if (!recipientName.trim()) nextFieldErrors.recipientName = 'Recipient name is required';
    if (!phone.trim()) nextFieldErrors.phone = 'Phone number is required';
    if (isNepal) {
      if (!province) nextFieldErrors.province = 'Select a province';
      if (!district) nextFieldErrors.district = 'Select a district';
      if (!city) nextFieldErrors.city = 'Select a municipality';
      if (branchRequired && !branchName.trim()) nextFieldErrors.branchName = 'Select a branch';
    } else if (!city.trim()) {
      nextFieldErrors.city = 'City is required';
    }
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    const input: AddressInput = {
      label: label.trim() || undefined,
      recipientName: recipientName.trim(),
      phone: phone.trim(),
      country,
      province: isNepal ? province : undefined,
      district: isNepal ? district : undefined,
      city: city.trim(),
      branchName: isNepal ? branchName.trim() || undefined : undefined,
      postalCode: postalCode.trim() || undefined,
      area: area.trim() || undefined,
      street: street.trim() || undefined,
      landmark: landmark.trim() || undefined,
      isDefault,
    };

    setSubmitting(true);
    try {
      if (isEdit && existing) {
        await updateAddress(existing._id, input);
      } else {
        await createAddress(input);
      }
      navigation.goBack();
    } catch (err) {
      const fe = getFieldErrors(err);
      if (Object.keys(fe).length > 0) setFieldErrors(fe);
      else setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={typography.h1}>{isEdit ? 'Edit Address' : 'Add Address'}</Text>

        <FormError message={formError} />

        <Input label="Label (optional)" value={label} onChangeText={setLabel} placeholder="Home, Office, ..." />

        <Input
          label="Recipient name"
          value={recipientName}
          onChangeText={setRecipientName}
          error={fieldErrors.recipientName}
        />

        <Input label="Phone" value={phone} onChangeText={setPhone} error={fieldErrors.phone} keyboardType="phone-pad" />

        <Select
          label="Country"
          value={country}
          options={COUNTRIES}
          searchable={false}
          onChange={(value) => {
            setCountry(value);
            if (value !== 'Nepal') {
              setProvince('');
              setDistrict('');
              setBranchName('');
            }
            setCity('');
          }}
        />

        {isNepal ? (
          <>
            <Select
              label="Province"
              value={province}
              placeholder="Select province"
              options={PROVINCES}
              error={fieldErrors.province}
              searchable={false}
              onChange={(value) => {
                setProvince(value);
                setDistrict('');
                setCity('');
                setBranchName('');
                setBranches([]);
                setBranchesLoaded(false);
              }}
            />

            <Select
              label="District"
              value={district}
              placeholder="Select district"
              options={districts}
              error={fieldErrors.district}
              disabled={!province}
              onChange={handleSelectDistrict}
            />

            <Select
              label="Municipality"
              value={city}
              placeholder="Select municipality"
              options={municipalities}
              error={fieldErrors.city}
              disabled={!district}
              onChange={setCity}
            />

            {district ? (
              branches.length > 0 ? (
                <Select
                  label={branchRequired ? 'Courier branch' : 'Courier branch (optional)'}
                  value={branchName}
                  placeholder="Select branch"
                  options={branches.map(branchDisplayName)}
                  error={fieldErrors.branchName}
                  onChange={setBranchName}
                />
              ) : (
                <Input
                  label={branchRequired ? 'Courier branch' : 'Courier branch (optional)'}
                  value={branchName}
                  onChangeText={setBranchName}
                  error={fieldErrors.branchName}
                  placeholder={branchesLoaded ? 'No branches found for this district' : 'Loading branches…'}
                />
              )
            ) : null}
          </>
        ) : (
          <Input label="City" value={city} onChangeText={setCity} error={fieldErrors.city} />
        )}

        <Input label="Area" value={area} onChangeText={setArea} />

        {!isNepal ? <Input label="Street" value={street} onChangeText={setStreet} /> : null}

        <Input label="Landmark" value={landmark} onChangeText={setLandmark} />

        <Input label="Postal code (optional)" value={postalCode} onChangeText={setPostalCode} keyboardType="numeric" />

        <View style={styles.switchRow}>
          <Text style={typography.body}>Set as default address</Text>
          <Switch value={isDefault} onValueChange={setIsDefault} />
        </View>

        <Button title="Save Address" onPress={handleSubmit} loading={submitting} style={styles.submitBtn} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  submitBtn: { marginTop: spacing.md },
});
