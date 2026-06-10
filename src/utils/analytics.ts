import type { UmamiEventName } from '../shared/index';

export type PlanKey = 'sempre' | 'eterno';

type MetaEventName = 'PageView' | 'InitiateCheckout' | 'Purchase';
type MetaEventParams = {
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  contents?: Array<{
    id: string;
    quantity: number;
  }>;
  currency?: 'BRL';
  num_items?: number;
  page_id?: string;
  value?: number;
};

const PLAN_META: Record<PlanKey, { name: string; value: number }> = {
  sempre: { name: 'Somos Eternos', value: 27.9 },
  eterno: { name: 'Eterno', value: 37.9 },
};

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, unknown>) => void;
    };
    fbq?: (command: 'track', event: MetaEventName, params?: MetaEventParams) => void;
  }
}

/**
 * Centralised Umami event tracker.
 * Never sends sensitive data (email, codes, tokens).
 */
export function trackEvent(name: UmamiEventName, data?: Record<string, string | number | boolean>) {
  try {
    window.umami?.track(name, data);
  } catch {
    // Silently fail — analytics should never break the app
  }
}

/** Inject Umami script if env vars are set */
export function initUmami() {
  const src = import.meta.env.VITE_UMAMI_SRC;
  const id = import.meta.env.VITE_UMAMI_WEBSITE_ID;
  if (!src || !id) return;

  const script = document.createElement('script');
  script.defer = true;
  script.src = src;
  script.setAttribute('data-website-id', id);
  document.head.appendChild(script);
}

export function trackMetaPageView() {
  trackMetaEvent('PageView');
}

export function isPlanKey(plan: string | null | undefined): plan is PlanKey {
  return plan === 'sempre' || plan === 'eterno';
}

export function getPlanMeta(plan: PlanKey) {
  return PLAN_META[plan];
}

function planEventParams(plan: PlanKey, pageId?: string): MetaEventParams {
  const meta = getPlanMeta(plan);
  return {
    content_ids: ['vendas'],
    content_name: meta.name,
    content_type: 'product',
    contents: [
      {
        id: 'vendas',
        quantity: 1,
      },
    ],
    currency: 'BRL',
    num_items: 1,
    value: meta.value,
    ...(pageId ? { page_id: pageId } : {}),
  };
}

export function trackMetaInitiateCheckout(plan: PlanKey, pageId?: string) {
  trackMetaEvent('InitiateCheckout', planEventParams(plan, pageId));
}

export function trackMetaPurchase(plan: PlanKey, pageId?: string) {
  trackMetaEvent('Purchase', planEventParams(plan, pageId));
}

function trackMetaEvent(event: MetaEventName, params?: MetaEventParams) {
  try {
    window.fbq?.('track', event, params);
  } catch {
    // Meta Pixel should never break routing
  }
}
