import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useThemeSettings } from '@/hooks/useThemeSettings';
import { cloudinaryUrl } from '@/utils/cloudinary';
import { resolveAssetUrl } from '@/utils/assetUrl';
import { colors, radius, spacing } from '@/theme';

const SOCIAL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  facebook: 'logo-facebook',
  instagram: 'logo-instagram',
  tiktok: 'logo-tiktok',
  linkedin: 'logo-linkedin',
  twitter: 'logo-twitter',
  youtube: 'logo-youtube',
  whatsapp: 'logo-whatsapp',
};

/** WhatsApp entries are often bare numbers, not URLs — normalize to wa.me (docs/PROMPT-home-screen.md §10). */
function socialUrl(key: string, value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  if (key === 'whatsapp') return `https://wa.me/${value.replace(/\D/g, '')}`;
  return value;
}

/**
 * "We Accept" chips are styled text rather than bundled logo images — the
 * repo has no payment-logo assets to bundle yet; swap in real logos when the
 * design assets land.
 */
const PAYMENT_CHIPS = [
  { label: 'Cash on Delivery', color: colors.gray900 },
  { label: 'eSewa', color: '#60bb46' },
  { label: 'Khalti', color: '#5c2d91' },
];

interface Props {
  onPressTerms: () => void;
}

/** Informational footer at the very end of the Home scroll (docs/PROMPT-home-screen.md §10). */
export function HomeFooter({ onPressTerms }: Props) {
  const { company } = useCompanySettings();
  const { colors: brand } = useThemeSettings();

  const socialEntries = Object.entries(company.social ?? {}).filter(
    ([key, value]) => !!value && key in SOCIAL_ICONS,
  ) as [string, string][];

  const contactRows = [
    company.phone ? { icon: 'call' as const, label: 'Call us', value: company.phone, url: `tel:${company.phone}` } : null,
    company.email ? { icon: 'mail' as const, label: 'Email us', value: company.email, url: `mailto:${company.email}` } : null,
  ].filter((row): row is NonNullable<typeof row> => row !== null);

  return (
    <View style={styles.container}>
      {company.logoUrl ? (
        <Image
          source={{ uri: cloudinaryUrl(resolveAssetUrl(company.logoUrl), 240) }}
          style={styles.logo}
          contentFit="contain"
        />
      ) : (
        <Text style={styles.companyName}>{company.companyName ?? 'Store'}</Text>
      )}
      {company.description ? (
        <Text style={styles.description} numberOfLines={3}>
          {company.description}
        </Text>
      ) : null}

      {contactRows.map((row) => (
        <Pressable key={row.label} style={styles.contactRow} onPress={() => Linking.openURL(row.url).catch(() => {})}>
          <View style={[styles.contactIcon, { backgroundColor: brand.brand600 }]}>
            <Ionicons name={row.icon} size={14} color={colors.white} />
          </View>
          <View>
            <Text style={styles.contactLabel}>{row.label}</Text>
            <Text style={styles.contactValue}>{row.value}</Text>
          </View>
        </Pressable>
      ))}

      {socialEntries.length > 0 ? (
        <View style={styles.socialRow}>
          {socialEntries.map(([key, value]) => (
            <Pressable
              key={key}
              style={[styles.socialBtn, { backgroundColor: brand.brand600 }]}
              onPress={() => Linking.openURL(socialUrl(key, value)).catch(() => {})}
            >
              <Ionicons name={SOCIAL_ICONS[key]} size={16} color={colors.white} />
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.acceptBlock}>
        <Text style={styles.acceptTitle}>We Accept</Text>
        <View style={styles.acceptRow}>
          {PAYMENT_CHIPS.map((chip) => (
            <View key={chip.label} style={styles.acceptChip}>
              <Text style={[styles.acceptChipText, { color: chip.color }]}>{chip.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.copyright}>
        © {new Date().getFullYear()} {company.companyName ?? 'Store'}. All rights reserved.
      </Text>
      <Pressable onPress={onPressTerms} hitSlop={8}>
        <Text style={[styles.termsLink, { color: brand.brand600 }]}>Terms &amp; Conditions</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray100,
    padding: 20,
    gap: spacing.md,
  },
  logo: { width: 120, height: 40, alignSelf: 'flex-start' },
  companyName: { fontSize: 18, fontWeight: '800', color: colors.gray900 },
  description: { fontSize: 12, color: colors.gray500, lineHeight: 18 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  contactIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: { fontSize: 11, color: colors.gray500 },
  contactValue: { fontSize: 13, fontWeight: '600', color: colors.gray900 },
  socialRow: { flexDirection: 'row', gap: spacing.sm },
  socialBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBlock: { gap: spacing.sm },
  acceptTitle: { fontSize: 13, fontWeight: '700', color: colors.gray900 },
  acceptRow: { flexDirection: 'row', gap: spacing.sm },
  acceptChip: {
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  acceptChipText: { fontSize: 12, fontWeight: '700' },
  copyright: { fontSize: 11, color: colors.gray500, textAlign: 'center', marginTop: spacing.sm },
  termsLink: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
