import type {
  User,
  CouplePage,
  Template,
  CheckoutStatusResponse,
  CheckoutSessionResponse,
  CreatePageInput,
  UpdatePageInput,
  CreateCheckoutSessionInput,
} from '../shared/index';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });

  const json = await res.json().catch(() => ({ error: 'Erro de comunicação com o servidor' }));

  if (!res.ok) {
    throw new ApiError(res.status, json.error ?? 'Erro desconhecido');
  }
  return (json.data ?? json) as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const api = {
  auth: {
    requestCode: (email: string) =>
      request<{ message: string }>('/auth/request-code', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    verifyCode: (email: string, code: string) =>
      request<User>('/auth/verify-code', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      }),

    logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),

    me: () => request<User>('/auth/me'),
  },

  // ─── Pages ──────────────────────────────────────────────────────────────────

  pages: {
    list: () => request<CouplePage[]>('/pages'),

    get: (id: string) => request<CouplePage>(`/pages/${id}`),

    create: (data: CreatePageInput) =>
      request<CouplePage>('/pages', { method: 'POST', body: JSON.stringify(data) }),

    update: (id: string, data: UpdatePageInput) =>
      request<CouplePage>(`/pages/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

    delete: (id: string) =>
      request<{ message: string }>(`/pages/${id}`, { method: 'DELETE' }),

    validatePublish: (id: string) =>
      request<{ valid: boolean }>(`/pages/${id}/validate-publish`, { method: 'POST' }),
  },

  // ─── Templates ──────────────────────────────────────────────────────────────

  templates: {
    list: () => request<Template[]>('/public/templates'),
  },

  // ─── Slugs ──────────────────────────────────────────────────────────────────

  slugs: {
    check: (slug: string) =>
      request<{ available: boolean; slug: string }>(`/slugs/check?slug=${slug}`),
  },

  // ─── Public pages ───────────────────────────────────────────────────────────

  public: {
    getPage: (slug: string) => request<CouplePage>(`/public/pages/${slug}`),
  },

  // ─── Checkout ───────────────────────────────────────────────────────────────

  checkout: {
    createSession: (data: CreateCheckoutSessionInput) =>
      request<CheckoutSessionResponse>('/checkout/create-session', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getStatus: (pageId: string) =>
      request<CheckoutStatusResponse>(`/checkout/status/${pageId}`),
  },

  // ─── Uploads ────────────────────────────────────────────────────────────────

  uploads: {
    upload: async (pageId: string, file: File, type = 'photo', position = 0) => {
      const form = new FormData();
      form.append('file', file);
      form.append('type', type);
      form.append('position', String(position));

      const res = await fetch(`${API_URL}/assets/${pageId}`, {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new ApiError(res.status, json.error ?? 'Erro ao enviar imagem');
      return json.data;
    },
  },
};
