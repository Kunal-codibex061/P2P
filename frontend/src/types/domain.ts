export type KycStatus = "not_started" | "pending" | "verified" | "failed";

export type RequestStatus =
  | "requested"
  | "chatting"
  | "accepted"
  | "rejected"
  | "confirmed"
  | "active"
  | "return_pending"
  | "completed"
  | "disputed"
  | "cancelled";

export type ItemRequestStatus =
  | "open"
  | "responded"
  | "chatting"
  | "accepted"
  | "confirmed"
  | "active"
  | "completed"
  | "cancelled"
  | "expired"
  | "requested"
  | "rejected";

export type RequestKind = "listing_request" | "open_request";

export interface User {
  _id: string;
  name: string;
  phone: string;
  email: string;
  profilePhoto: string;
  city: string;
  locality: string;
  kycStatus: KycStatus;
  lenderRating: number;
  renterRating: number;
  isPhoneVerified: boolean;
  roleTags: string[];
  createdAt?: string;
}

export interface Listing {
  _id: string;
  ownerId: User | string;
  title: string;
  category: string;
  subcategory: string;
  description: string;
  photos: string[];
  condition: string;
  replacementValue: number;
  rentPrice: number;
  rentUnit: "day" | "week" | "month";
  pricingOptions?: Array<{
    unit: "day" | "week" | "month";
    price: number;
  }>;
  depositAmount: number;
  locality: string;
  city: string;
  availabilityStatus: "available" | "unavailable" | "rented";
  deliveryAvailable: boolean;
  rules: string[];
  accessories: string[];
  isVerifiedOwner: boolean;
  moderationStatus: "approved" | "pending" | "rejected";
  specifications?: Record<string, string | number>;
  createdAt?: string;
}

export interface RentalRequest {
  _id: string;
  listingId: Listing | string;
  renterId: User | string;
  lenderId: User | string;
  startDate: string;
  endDate: string;
  message: string;
  purpose: string;
  pickupPreference: "pickup" | "delivery";
  status: RequestStatus;
  quotedRent: number;
  depositAmount: number;
  createdAt: string;
  expiresAt: string;
}

export interface OpenRequestResponse {
  _id: string;
  itemRequestId: ItemRequest | string;
  lenderId: User | string;
  listingId?: Listing | string | null;
  message: string;
  proposedRent: number;
  proposedDeposit: number;
  status: "sent" | "accepted" | "rejected" | "chatting";
  createdAt: string;
  updatedAt: string;
}

export interface ItemRequest {
  _id: string;
  sourceRequestId?: string;
  requesterId: User | string;
  lenderId?: User | string | null;
  listingId?: Listing | string | null;
  type: RequestKind;
  title: string;
  category: string;
  subcategory?: string;
  purpose: string;
  startDate: string;
  endDate: string;
  budgetAmount: number;
  budgetUnit: "day" | "week" | "month" | "total";
  depositPreference: "none" | "upto_1000" | "upto_5000" | "flexible";
  pickupDeliveryPreference: "pickup" | "delivery" | "either";
  pickupPreference?: "pickup" | "delivery" | "either";
  city: string;
  locality: string;
  radiusKm: 2 | 5 | 10 | 999;
  message: string;
  urgency: "today" | "this_week" | "flexible";
  kycWillingness: boolean;
  referenceImageUrl?: string;
  status: ItemRequestStatus;
  responseCount: number;
  conversationCount?: number;
  primaryConversationId?: string | null;
  quotedRent?: number;
  depositAmount?: number;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;
}

export interface Message {
  senderId: string;
  text: string;
  type: "text" | "system";
  createdAt: string;
}

export interface Conversation {
  _id: string;
  requestId?: RentalRequest | string | null;
  itemRequestId?: ItemRequest | string | null;
  listingId?: Listing | string | null;
  renterId: User | string;
  lenderId: User | string;
  messages: Message[];
  updatedAt: string;
}

export interface Category {
  key: string;
  label: string;
  icon: string;
  subcategories: string[];
  filterSpecs?: string[];
}

export interface FacetOption {
  value: string;
  count: number;
}

export interface ListingFacets {
  priceRange: { min: number; max: number } | null;
  subcategories: FacetOption[];
  conditions: FacetOption[];
  cities: FacetOption[];
  localities: FacetOption[];
  rentUnits: FacetOption[];
  specifications: Record<string, FacetOption[]>;
}
