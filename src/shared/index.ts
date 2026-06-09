import { z } from 'zod';

// ─── Auth ────────────────────────────────────────────────────────────────────

export const RequestCodeSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const VerifyCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(6),
});

export type RequestCodeInput = z.infer<typeof RequestCodeSchema>;
export type VerifyCodeInput = z.infer<typeof VerifyCodeSchema>;

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

// ─── CouplePage ──────────────────────────────────────────────────────────────

export const PagePrivacy = z.enum(['public', 'private']);
export const PageStatus = z.enum(['draft', 'pending_payment', 'paid', 'published', 'archived']);

export type PagePrivacy = z.infer<typeof PagePrivacy>;
export type PageStatus = z.infer<typeof PageStatus>;

export const CreatePageSchema = z.object({
  title: z.string().min(1).max(120),
  slug: z
    .string()
    .min(3)
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Slug deve ter apenas letras minúsculas, números e hífens'),
  personOneName: z.string().min(1).max(60),
  personTwoName: z.string().min(1).max(60),
  startDate: z.string().datetime(),
  mainText: z.string().max(600).optional(),
  storyJson: z.string().optional(),
  templateId: z.string().optional(),
  themeConfigJson: z.string().optional(),
  privacy: PagePrivacy.default('private'),
});

export const UpdatePageSchema = CreatePageSchema.partial();

export type CreatePageInput = z.infer<typeof CreatePageSchema>;
export type UpdatePageInput = z.infer<typeof UpdatePageSchema>;

export interface PageAsset {
  id: string;
  pageId: string;
  type: string;
  url: string;
  alt: string | null;
  position: number;
  createdAt: string;
}

export interface CouplePage {
  id: string;
  userId: string;
  title: string;
  slug: string;
  personOneName: string;
  personTwoName: string;
  startDate: string;
  mainText: string | null;
  storyJson: string | null;
  templateId: string | null;
  themeConfigJson: string | null;
  privacy: PagePrivacy;
  status: PageStatus;
  publicUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assets?: PageAsset[];
}

// ─── Template ─────────────────────────────────────────────────────────────────

export interface Template {
  id: string;
  key: string;
  name: string;
  description: string | null;
  previewImage: string | null;
  configJson: string | null;
  isActive: boolean;
}

// ─── Order ────────────────────────────────────────────────────────────────────

export const OrderStatus = z.enum(['pending', 'paid', 'failed', 'expired', 'refunded']);
export type OrderStatus = z.infer<typeof OrderStatus>;

export interface Order {
  id: string;
  userId: string;
  pageId: string;
  plan: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  stripeCustomerId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Checkout ─────────────────────────────────────────────────────────────────

export const CreateCheckoutSessionSchema = z.object({
  pageId: z.string(),
  plan: z.enum(['sempre', 'eterno']),
  includeOrderBump: z.boolean().default(false),
});

export type CreateCheckoutSessionInput = z.infer<typeof CreateCheckoutSessionSchema>;

export interface CheckoutSessionResponse {
  url: string;
  sessionId: string;
}

export interface CheckoutStatusResponse {
  status: OrderStatus;
  publicUrl: string | null;
  publishedAt: string | null;
}

// ─── API responses ────────────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  data: T;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

// ─── Umami events ─────────────────────────────────────────────────────────────

export type UmamiEventName =
  // Landing
  | 'landing_view'
  | 'hero_cta_click'
  | 'secondary_cta_click'
  | 'pricing_view'
  | 'pricing_cta_click'
  | 'faq_open'
  | 'example_click'
  // Auth
  | 'auth_email_submit'
  | 'auth_code_sent'
  | 'auth_code_send_error'
  | 'auth_code_submit'
  | 'auth_code_success'
  | 'auth_code_error'
  | 'auth_code_resend'
  | 'auth_logout_click'
  // Create
  | 'create_page_start'
  | 'page_title_filled'
  | 'start_date_selected'
  | 'photo_upload_start'
  | 'photo_upload_success'
  | 'photo_upload_error'
  | 'story_edited'
  | 'template_select'
  | 'template_preview'
  | 'editor_save'
  | 'editor_save_error'
  | 'preview_open'
  // Publish
  | 'publish_click'
  | 'publish_validation_error'
  | 'publish_slug_available'
  | 'publish_slug_unavailable'
  | 'publish_checkout_created'
  | 'publish_checkout_redirect'
  | 'publish_success'
  | 'publish_error'
  | 'public_link_generated'
  | 'copy_public_link'
  | 'open_public_link'
  | 'share_whatsapp_click'
  // Payment
  | 'plan_select'
  | 'order_bump_select'
  | 'order_bump_remove'
  | 'checkout_start'
  | 'checkout_error'
  | 'payment_success_page_view'
  | 'payment_pending'
  | 'payment_confirmed'
  | 'payment_failed'
  // Public page
  | 'public_page_view'
  | 'public_page_share_click'
  | 'public_page_whatsapp_click';
