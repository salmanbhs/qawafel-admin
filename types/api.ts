export type TravelAgencyStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type PackageStatus = "ACTIVE" | "INACTIVE";
export type OfferStatus = "PENDING" | "ACTIVE" | "ARCHIVED";
export type DestinationStatus = "PENDING" | "ACTIVE" | "ARCHIVED";
export type HotelStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type RoomType = "SINGLE" | "TWIN" | "TRIPLE" | "QUAD" | "FAMILY";
export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "TEA" | "WATER";
export type MealServiceType = "PARCEL" | "BUFFET";
export type TransportType = "BUS" | "CAR" | "FLY" | "TRAIN";

export interface TravelAgency {
  id: string;
  userId: string;
  nameAr?: string;
  nameEn?: string;
  name?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  description?: string;
  contactEmail?: string | null;
  officeNumbers?: string[];
  whatsappNumbers?: string[];
  instagramAccount?: string;
  iconImageUrl?: string;
  bannerImageUrl?: string;
  status: TravelAgencyStatus;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;  packages?: PackageDestination[];}

export interface RoomOption {
  id?: string;
  offerId?: string;
  roomType?: RoomType | null;
  roomTypeAr?: string;
  roomTypeEn?: string;
  price: number;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Meal {
  id?: string;
  offerId?: string;
  mealType: MealType;
  serviceType?: MealServiceType | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Transport {
  id?: string;
  offerId?: string;
  transportType: TransportType;
  fromLocation: string;
  toLocation: string;
  isDirectFlight?: boolean | null;
  carType?: string | null;
  order: number;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface OfferDestination {
  offerId?: string;
  destinationId: string;
  numberOfNights: number;
  sequenceOrder: number;
  destination: Destination;
}

export interface Hotel {
  id: string;
  travelAgencyId: string;
  destinationId: string;
  nameAr?: string;
  nameEn?: string;
  name?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  description?: string;
  starRating?: number;
  address?: string;
  googleMapUrl?: string;
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
  checkInDate?: string;
  checkOutDate?: string;
  numberOfDays?: number;
  currency: string;
  status: OfferStatus;
  isFeatured: boolean;
  includesIslamicProgram?: boolean;
  islamicAdvisor?: string;
  includesVisa?: boolean;
  includesInsurance?: boolean;
  dataSource?: string;
  lastImageUploadedAt?: string;
  imageCount?: number;
  displayPrice?: number;
  createdAt: string;
  updatedAt: string;
  travelAgency?: TravelAgency;
  hotels?: { offerId?: string; hotelId?: string; hotel: Hotel }[];
  destinations?: OfferDestination[];
  roomOptions?: RoomOption[];
  meals?: Meal[];
  transports?: Transport[];
}

export interface PackageDestination {
  packageId: string;
  destinationId: string;
  destination: Destination;
}

export interface Destination {
  id: string;
  nameAr?: string;
  nameEn?: string;
  name?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  description?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  iconImageUrl?: string;
  bannerImageUrl?: string;
  status: DestinationStatus;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  packages?: PackageDestination[];
}

export interface Package {
  id: string;
  nameAr?: string;
  nameEn?: string;
  name?: string;
  iconImageUrl?: string;
  bannerImageUrl?: string;
  status: PackageStatus;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  destinations?: PackageDestination[];
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
  userId?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  changes?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  method?: string | null;
  path?: string | null;
  statusCode?: number | null;
  duration?: number | null;
  requestBody?: Record<string, unknown> | null;
  queryParams?: Record<string, unknown> | null;
  errorMessage?: string | null;
  errorCode?: string | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    fullName?: string | null;
    role: string;
  } | null;
  // legacy fields
  adminId?: string;
  adminEmail?: string;
  entityType?: string;
  entityId?: string;
  details?: string | Record<string, unknown>;
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
  storagePath?: string;
  extractedText?: string;
  parsedOffer?: {
    // ✅ Dates (smart calculation)
    startDate?: string;
    endDate?: string;
    durationDays?: number;
    
    // ✅ Pricing
    price?: number;
    
    // ✅ Inclusions
    visaIncluded?: boolean;
    includesInsurance?: boolean;
    includesIslamicProgram?: boolean;
    islamicAdvisor?: string | null;
    
    // ✅ Room Type & Room Options
    roomType?: "SINGLE" |"TWIN" | "TRIPLE" | "QUAD" | "FAMILY";
    roomTypeOptions?: Array<{
      roomType: "SINGLE" |"TWIN" | "TRIPLE" | "QUAD" | "FAMILY";
      price: number;
      nights?: number;
    }>;
    
    // ✅ Meals (structured array)
    meals?: Array<{
      mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "TEA" | "WATER";
      serviceType?: "BUFFET" | "PARCEL";
    }>;
    
    // ✅ Transports (structured array)
    transports?: Array<{
      transportType: "BUS" | "CAR" | "FLY" | "TRAIN";
      fromLocation: string;
      toLocation: string;
      isDirectFlight?: boolean;
      carType?: string;
      order: number;
      notes?: string;
    }>;
    
    // ✅ Destinations (with enrichment)
    destinationNames?: string[];
    destinationIds?: string[];
    destinationNightBreakdown?: Array<{
      destinationName: string;
      nights: number;
      destinationId: string;
    }>;
    destinations?: Array<{
      destinationId: string;
      numberOfNights: number;
      sequenceOrder: number;
    }>;
    
    // ✅ Hotels (with enrichment)
    hotelNames?: string[];
    hotelIds?: string[];
    
    // ✅ Travel Agency (with enrichment)
    travelAgencyName?: string;
    travelAgencyId?: string;
  };
}

export type OfferDestinationInput = {
  destinationId: string;
  numberOfNights: number;
  sequenceOrder: number;
};

export type MealInput = Pick<Meal, 'mealType' | 'serviceType'>;
export type TransportInput = Omit<Transport, 'id' | 'offerId' | 'createdAt' | 'updatedAt'>;
export type RoomOptionInput = Omit<RoomOption, 'id' | 'offerId' | 'totalPrice' | 'createdAt' | 'updatedAt'>;

export interface CreateOfferPayload {
  travelAgencyId: string;
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  imageUrl?: string;
  checkInDate?: string;
  checkOutDate?: string;
  numberOfDays?: number;
  status?: OfferStatus;
  includesIslamicProgram?: boolean;
  islamicAdvisor?: string;
  includesVisa?: boolean;
  includesInsurance?: boolean;
  hotelIds?: string[];
  destinations?: OfferDestinationInput[];
  roomOptions: RoomOptionInput[];
  meals?: MealInput[];
  transports?: TransportInput[];
}

export interface UpdateOfferPayload {
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  imageUrl?: string;
  checkInDate?: string;
  checkOutDate?: string;
  numberOfDays?: number;
  status?: OfferStatus;
  includesIslamicProgram?: boolean;
  islamicAdvisor?: string;
  includesVisa?: boolean;
  includesInsurance?: boolean;
  hotelIds?: string[];
  destinations?: OfferDestinationInput[];
  roomOptions?: RoomOptionInput[];
  meals?: MealInput[];
  transports?: TransportInput[];
}

export interface AgencyImageUploadResponse {
  iconImageUrl?: string;
  bannerImageUrl?: string;
}

export interface DestinationImageUploadResponse {
  iconImageUrl?: string;
  bannerImageUrl?: string;
}

export interface PackageImageUploadResponse {
  iconImageUrl?: string;
  bannerImageUrl?: string;
}
