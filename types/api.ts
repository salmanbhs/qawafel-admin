export type TravelAgencyStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type OfferStatus = "PENDING" | "APPROVED" | "REJECTED" | "ACTIVE" | "ARCHIVED";
export type DestinationStatus = "PENDING" | "ACTIVE" | "ARCHIVED";
export type HotelStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface TravelAgency {
  id: string;
  userId: string;
  nameAr?: string;
  nameEn?: string;
  name?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  description?: string;
  contactEmail?: string;
  status: TravelAgencyStatus;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Hotel {
  id: string;
  travelAgencyId: string;
  destinationId?: string;
  nameAr?: string;
  nameEn?: string;
  name?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  description?: string;
  starRating?: number;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  amenities?: string;
  status: HotelStatus;
  createdAt: string;
  updatedAt: string;
  travelAgency?: TravelAgency;
  destination?: Destination;
}

export interface Offer {
  id: string;
  travelAgencyId: string;
  imageUrl?: string;
  nameAr?: string;
  nameEn?: string;
  name?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  description?: string;
  bedCount?: number;
  checkInDate?: string;
  checkOutDate?: string;
  price?: number;
  maxGuests?: number;
  currency: string;
  status: OfferStatus;
  isFeatured: boolean;
  dataSource?: string;
  lastImageUploadedAt?: string;
  imageCount?: number;
  createdAt: string;
  updatedAt: string;
  travelAgency?: TravelAgency;
  hotels?: { hotel: Hotel }[];
  destinations?: { destination: Destination }[];
}

export interface Destination {
  id: string;
  nameAr?: string;
  nameEn?: string;
  name?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  description?: string;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  status: DestinationStatus;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContactLog {
  id: string;
  offerId?: string;
  senderName?: string;
  senderEmail?: string;
  senderPhone?: string;
  phone?: string;
  email?: string;
  message?: string;
  status: string;
  source?: string;
  createdAt: string;
  offer?: {
    id: string;
    name?: string;
    nameAr?: string;
    nameEn?: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total?: number;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  skip?: number;
  take?: number;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  travelAgencyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail?: string;
  action: string;
  entityType: string;
  entityId?: string;
  resourceType?: string;
  resourceId?: string;
  details?: string | Record<string, unknown>;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface OfferImage {
  id: string;
  offerId: string;
  supabaseStoragePath: string;
  imageUrl: string;
  originalFilename?: string;
  extractedData?: ExtractedData;
  confirmedData?: Record<string, unknown>;
  confirmationStatus: string;
  extractionStatus: string;
  ocrLanguage?: string;
  ocrConfidence?: number;
  averageConfidence?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedField {
  value: unknown;
  confidence: number;
  source?: string;
  format?: string;
  stars?: number;
  country?: string;
  nightCount?: number;
  currency?: string;
}

export interface ExtractedData {
  price?: ExtractedField;
  checkInDate?: ExtractedField;
  checkOutDate?: ExtractedField;
  hotelName?: ExtractedField;
  destination?: ExtractedField;
  maxGuests?: ExtractedField;
}

export interface ImageUploadResponse {
  imageId: string;
  supabaseStoragePath: string;
  imageUrl: string;
  extractedData: ExtractedData;
  rawOcrText: string;
  ocrLanguage: string;
  ocrConfidence: number;
  confidenceRating: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
  averageConfidence: number;
}

export interface PreUploadResponse {
  imageUrl: string;
  originalSize: number;
  optimizedSize: number;
}

export interface CreateOfferPayload {
  travelAgencyId: string;
  hotelIds?: string[];
  destinationIds?: string[];
  imageUrl?: string;
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  price?: number;
  currency?: string;
  bedCount?: number;
  maxGuests?: number;
  checkInDate?: string;
  checkOutDate?: string;
  status?: OfferStatus;
}

export interface UpdateOfferPayload extends Partial<Omit<CreateOfferPayload, 'travelAgencyId'>> {}
