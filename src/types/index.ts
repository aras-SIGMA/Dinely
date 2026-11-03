export type { HostInfo } from '@/lib/tenant-resolver';

export type UserRole = 'owner' | 'platform_admin';

export type TenantStatus = 'pending' | 'active' | 'trial' | 'suspended' | 'expired';

export type PackageTier = 'mikro' | 'kecil' | 'menengah';

export type OrderStatus = 'baru' | 'diproses' | 'selesai' | 'dibatalkan';

export type BillingCycle = 'trial' | 'monthly' | '6_months' | 'yearly';

export type TransactionStatus =
  | 'pending'
  | 'settlement'
  | 'capture'
  | 'deny'
  | 'cancel'
  | 'expire'
  | 'failure';

export type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  created_at: string;
};

export type Package = {
  id: string;
  name: string;
  tier: PackageTier;
  price_monthly: number;
  price_6_months: number;
  price_yearly: number;
  trial_days: number;
  feature_flags: Record<string, boolean>;
  is_active: boolean;
  created_at: string;
};

export type Tenant = {
  id: string;
  owner_id: string;
  business_name: string;
  subdomain: string;
  logo_url: string | null;
  description: string | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  address: string | null;
  primary_color: string;
  status: TenantStatus;
  current_package_id: string | null;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicTenant = Pick<
  Tenant,
  | 'id'
  | 'business_name'
  | 'subdomain'
  | 'logo_url'
  | 'description'
  | 'contact_phone'
  | 'contact_whatsapp'
  | 'address'
  | 'primary_color'
  | 'status'
>;

export type Transaction = {
  id: string;
  tenant_id: string;
  package_id: string;
  billing_cycle: BillingCycle;
  amount: number;
  midtrans_order_id: string;
  midtrans_transaction_id: string | null;
  status: TransactionStatus;
  raw_notification: Record<string, any> | null;
  settled_at: string | null;
  created_at: string;
};

export type Category = {
  id: string;
  tenant_id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

export type MenuItem = {
  id: string;
  tenant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  tenant_id: string;
  order_code: string;
  buyer_name: string;
  buyer_contact: string | null;
  note: string | null;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  menu_item_name_snapshot: string;
  price_snapshot: number;
  quantity: number;
  subtotal: number;
};

export type GuestOrderItemPayload = {
  menu_item_id: string;
  quantity: number;
};

export type CreateGuestOrderPayload = {
  p_tenant_id: string;
  p_buyer_name: string;
  p_buyer_contact?: string | null;
  p_note?: string | null;
  p_items: GuestOrderItemPayload[];
};

export type CreateGuestOrderResult = {
  success: boolean;
  order_id: string;
  order_code: string;
  total_amount: number;
  status: OrderStatus;
};

export type GuestOrderStatusItem = {
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
};

export type GetGuestOrderStatusResult = {
  success: boolean;
  order_id?: string;
  order_code?: string;
  buyer_name?: string;
  buyer_contact_masked?: string | null;
  status?: OrderStatus;
  total_amount?: number;
  note?: string | null;
  created_at?: string;
  items?: GuestOrderStatusItem[];
  message?: string;
};

export type SnapResult = {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string;
  fraud_status?: string;
  pdf_url?: string;
  finish_redirect_url?: string;
};

export type SnapCallbacks = {
  onSuccess?: (result: SnapResult) => void;
  onPending?: (result: SnapResult) => void;
  onError?: (result: SnapResult) => void;
  onClose?: () => void;
};

export type SnapPayOptions = SnapCallbacks & {
  skipOrderSummary?: boolean;
};

export type CreateSubscriptionResponse = {
  token: string;
  redirect_url?: string;
  order_id: string;
  amount: number;
};

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options?: SnapPayOptions) => void;
      embed?: (token: string, options?: { embedId: string } & SnapPayOptions) => void;
    };
  }
}

