/**
 * Ground truth from the actual `Order.js` model/`orderController.js` — the
 * status enum, `paymentMethod`/`paymentStatus` values, and `trackingId`/
 * `statusHistory` fields are all confirmed against the real backend, not
 * just `01-DOCUMENTATION.md` (which omits `trackingId`/`statusHistory`).
 */
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PACKED'
  | 'PICKED'
  | 'SHIPPED'
  | 'ARRIVED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentMethod = 'ESEWA' | 'KHALTI' | 'COD' | 'MANUAL';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

/** Denormalized snapshot — no product images/slug, unlike the cart's populated variant. */
export interface OrderItem {
  variantId: string;
  productName: string;
  size: string;
  color: string;
  unitPrice: number;
  quantity: number;
}

/** Same field names as the Address model, minus `_id`/`userId`/`label`/`isDefault`. */
export interface OrderAddressSnapshot {
  recipientName: string;
  phone: string;
  country: string;
  province?: string;
  district?: string;
  city?: string;
  branchName?: string;
  postalCode?: string;
  area?: string;
  street?: string;
  landmark?: string;
}

export interface OrderStatusHistoryEntry {
  status: OrderStatus;
  occurredAt: string;
}

export interface Order {
  _id: string;
  userId: string;
  trackingId?: string;
  address: OrderAddressSnapshot;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  statusHistory: OrderStatusHistoryEntry[];
  deliveredAt?: string;
  createdAt: string;
}
