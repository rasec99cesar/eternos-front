import type { UmamiEventName } from '../shared/index';

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, unknown>) => void;
    };
    fbq?: (command: 'track', event: 'PageView') => void;
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
  try {
    window.fbq?.('track', 'PageView');
  } catch {
    // Meta Pixel should never break routing
  }
}
