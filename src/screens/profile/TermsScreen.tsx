import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { colors, spacing, typography } from '@/theme';

/**
 * Static legal content — there's no `/terms` API endpoint (01-DOCUMENTATION.md
 * §4 has none), so this is fixed copy using whatever `CompanySettingsContext`
 * has for contact details. The actual legal text is a business/legal
 * deliverable outside this build's scope (mirrors Prompt 12's stance on
 * icon/store-listing assets) — flagged here rather than invented wholesale.
 */
export function TermsScreen() {
  const { company } = useCompanySettings();
  const name = company.companyName ?? 'this store';

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Text style={typography.h1}>Terms & Legal</Text>

      <View style={styles.section}>
        <Text style={typography.h2}>Terms of Service</Text>
        <Text style={typography.body}>
          By placing an order with {name}, you agree to pay the listed price for the items in your cart plus any
          applicable delivery fee. Orders are confirmed once payment is verified (or immediately for Cash on Delivery)
          and may be cancelled before they are packed for shipping.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={typography.h2}>Privacy Policy</Text>
        <Text style={typography.body}>
          We collect the account, address, and order information needed to fulfill your purchases. We do not sell
          your personal data. Payment details for Khalti/eSewa are handled directly by those providers and are never
          stored on our servers.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={typography.h2}>Returns & Refunds</Text>
        <Text style={typography.body}>
          Delivered orders can be requested for return within the eligibility window shown on the order — submit a
          return request from Order Detail and we&apos;ll confirm next steps by email or phone.
        </Text>
      </View>

      {company.email || company.phone ? (
        <View style={styles.section}>
          <Text style={typography.h2}>Contact</Text>
          {company.email ? <Text style={typography.body}>{company.email}</Text> : null}
          {company.phone ? <Text style={typography.body}>{company.phone}</Text> : null}
          {company.address ? <Text style={typography.body}>{company.address}</Text> : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  section: { gap: spacing.xs },
});
