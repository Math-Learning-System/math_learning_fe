import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import { AuthService } from './auth.service';

interface ApiResponse<T> {
  code: number;
  message?: string;
  result: T;
}

export interface MinioBucket {
  name: string;
  label: string;
  description: string;
}

export interface MinioObject {
  key: string;
  directory: boolean;
  size: number;
  lastModified: string | null;
}

export interface MinioObjectList {
  bucket: string;
  prefix: string;
  objects: MinioObject[];
  nextContinuationToken: string | null;
  truncated: boolean;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const payload = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!res.ok || (payload && payload.code !== 1000)) {
    throw new Error(payload?.message ?? `HTTP ${res.status}`);
  }
  return payload!.result;
}

function authHeaders(json = true): Record<string, string> {
  const token = AuthService.getToken();
  if (!token) throw new Error('Bạn chưa đăng nhập.');
  const h: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

export const AdminStorageService = {
  async listBuckets(): Promise<MinioBucket[]> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_STORAGE_BUCKETS}`, {
      headers: authHeaders(),
    });
    return parseResponse<MinioBucket[]>(res);
  },

  async listObjects(params: {
    bucket: string;
    prefix?: string;
    maxKeys?: number;
    continuationToken?: string;
  }): Promise<MinioObjectList> {
    const q = new URLSearchParams();
    q.set('bucket', params.bucket);
    q.set('prefix', params.prefix ?? '');
    q.set('maxKeys', String(params.maxKeys ?? 50));
    if (params.continuationToken) q.set('continuationToken', params.continuationToken);
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_STORAGE_OBJECTS}?${q}`, {
      headers: authHeaders(),
    });
    return parseResponse<MinioObjectList>(res);
  },

  async presign(bucket: string, key: string): Promise<string> {
    const q = new URLSearchParams({ bucket, key });
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_STORAGE_PRESIGN}?${q}`, {
      headers: authHeaders(),
    });
    const data = await parseResponse<{ url: string }>(res);
    return data.url;
  },

  async deleteObject(bucket: string, key: string): Promise<void> {
    const q = new URLSearchParams({ bucket, key });
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_STORAGE_OBJECTS}?${q}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    await parseResponse<unknown>(res);
  },

  async upload(params: {
    bucket: string;
    file: File;
    prefix?: string;
    objectKey?: string;
  }): Promise<{ objectKey: string; bucket: string }> {
    const form = new FormData();
    form.append('file', params.file);
    form.append('bucket', params.bucket);
    if (params.prefix) form.append('prefix', params.prefix);
    if (params.objectKey) form.append('objectKey', params.objectKey);
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN_STORAGE_UPLOAD}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${AuthService.getToken()}` },
      body: form,
    });
    return parseResponse<{ objectKey: string; bucket: string }>(res);
  },
};
