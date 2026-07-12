import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getToken } from './storage';

/**
 * `GET /orders/:id/invoice` streams a raw PDF — a plain `<a href>` download
 * doesn't exist on mobile and wouldn't carry the Bearer token anyway, so we
 * download-to-disk with an explicit auth header then hand off to the OS
 * share sheet (01-DOCUMENTATION.md §9/`downloadBlob.js` reasoning, ported).
 *
 * Uses `expo-file-system/legacy`: SDK 54 replaced the primary file-system API
 * with a `File`/`Directory` class model that has no simple authenticated
 * download helper, but the legacy compatibility module (still shipped and
 * supported) keeps the `downloadAsync({ headers })` shape this needs.
 */
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export async function downloadInvoice(orderId: string): Promise<void> {
  const token = await getToken();
  const fileUri = `${FileSystem.documentDirectory}invoice-${orderId}.pdf`;

  const result = await FileSystem.downloadAsync(`${API_URL}/orders/${orderId}/invoice`, fileUri, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (result.status !== 200) {
    throw new Error('Failed to download invoice.');
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', dialogTitle: 'Invoice' });
}
