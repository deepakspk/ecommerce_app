/** Mirrors the backend's Address model exactly — no `id`/`_id` divergence here, unlike categories (01-DOCUMENTATION.md §5). */
export interface Address {
  _id: string;
  label?: string;
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
  isDefault: boolean;
  createdAt?: string;
}

export type AddressInput = Omit<Address, '_id' | 'isDefault' | 'createdAt'> & { isDefault?: boolean };
