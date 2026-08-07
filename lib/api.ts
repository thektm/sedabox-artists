import { getPersianPayloadMessage, toPersianMessage } from "./faMessages";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.sedabox.com/api"
).replace(/\/$/, "");

export const resolveMediaUrl = (value?: string | null): string => {
  const source = String(value || "").trim();
  if (!source || source.startsWith("blob:") || source.startsWith("data:")) return source;
  try {
    return new URL(source, `${new URL(API_BASE_URL).origin}/`).toString();
  } catch {
    return source;
  }
};

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status = 0, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown> | null;
  query?: Record<string, string | number | boolean | null | undefined>;
  auth?: boolean;
  retryAuth?: boolean;
};

export const getApiErrorMessage = (
  error: unknown,
  fallback = "خطایی رخ داد. لطفاً دوباره تلاش کنید.",
): string => {
  if (error instanceof ApiError) {
    return getPersianPayloadMessage(error.details, toPersianMessage(error.message, fallback));
  }
  if (error instanceof Error) return toPersianMessage(error.message, fallback);
  return getPersianPayloadMessage(error, fallback);
};

const parseResponse = async (response: Response): Promise<unknown> => {
  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json().catch(() => ({}));
  return response.text().catch(() => "");
};

let refreshPromise: Promise<boolean> | null = null;

const refreshAccessToken = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem("sedabox_refresh_token");
    if (!refreshToken) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept-Language": "fa" },
        body: JSON.stringify({ refreshToken }),
      });
      const data = (await parseResponse(response)) as Record<string, unknown>;
      if (!response.ok || !data?.accessToken) return false;
      localStorage.setItem("sedabox_token", String(data.accessToken));
      if (data.refreshToken) localStorage.setItem("sedabox_refresh_token", String(data.refreshToken));
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const {
    query,
    auth = true,
    retryAuth = true,
    body,
    headers: suppliedHeaders,
    ...requestOptions
  } = options;
  const url = new URL(endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") url.searchParams.set(key, String(value));
  });

  const headers = new Headers(suppliedHeaders);
  if (!headers.has("Accept-Language")) headers.set("Accept-Language", "fa");
  let requestBody: BodyInit | undefined;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const isBlob = typeof Blob !== "undefined" && body instanceof Blob;
  const isSearchParams = typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams;
  if (isFormData || typeof body === "string" || isBlob || isSearchParams) {
    requestBody = body as BodyInit;
  } else if (body !== undefined && body !== null) {
    headers.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }
  if (auth && typeof window !== "undefined") {
    const token = localStorage.getItem("sedabox_token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), { ...requestOptions, headers, body: requestBody, cache: "no-store" });
  } catch (error) {
    if ((error as Error)?.name === "AbortError") throw error;
    throw new ApiError("ارتباط با سرور برقرار نشد. اینترنت خود را بررسی کنید و دوباره تلاش کنید.");
  }

  if (response.status === 401 && auth && retryAuth && (await refreshAccessToken())) {
    return apiRequest<T>(endpoint, { ...options, retryAuth: false });
  }

  const data = await parseResponse(response);
  if (!response.ok) throw responseError(response.status, data);
  return data as T;
}


export type UploadProgress = {
  percent: number;
  loaded: number;
  total: number;
  processing: boolean;
};

type UploadOptions = {
  body: FormData;
  onProgress?: (progress: UploadProgress) => void;
  timeoutMs?: number;
  retryAuth?: boolean;
};

const responseError = (status: number, data: unknown) => {
  const fallback = status === 401
    ? "نشست شما منقضی شده است. دوباره وارد شوید."
    : status === 403
      ? "اجازه انجام این عملیات را ندارید."
      : status >= 500
        ? "سرور نتوانست درخواست را کامل کند. کمی بعد دوباره تلاش کنید."
        : "انجام درخواست ممکن نشد. لطفاً دوباره تلاش کنید.";
  return new ApiError(getPersianPayloadMessage(data, fallback), status, data);
};

export async function apiUpload<T>(endpoint: string, options: UploadOptions): Promise<T> {
  if (typeof window === "undefined") throw new ApiError("بارگذاری فایل فقط در مرورگر امکان‌پذیر است.");
  const { body, onProgress, timeoutMs = 30 * 60 * 1000, retryAuth = true } = options;
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const send = () => new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.timeout = timeoutMs;
    const token = localStorage.getItem("sedabox_token");
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Accept-Language", "fa");

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress?.({ percent: Math.min(100, Math.round((event.loaded / event.total) * 100)), loaded: event.loaded, total: event.total, processing: false });
    };
    xhr.upload.onload = () => onProgress?.({ percent: 100, loaded: body.get("audio_file") instanceof File ? (body.get("audio_file") as File).size : 0, total: body.get("audio_file") instanceof File ? (body.get("audio_file") as File).size : 0, processing: true });
    xhr.onerror = () => reject(new ApiError("ارتباط هنگام بارگذاری قطع شد. اینترنت خود را بررسی کنید و دوباره تلاش کنید."));
    xhr.ontimeout = () => reject(new ApiError("مهلت بارگذاری پیش از پایان پردازش سرور تمام شد. دوباره تلاش کنید."));
    xhr.onabort = () => reject(new ApiError("بارگذاری لغو شد."));
    xhr.onload = () => {
      let data: unknown = xhr.responseText;
      try { data = xhr.responseText ? JSON.parse(xhr.responseText) : null; } catch { /* Keep text response. */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data as T);
      else reject(responseError(xhr.status, data));
    };
    onProgress?.({ percent: 0, loaded: 0, total: body.get("audio_file") instanceof File ? (body.get("audio_file") as File).size : 0, processing: false });
    xhr.send(body);
  });

  try {
    return await send();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && retryAuth && await refreshAccessToken()) {
      return apiUpload<T>(endpoint, { ...options, retryAuth: false });
    }
    throw error;
  }
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const unwrapList = <T>(value: T[] | { results?: T[] } | null | undefined): T[] =>
  Array.isArray(value) ? value : value?.results || [];

export async function fetchAllPages<T>(endpoint: string, query?: ApiOptions["query"]): Promise<T[]> {
  const first = await apiRequest<T[] | PaginatedResponse<T>>(endpoint, { query });
  if (Array.isArray(first)) return first;
  const items = [...(first.results || [])];
  let next = first.next;
  while (next) {
    const page = await apiRequest<PaginatedResponse<T>>(next);
    items.push(...(page.results || []));
    next = page.next;
  }
  return items;
}
