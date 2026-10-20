import {
  TemplateSummary,
  TemplateVersion,
  PreviewResponse,
  ApiErrorResponse,
} from '@jandastavej/shared';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export class ApiClientError extends Error {
  public readonly code: string;
  public readonly fields?: Record<string, string>;
  public readonly requestId?: string;

  constructor(message: string, code = 'INTERNAL_ERROR', fields?: Record<string, string>, requestId?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.fields = fields;
    this.requestId = requestId;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch (err: any) {
    throw new ApiClientError(
      'Network connection failed. Please check your internet connection.',
      'NETWORK_ERROR'
    );
  }

  if (!res.ok) {
    let errorData: ApiErrorResponse | null = null;
    try {
      errorData = await res.json();
    } catch {
      // not JSON
    }

    if (errorData?.error) {
      throw new ApiClientError(
        errorData.error.message,
        errorData.error.code,
        errorData.error.fields,
        errorData.error.requestId
      );
    }

    throw new ApiClientError(
      `Request failed with status ${res.status}: ${res.statusText}`,
      'INTERNAL_ERROR'
    );
  }

  return res.json();
}

export const api = {
  async getTemplates(params?: { search?: string; category?: string; language?: string }): Promise<{ data: TemplateSummary[]; total: number }> {
    const sp = new URLSearchParams();
    if (params?.search) sp.set('search', params.search);
    if (params?.category) sp.set('category', params.category);
    if (params?.language) sp.set('language', params.language);
    const query = sp.toString() ? `?${sp.toString()}` : '';
    return request<{ data: TemplateSummary[]; total: number }>(`/templates${query}`);
  },

  async getTemplateDetail(slug: string, language = 'gu'): Promise<{ data: { template: TemplateSummary; version: TemplateVersion } }> {
    return request<{ data: { template: TemplateSummary; version: TemplateVersion } }>(
      `/templates/${slug}?language=${language}`
    );
  },

  async validateAnswers(payload: { templateVersionId: string; answers: Record<string, any>; language: string }): Promise<{ isValid: boolean; errors: Record<string, string> }> {
    return request<{ isValid: boolean; errors: Record<string, string> }>(
      '/generations/validate',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  async createPreview(payload: { templateVersionId: string; answers: Record<string, any>; language: string }): Promise<{ data: PreviewResponse }> {
    return request<{ data: PreviewResponse }>('/generations/preview', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getSession(sessionId: string): Promise<{ data: any }> {
    return request<{ data: any }>(`/generations/sessions/${sessionId}`);
  },

  async downloadPdfBlob(sessionId: string, disclaimerAccepted: boolean): Promise<Blob> {
    const url = `${BASE_URL}/generations/pdf`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        disclaimerAccepted,
      }),
      credentials: 'include',
    });

    if (!res.ok) {
      let errJson: any;
      try {
        errJson = await res.json();
      } catch {}
      throw new ApiClientError(
        errJson?.error?.message || 'Failed to generate PDF document.',
        errJson?.error?.code || 'PDF_UNAVAILABLE'
      );
    }

    return res.blob();
  },
};
