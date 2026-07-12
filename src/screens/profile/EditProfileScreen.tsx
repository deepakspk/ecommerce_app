import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AccountStackParamList } from '@/navigation/types';
import { useAuth } from '@/hooks/useAuth';
import { updateProfile } from '@/api/auth';
import { isValidEmail, isValidNepaliPhone } from '@/utils/validators';
import { getErrorMessage, getFieldErrors } from '@/utils/errorHelpers';
import { Avatar } from '@/components/Avatar';
import { colors, spacing, typography } from '@/theme';

/**
 * Avatar upload is decoupled from the name/email/phone Save action: picking
 * a photo uploads immediately with an optimistic local preview and its own
 * loading state on the Avatar itself (02-REACT-NATIVE-PROMPTS.md Prompt 8
 * Performance section), independent of the field form below it.
 */
export function EditProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AccountStackParamList>>();
  const { user, refreshMe } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (!user) return null;

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to change your avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    setLocalAvatarUri(uri);
    setAvatarUploading(true);
    try {
      await updateProfile({ avatarUri: uri });
      await refreshMe();
    } catch (err) {
      Alert.alert('Upload failed', getErrorMessage(err));
      setLocalAvatarUri(null);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSave = async () => {
    if (submitting) return;
    setFormError(null);
    setFieldErrors({});

    const nextFieldErrors: Record<string, string> = {};
    if (!isValidEmail(email)) nextFieldErrors.email = 'Enter a valid email address';
    if (phone && !isValidNepaliPhone(phone)) nextFieldErrors.phone = 'Enter a valid Nepali phone number';
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      await updateProfile({ name, email, phone: phone || undefined });
      await refreshMe();
      navigation.goBack();
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={typography.h1}>Edit Profile</Text>

        {formError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{formError}</Text>
          </View>
        ) : null}

        <Pressable style={styles.avatarWrap} onPress={handlePickAvatar} disabled={avatarUploading}>
          <Avatar uri={localAvatarUri ?? user.avatarUrl} name={user.name} size={88} />
          {avatarUploading ? (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator color={colors.white} />
            </View>
          ) : (
            <View style={styles.avatarEditBadge}>
              <Text style={styles.avatarEditText}>Edit</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.field}>
          <Text style={typography.label}>Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" />
        </View>

        <View style={styles.field}>
          <Text style={typography.label}>Email</Text>
          <TextInput
            style={[styles.input, fieldErrors.email && styles.inputError]}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          {fieldErrors.email ? <Text style={styles.fieldError}>{fieldErrors.email}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={typography.label}>Phone</Text>
          <TextInput
            style={[styles.input, fieldErrors.phone && styles.inputError]}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="98XXXXXXXX"
          />
          {fieldErrors.phone ? <Text style={styles.fieldError}>{fieldErrors.phone}</Text> : null}
        </View>

        <Pressable style={[styles.primaryBtn, submitting && styles.btnDisabled]} onPress={handleSave} disabled={submitting}>
          {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryBtnText}>Save Changes</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  container: { padding: spacing.xl, gap: spacing.md, backgroundColor: colors.white },
  avatarWrap: { alignSelf: 'center', marginVertical: spacing.md },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 44,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    backgroundColor: colors.brand600,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  avatarEditText: { color: colors.white, fontSize: 11, fontWeight: '600' },
  field: { gap: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.gray900,
  },
  inputError: { borderColor: colors.danger600 },
  fieldError: { fontSize: 12, color: colors.danger600 },
  errorBanner: { backgroundColor: colors.danger50, borderRadius: 8, padding: spacing.md },
  errorBannerText: { color: colors.danger700, fontSize: 13 },
  primaryBtn: {
    backgroundColor: colors.brand600,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: colors.white, fontWeight: '600' },
});
