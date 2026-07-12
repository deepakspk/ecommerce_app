/** Ground truth from the actual `ReturnRequest.js` model/`returnController.js`. */
export type ReturnRequestStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PICKED_UP' | 'REFUNDED';

/** Statuses the server treats as "already in progress" — blocks filing a new request (409). */
export const ACTIVE_RETURN_STATUSES: ReturnRequestStatus[] = ['REQUESTED', 'APPROVED', 'PICKED_UP'];

export interface ReturnRequestItem {
  variantId: string;
  quantity: number;
  reason: string;
}

export interface ReturnRequest {
  _id: string;
  orderId: string;
  userId: string;
  items: ReturnRequestItem[];
  status: ReturnRequestStatus;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}
