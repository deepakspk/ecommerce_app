import { useCallback, useMemo, useState } from 'react';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartStackParamList } from '@/navigation/types';
import { createAddress, updateAddress } from '@/api/addresses';
import { getBranches, LogisticsBranch } from '@/api/logistics';
import { NEPAL_GEO, getDistricts, getMunicipalities } from '@/constants/nepalGeoData';
import { COUNTRIES } from '@/constants/countries';
import { AddressInput } from '@/types/address';
import { getErrorMessage, getFieldErrors } from '@/utils/errorHelpers';
import { colors, radius, spacing, typography } from '@/theme';

const PROVINCES = Object.keys(NEPAL_GEO);

function branchDisplayName(branch: LogisticsBranch): string {
  return String(branch.name ?? branch.district_name);
}

/**
 * Cascading province -> district -> municipality (753 entries — a plain
 * dropdown is unusable at that size, so this is a searchable modal list)
 * -> branch. Switching country away from "Nepal" swaps to generic free-text
 * fields (01-DOCUMENTATION.md §2.9).
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

  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [provincePickerOpen, setProvincePickerOpen] = useState(false);
  const [districtPickerOpen, setDistrictPickerOpen] = useState(false);
  const [municipalityPickerOpen, setMunicipalityPickerOpen] = useState(false);
  const [branchPickerOpen, setBranchPickerOpen] = useState(false);

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
      setDistrictPickerOpen(false);
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

        {formError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{formError}</Text>
          </View>
        ) : null}

        <Field label="Label (optional)">
          <TextInput style={styles.input} value={label} onChangeText={setLabel} placeholder="Home, Office, ..." />
        </Field>

        <Field label="Recipient name" error={fieldErrors.recipientName}>
          <TextInput style={styles.input} value={recipientName} onChangeText={setRecipientName} />
        </Field>

        <Field label="Phone" error={fieldErrors.phone}>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </Field>

        <Field label="Country">
          <Pressable style={styles.selectInput} onPress={() => setCountryPickerOpen(true)}>
            <Text style={typography.body}>{country}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.gray500} />
          </Pressable>
        </Field>

        {isNepal ? (
          <>
            <Field label="Province" error={fieldErrors.province}>
              <Pressable style={styles.selectInput} onPress={() => setProvincePickerOpen(true)}>
                <Text style={typography.body}>{province || 'Select province'}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.gray500} />
              </Pressable>
            </Field>

            <Field label="District" error={fieldErrors.district}>
              <Pressable
                style={[styles.selectInput, !province && styles.selectInputDisabled]}
                onPress={() => province && setDistrictPickerOpen(true)}
                disabled={!province}
              >
                <Text style={typography.body}>{district || 'Select district'}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.gray500} />
              </Pressable>
            </Field>

            <Field label="Municipality" error={fieldErrors.city}>
              <Pressable
                style={[styles.selectInput, !district && styles.selectInputDisabled]}
                onPress={() => district && setMunicipalityPickerOpen(true)}
                disabled={!district}
              >
                <Text style={typography.body}>{city || 'Select municipality'}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.gray500} />
              </Pressable>
            </Field>

            {district ? (
              <Field
                label={branchRequired ? 'Courier branch' : 'Courier branch (optional)'}
                error={fieldErrors.branchName}
              >
                {branches.length > 0 ? (
                  <Pressable style={styles.selectInput} onPress={() => setBranchPickerOpen(true)}>
                    <Text style={typography.body}>{branchName || 'Select branch'}</Text>
                    <Ionicons name="chevron-down" size={16} color={colors.gray500} />
                  </Pressable>
                ) : (
                  <TextInput
                    style={styles.input}
                    value={branchName}
                    onChangeText={setBranchName}
                    placeholder={branchesLoaded ? 'No branches found for this district' : 'Loading branches…'}
                  />
                )}
              </Field>
            ) : null}
          </>
        ) : (
          <Field label="City" error={fieldErrors.city}>
            <TextInput style={styles.input} value={city} onChangeText={setCity} />
          </Field>
        )}

        <Field label="Area">
          <TextInput style={styles.input} value={area} onChangeText={setArea} />
        </Field>

        {!isNepal ? (
          <Field label="Street">
            <TextInput style={styles.input} value={street} onChangeText={setStreet} />
          </Field>
        ) : null}

        <Field label="Landmark">
          <TextInput style={styles.input} value={landmark} onChangeText={setLandmark} />
        </Field>

        <Field label="Postal code (optional)">
          <TextInput style={styles.input} value={postalCode} onChangeText={setPostalCode} keyboardType="numeric" />
        </Field>

        <View style={styles.switchRow}>
          <Text style={typography.body}>Set as default address</Text>
          <Switch value={isDefault} onValueChange={setIsDefault} />
        </View>

        <Pressable style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitText}>Save Address</Text>}
        </Pressable>
      </ScrollView>

      <SearchableListModal
        visible={countryPickerOpen}
        title="Select country"
        options={COUNTRIES}
        onSelect={(value) => {
          setCountry(value);
          if (value !== 'Nepal') {
            setProvince('');
            setDistrict('');
            setBranchName('');
          }
          setCity('');
          setCountryPickerOpen(false);
        }}
        onClose={() => setCountryPickerOpen(false)}
      />

      <SearchableListModal
        visible={provincePickerOpen}
        title="Select province"
        options={PROVINCES}
        onSelect={(value) => {
          setProvince(value);
          setDistrict('');
          setCity('');
          setBranchName('');
          setBranches([]);
          setBranchesLoaded(false);
          setProvincePickerOpen(false);
        }}
        onClose={() => setProvincePickerOpen(false)}
      />

      <SearchableListModal
        visible={districtPickerOpen}
        title="Select district"
        options={districts}
        onSelect={handleSelectDistrict}
        onClose={() => setDistrictPickerOpen(false)}
      />

      <SearchableListModal
        visible={municipalityPickerOpen}
        title="Select municipality"
        options={municipalities}
        onSelect={(value) => {
          setCity(value);
          setMunicipalityPickerOpen(false);
        }}
        onClose={() => setMunicipalityPickerOpen(false)}
      />

      <SearchableListModal
        visible={branchPickerOpen}
        title="Select branch"
        options={branches.map(branchDisplayName)}
        onSelect={(value) => {
          setBranchName(value);
          setBranchPickerOpen(false);
        }}
        onClose={() => setBranchPickerOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={typography.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function SearchableListModal({
  visible,
  title,
  options,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () => options.filter((opt) => opt.toLowerCase().includes(query.trim().toLowerCase())),
    [options, query],
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={typography.h2}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.gray700} />
          </Pressable>
        </View>
        <TextInput
          style={styles.modalSearchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          placeholderTextColor={colors.gray400}
          autoFocus
        />
        <ScrollView keyboardShouldPersistTaps="handled">
          {filtered.map((opt) => (
            <Pressable key={opt} style={styles.modalRow} onPress={() => onSelect(opt)}>
              <Text style={typography.body}>{opt}</Text>
            </Pressable>
          ))}
          {filtered.length === 0 ? <Text style={[typography.muted, styles.modalEmpty]}>No matches.</Text> : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  field: { gap: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.gray900,
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectInputDisabled: { opacity: 0.5 },
  fieldError: { fontSize: 12, color: colors.danger600 },
  errorBanner: { backgroundColor: colors.danger50, borderRadius: 8, padding: spacing.md },
  errorBannerText: { color: colors.danger700, fontSize: 13 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  submitBtn: {
    backgroundColor: colors.brand600,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { color: colors.white, fontWeight: '600' },
  modalContainer: { flex: 1, backgroundColor: colors.white, padding: spacing.lg, gap: spacing.md },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalSearchInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
  },
  modalRow: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  modalEmpty: { textAlign: 'center', marginTop: spacing.xl },
});
