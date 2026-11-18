export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  fallbackReply?: string;
  sessionId?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
}

export interface OpeningHours {
  lunes_viernes: string;
  sabado: string;
  domingo: string;
}

export interface SocialLinks {
  instagram?: string;
  tiktok?: string;
  youtube?: string;
}

export interface BusinessInfo {
  id: number;
  brandName: string;
  slogan: string;
  shortAbout: string;
  fullHistory: string;
  address: string;
  city: string;
  phone: string;
  whatsapp: string | null;
  email: string;
  latitude: number | null;
  longitude: number | null;
  openingHours: OpeningHours;
  socialLinks: SocialLinks;
}

export interface MediaAsset {
  id: number;
  assetType: 'video_hero' | 'gallery_store' | 'section_banner';
  sectionKey: 'inicio' | 'nosotros' | 'servicios' | 'especialidades' | 'precios';
  title: string;
  caption: string | null;
  mediaUrl: string;
  posterUrl: string | null;
  pexelsId: string | null;
  pexelsSourceUrl: string | null;
  pexelsAuthor: string | null;
  displayOrder: number;
}

export interface HistoryMilestone {
  id: number;
  year: number;
  title: string;
  description: string;
  imageUrl: string | null;
  displayOrder: number;
}

export interface CafeService {
  id: number;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  iconName: string;
  imageUrl: string | null;
  availabilityNote: string | null;
  startingPrice: number | null;
  requiresReservation: boolean;
  isFeatured: boolean;
  displayOrder: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  categoryGroup: 'bebidas_calientes' | 'bebidas_frias' | 'pasteleria' | 'granos' | 'salados';
  displayOrder: number;
}

export interface ProductVariant {
  id: number;
  productId: number;
  label: string;
  price: number;
  promoPrice: number | null;
  currency: string;
  displayOrder: number;
}

export type RoastLevel = 'ligero' | 'medio' | 'medio_oscuro' | 'oscuro' | 'no_aplica';

export interface Product {
  id: number;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  categoryGroup: string;
  name: string;
  slug: string;
  description: string;
  tastingNotes: string | null;
  origin: string | null;
  roastLevel: RoastLevel;
  brewMethod: string | null;
  imageUrl: string | null;
  dietaryTags: string[];
  isSpecialty: boolean;
  isFeatured: boolean;
  displayOrder: number;
  startingPrice: number | null;
  currency: string;
  variants: ProductVariant[];
}

export interface ComboPackage {
  id: number;
  name: string;
  badge: string | null;
  description: string;
  itemsIncluded: string[];
  price: number;
  currency: string;
  displayOrder: number;
}

export interface HomeData {
  heroVideo: MediaAsset | null;
  business: BusinessInfo;
  featuredServices: CafeService[];
  featuredSpecialties: Product[];
}

export interface SpecialtiesData {
  categories: Category[];
  items: Product[];
}

export interface AboutData {
  business: BusinessInfo;
  milestones: HistoryMilestone[];
  gallery: MediaAsset[];
}

export interface CategoryWithProducts extends Category {
  items: Product[];
}

export interface PricesData {
  categories: CategoryWithProducts[];
  combos: ComboPackage[];
}

export type InquiryType =
  | 'consulta_general'
  | 'reserva'
  | 'catering_eventos'
  | 'mayorista'
  | 'sugerencia';

export interface ContactPayload {
  full_name: string;
  email: string;
  phone?: string | null;
  inquiry_type: InquiryType;
  subject?: string | null;
  message: string;
}

export interface ContactSubmissionResult {
  id: number;
  status: string;
  createdAt: string;
  message: string;
}

export interface ChatMessageItem {
  id?: number;
  sessionId?: string;
  role: 'user' | 'assistant';
  content: string;
  latencyMs?: number | null;
  createdAt?: string;
  isFallback?: boolean;
}

export interface ChatMessageResponse {
  sessionId: string;
  model: string;
  reply: string;
  latencyMs: number;
  timestamp: string;
}

export interface ChatHistoryResponse {
  sessionId: string;
  messages: ChatMessageItem[];
}
