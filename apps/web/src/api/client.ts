import {
  TemplateSummary,
  TemplateVersion,
  PreviewResponse,
  ApiErrorResponse,
  ServiceSummary,
  ServiceDetail,
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

  async getServices(params?: { search?: string; category?: string; department?: string; language?: string }): Promise<{ data: ServiceSummary[]; meta: { total: number } }> {
    const sp = new URLSearchParams();
    if (params?.search) sp.set('search', params.search);
    if (params?.category) sp.set('category', params.category);
    if (params?.department) sp.set('department', params.department);
    if (params?.language) sp.set('language', params.language);
    const query = sp.toString() ? `?${sp.toString()}` : '';
    return request<{ data: ServiceSummary[]; meta: { total: number } }>(`/services${query}`);
  },

  async getServiceDetail(slug: string, language = 'gu'): Promise<{ data: ServiceDetail }> {
    return request<{ data: ServiceDetail }>(`/services/${slug}?language=${language}`);
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

  async downloadDocxBlob(sessionId: string): Promise<Blob> {
    const url = `${BASE_URL}/generations/${sessionId}/docx`;
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      let errJson: any;
      try {
        errJson = await res.json();
      } catch {}
      throw new ApiClientError(
        errJson?.error?.message || 'Failed to download DOCX document.',
        errJson?.error?.code || 'DOCX_UNAVAILABLE'
      );
    }

    return res.blob();
  },

  async createServiceBundle(payload: {
    serviceSlug: string;
    language: string;
    answers: Record<string, any>;
    selectedTemplateSlugs: string[];
  }): Promise<{
    data: {
      serviceSlug: string;
      serviceTitle: string;
      sessions: Array<{
        templateSlug: string;
        templateTitle: string;
        templateCategory: string;
        sessionId: string;
        previewHtml: string;
        answers: Record<string, any>;
      }>;
      combinedHtml: string;
    };
  }> {
    return request('/generations/service-bundle', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async downloadServiceBundlePdfBlob(sessionIds: string[], title?: string): Promise<Blob> {
    const url = `${BASE_URL}/generations/service-bundle/pdf`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionIds,
        title,
      }),
      credentials: 'include',
    });

    if (!res.ok) {
      let errJson: any;
      try {
        errJson = await res.json();
      } catch {}
      throw new ApiClientError(
        errJson?.error?.message || 'Failed to generate bundle PDF.',
        errJson?.error?.code || 'PDF_UNAVAILABLE'
      );
    }

    return res.blob();
  },

  // Citizen User Documents & Consents (Feature Addendum 2)
  async getConsents(): Promise<{ data: any[] }> {
    return request<{ data: any[] }>('/me/consents');
  },

  async updateConsents(
    scopes: Array<{ scope: 'process' | 'keep' | 'ai_assist'; granted: boolean }>,
    noticeVersion = '2026.1-DPDPA'
  ): Promise<{ data: any[] }> {
    return request<{ data: any[] }>('/me/consents', {
      method: 'POST',
      body: JSON.stringify({ scopes, noticeVersion }),
    });
  },

  async uploadDocument(file: File, docType = 'other', kept = false): Promise<{ data: { document: any; extraction: any } }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', docType);
    if (kept) formData.append('kept', 'true');

    const res = await fetch(`${BASE_URL}/me/documents`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!res.ok) {
      let errorData: any = null;
      try {
        errorData = await res.json();
      } catch {}
      throw new ApiClientError(
        errorData?.error?.message || 'Failed to upload document.',
        errorData?.error?.code || 'UPLOAD_FAILED'
      );
    }
    return res.json();
  },

  async getMyDocuments(): Promise<{ data: any[] }> {
    return request<{ data: any[] }>('/me/documents');
  },

  async getDocument(id: string): Promise<{ data: any }> {
    return request<{ data: any }>(`/me/documents/${id}`);
  },

  async getDocumentExtraction(id: string): Promise<{ data: any }> {
    return request<{ data: any }>(`/me/documents/${id}/extraction`);
  },

  async keepDocument(id: string, days?: number): Promise<{ data: any }> {
    return request<{ data: any }>(`/me/documents/${id}/keep`, {
      method: 'POST',
      body: JSON.stringify({ days }),
    });
  },

  async unkeepDocument(id: string): Promise<{ data: any }> {
    return request<{ data: any }>(`/me/documents/${id}/unkeep`, {
      method: 'POST',
    });
  },

  async deleteDocument(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/me/documents/${id}`, {
      method: 'DELETE',
    });
  },

  async deleteAllMyData(): Promise<{ message: string; deletedCount: number }> {
    return request<{ message: string; deletedCount: number }>('/me/data', {
      method: 'DELETE',
    });
  },

  async applyExtraction(
    sessionId: string,
    items: Array<{ fieldKey: string; value: string }>
  ): Promise<{ data: any }> {
    return request<{ data: any }>(`/generations/${sessionId}/apply-extraction`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  },

  async bundleAnnexures(sessionId: string, annexureDocIds: string[]): Promise<Blob> {
    const url = `${BASE_URL}/generations/${sessionId}/bundle`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ annexureDocIds }),
      credentials: 'include',
    });

    if (!res.ok) {
      let errJson: any;
      try {
        errJson = await res.json();
      } catch {}
      throw new ApiClientError(
        errJson?.error?.message || 'Failed to bundle annexures with affidavit.',
        errJson?.error?.code || 'BUNDLE_FAILED'
      );
    }

    return res.blob();
  },

  async reportTemplate(
    slug: string,
    payload: {
      issueType: 'outdated_format' | 'incorrect_wording' | 'legal_change' | 'broken_placeholder' | 'other';
      description: string;
      sourceProofUrl?: string;
      contactEmail?: string;
    }
  ): Promise<{ data: any }> {
    return request<{ data: any }>(`/templates/${slug}/report`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getAdminReports(): Promise<{ data: any[] }> {
    return request<{ data: any[] }>('/admin/reports');
  },

  async updateAdminReport(id: string, status: string, notes?: string): Promise<{ data: any }> {
    return request<{ data: any }>(`/admin/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },

  // Admin Services Management
  async getAdminServices(): Promise<{ data: any[] }> {
    return request<{ data: any[] }>('/admin/services');
  },

  async getAdminService(id: string): Promise<{ data: any }> {
    return request<{ data: any }>(`/admin/services/${id}`);
  },

  async createAdminService(payload: any): Promise<{ data: any }> {
    return request<{ data: any }>('/admin/services', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateAdminService(id: string, payload: any): Promise<{ data: any }> {
    return request<{ data: any }>(`/admin/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteAdminService(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/admin/services/${id}`, {
      method: 'DELETE',
    });
  },
};

