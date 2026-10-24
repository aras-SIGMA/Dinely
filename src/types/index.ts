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
  status: TenantStatus;
  current_package_id: string | null;
  primary_color: string;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  created_at: string;
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
