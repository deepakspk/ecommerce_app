import * as SecureStore from 'expo-secure-store';

/**
 * JWT storage — expo-secure-store (OS keychain/keystore), never AsyncStorage.
 * Deliberate deviation from the web app's localStorage: the backend JWT is
 * long-lived (7 days default) with no refresh/revocation beyond an account-
 * disabled check, so it must sit somewhere more protected than plain storage
 * (01-DOCUMENTATION.md §12, §9; see also the "Fixed technical decisions" table
 * in 02-REACT-NATIVE-PROMPTS.md). All access is async, unlike the web app's
 * synchronous localStorage read — every caller must await it.
 */
const TOKEN_KEY = 'ecommerce_token';

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
