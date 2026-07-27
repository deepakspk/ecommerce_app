import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
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

/** Same "Cash on Delivery" glyph the web app's footer uses (client/public/payments/cod.svg) — Material Symbols "payments" (Apache-2.0). */
const COD_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 64" role="img" aria-label="Cash on Delivery">
  <g transform="translate(4,56) scale(0.05)" fill="#C62828">
    <path d="M560-440q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35ZM280-320q-33 0-56.5-23.5T200-400v-320q0-33 23.5-56.5T280-800h560q33 0 56.5 23.5T920-720v320q0 33-23.5 56.5T840-320H280Zm80-80h400q0-33 23.5-56.5T840-480v-160q-33 0-56.5-23.5T760-720H360q0 33-23.5 56.5T280-640v160q33 0 56.5 23.5T360-400Zm440 240H120q-33 0-56.5-23.5T40-240v-440h80v440h680v80ZM280-400v-320 320Z"/>
  </g>
  <text x="58" y="30" font-family="Arial Black, Arial, Helvetica, sans-serif" font-weight="900" font-size="26" letter-spacing="2" fill="#C62828">COD</text>
  <rect x="58" y="38" width="124" height="16" rx="3" fill="#C62828"/>
  <text x="120" y="49.5" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="8" letter-spacing="1" fill="#ffffff" textLength="112" lengthAdjust="spacingAndGlyphs">CASH ON DELIVERY</text>
</svg>`;

/** Real payment-provider logos, matching the web app's footer (client/public/payments/) — each sized to its own aspect ratio so differently proportioned logos look balanced. */
const PAYMENT_LOGOS = [
  { key: 'cod', label: 'Cash on Delivery', width: 107, height: 36 },
  { key: 'esewa', label: 'eSewa', width: 85, height: 24 },
  { key: 'khalti', label: 'Khalti', width: 77, height: 32 },
] as const;

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
    company.phone
      ? {
          icon: 'call' as const,
          label: 'Call us',
          value: company.phone,
          url: `tel:${company.phone}`,
        }
      : null,
    company.email
      ? {
          icon: 'mail' as const,
          label: 'Email us',
          value: company.email,
          url: `mailto:${company.email}`,
        }
      : null,
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
        <Pressable
          key={row.label}
          style={styles.contactRow}
          onPress={() => Linking.openURL(row.url).catch(() => {})}
        >
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
        <View style={styles.socialBlock}>
          <Text style={styles.socialTitle}>Find us on social media</Text>
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
        </View>
      ) : null}

      <View style={styles.acceptBlock}>
        <Text style={styles.acceptTitle}>We Accept</Text>
        <View style={styles.acceptRow}>
          {PAYMENT_LOGOS.map((logo) => (
            <View key={logo.key} style={styles.acceptChip}>
              {logo.key === 'cod' ? (
                <SvgXml xml={COD_LOGO_SVG} width={logo.width} height={logo.height} />
              ) : (
                <Image
                  source={
                    logo.key === 'esewa'
                      ? require('../../../assets/payments/esewa.png')
                      : require('../../../assets/payments/khalti.png')
                  }
                  style={{ width: logo.width, height: logo.height }}
                  contentFit="contain"
                  accessibilityLabel={logo.label}
                />
              )}
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
  logo: { width: 240, height: 80, alignSelf: 'flex-start' },
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
  socialBlock: { gap: spacing.sm },
  socialTitle: { fontSize: 13, fontWeight: '700', color: colors.gray900 },
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
    height: 48,
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyright: { fontSize: 11, color: colors.gray500, textAlign: 'center', marginTop: spacing.sm },
  termsLink: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
