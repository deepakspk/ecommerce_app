import { Order } from './order';

export interface KhaltiInitiateResponse {
  paymentUrl: string;
  pidx: string;
}

/**
 * Exact keys eSewa's own API expects, confirmed against the real
 * `paymentController.js` (snake_case — do not camelCase these when
 * building the auto-submit HTML form).
 */
export interface EsewaFields {
  amount: string | number;
  tax_amount: string | number;
  total_amount: string | number;
  transaction_uuid: string;
  product_code: string;
  product_service_charge: string | number;
  product_delivery_charge: string | number;
  success_url: string;
  failure_url: string;
  signed_field_names: string;
  signature: string;
}

export interface EsewaInitiateResponse {
  formUrl: string;
  fields: EsewaFields;
}

/** `status` is the gateway's own raw string, not one of our `PaymentStatus` enum values — map it for display only. */
export interface PaymentVerifyResponse {
  status: string;
  order: Order;
}
