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

export interface Message {
  senderId: string;
  text: string;
  type: "text" | "system";
  createdAt: string;
}

export interface Conversation {
  _id: string;
  requestId: RentalRequest | string;
  listingId: Listing | string;
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
}
