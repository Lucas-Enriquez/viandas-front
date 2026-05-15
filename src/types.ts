export type UUID = string;

export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  message: string;
  errors: ApiFieldError[] | null;
  meta?: Record<string, unknown> | null;
};

export type ApiFieldError = {
  field?: string | null;
  message: string;
};

export type UserRole = "COOK" | "EMPLOYEE" | "CUSTOMER";
export type MenuScope = "COMPANY" | "GLOBAL";
export type MenuStatus = "DRAFT" | "PUBLISHED";
export type MenuItemCategory = "PLATO" | "MINUTA" | "ENSALADA";
export type LocationSource = "MANUAL" | "GEOCODED";

export type AuthUserResponse = {
  email: string;
  id: UUID;
  name: string;
  role: UserRole;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUserResponse;
};

export type UserContextResponse = {
  user: AuthUserResponse;
  company: {
    id: UUID;
    name: string;
    slug: string;
  } | null;
};

export type AuthSession = AuthResponse & {
  context?: UserContextResponse | null;
};

export type Company = {
  address: string | null;
  id: UUID;
  latitude: number | null;
  locationSource: LocationSource | null;
  longitude: number | null;
  name: string;
  notes: string | null;
  slug: string;
  whatsappGroupLabel: string | null;
};

export type CompanyRequest = {
  address?: string | null;
  latitude?: number | null;
  locationSource?: LocationSource | null;
  longitude?: number | null;
  name: string;
  notes?: string | null;
  whatsappGroupLabel?: string | null;
};

export type MenuCompanyResponse = {
  id: UUID;
  name: string;
  slug: string;
};

export type MenuItemResponse = {
  availableCompanyIds: UUID[];
  category: MenuItemCategory;
  description: string | null;
  id: UUID;
  name: string;
  photoUrl: string | null;
  price: number;
  remainingStock: number | null;
};

export type MenuResponse = {
  companies: MenuCompanyResponse[];
  companyId: UUID | null;
  companyName: string | null;
  date: string;
  id: UUID;
  items: MenuItemResponse[];
  orderClosesAt: string;
  scope: MenuScope;
  status: MenuStatus;
};

export type PublicMenuResponse = {
  canOrder: boolean;
  companyName: string;
  companySlug: string;
  date: string;
  id: UUID;
  items: MenuItemResponse[];
  orderClosesAt: string;
};

export type OrderStatus =
  | "RECEIVED"
  | "PREPARING"
  | "OUT_FOR_DELIVERY"
  | "NEARBY"
  | "DELIVERED"
  | "CANCELLED";

export type DeliveryPublicSignal =
  | "OUT_FOR_DELIVERY"
  | "NEARBY"
  | "DELIVERED"
  | "UNKNOWN";

export type OrderItemResponse = {
  comment: string | null;
  menuItemId: UUID;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type OrderResponse = {
  companyId: UUID;
  createdAt: string;
  customerName: string;
  deliverySignal: DeliveryPublicSignal;
  id: UUID;
  items: OrderItemResponse[];
  menuId: UUID;
  status: OrderStatus;
  totalAmount: number;
};

export type CurrentOrderResponse = {
  canOrder: boolean;
  hasOrder: boolean;
  message: string;
  order: OrderResponse | null;
};

export type DeliverySessionStatus = "ACTIVE" | "FINISHED" | "EXPIRED";

export type DeliverySessionResponse = {
  companyId: UUID;
  expiresAt: string;
  finishedAt: string | null;
  id: UUID;
  lastLocationAt: string | null;
  menuId: UUID;
  publicSignal: DeliveryPublicSignal;
  startedAt: string;
  status: DeliverySessionStatus;
};

export type ActiveDeliverySession = {
  session: DeliverySessionResponse;
  startedAt: string;
  updatedAt: string;
};

export type ShareMessageResponse = {
  publicLinkId: UUID;
  publicUrl: string;
  whatsappText: string;
};

export type InvitationValidationResponse = {
  companyName: string;
  email: string;
  expiresAt: string;
};

export type GlobalInvitationPreviewResponse = {
  company: string;
  expiresAt: string;
  maxUses: number | null;
  usable: boolean;
  usedCount: number;
};

export type GlobalInvitationResponse = {
  token: string;
  company: string;
  expiresAt: string;
  link: string;
};

export type Product = {
  id: UUID;
  name: string;
  price: number;
  category: MenuItemCategory;
  photoUrl: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductRequest = {
  name: string;
  price: number;
  category: MenuItemCategory;
  photoPublicId?: string | null;
  description?: string | null;
};

export type UploadSignatureResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  uploadUrl: string;
};
