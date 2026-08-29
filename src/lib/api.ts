import { MAX_FILE_SIZE, SLOW_REQUEST_MS } from "./constants";

/**
 * Ortam değişkeni tanımlı ama boş olabilir (Vercel'de değer girilmeden eklenen
 * değişkenler böyle geliyor); `??` bu durumda varsayılana düşmediği için
 * boş/boşluklu değerler de yok sayılıyor.
 */
const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE = (configuredApiBase || "https://uninotes-7eql.onrender.com").replace(
  /\/+$/,
  "",
);

export type DocumentStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

/**
 * Metin çıkarma sürüyor mu? Backend dosyayı önce `PENDING`, hemen ardından
 * `PROCESSING` durumunda tutuyor; ikisi de kullanıcı için "işleniyor" demek.
 */
export function isProcessing(status: DocumentStatus): boolean {
  return status === "PENDING" || status === "PROCESSING";
}

/**
 * Backend'in döndürdüğü döküman. Arama sonuçları bu alanların yalnızca bir
 * kısmını (id, title, url, mimeType, status) içerdiği için gerisi opsiyonel.
 */
export interface UniDocument {
  id: string;
  title: string;
  url: string;
  mimeType: string;
  status: DocumentStatus;
  size?: number;
  hash?: string;
  userId?: string;
  textContent?: string | null;
  createdAt?: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

export class ApiError extends Error {
  readonly status: number;
  /** Zod doğrulama hataları: { email: "...", password: "..." } */
  readonly fieldErrors: Record<string, string>;

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/** Backend mesajları İngilizce; kullanıcıya Türkçe gösteriyoruz. */
const MESSAGE_TR: Record<string, string> = {
  "Invalid or used invitation code.": "Davet kodu geçersiz veya daha önce kullanılmış.",
  "Incorrect email or password!": "E-posta veya şifre hatalı.",
  "Your informations are not correct.": "Girdiğiniz bilgileri kontrol edin.",
  "File not found!": "Dosya seçilmedi.",
  "Search term is required!": "Arama terimi girin.",
  "Token not found.": "Oturum bulunamadı, tekrar giriş yapın.",
  "Document not found!": "Dosya bulunamadı; başka biri silmiş olabilir.",
  "Invalid token": "Oturumunuzun süresi doldu, tekrar giriş yapın.",
};

const FIELD_TR: Record<string, string> = {
  email: "E-posta",
  password: "Şifre",
  inviteCode: "Davet kodu",
};

/** Bilinmeyen mesajlar olduğu gibi geçer; yeni backend hataları sessizce yutulmaz. */
function translate(message: string): string {
  return MESSAGE_TR[message] ?? message;
}

interface ErrorBody {
  message?: string;
  errors?: Array<{ path?: unknown[]; message?: string }>;
}

function toApiError(status: number, body: unknown): ApiError {
  if (status === 409) {
    return new ApiError(409, "Bu dosya zaten yüklenmiş.");
  }

  const parsed = (body ?? {}) as ErrorBody;
  const fieldErrors: Record<string, string> = {};

  // Kayıt/giriş doğrulama hataları: { path: ["body", "email"], message: "..." }
  // Backend bu mesajları zaten Türkçe döndürüyor ("Şifre en az 6 karakter olmalıdır"),
  // o yüzden olduğu gibi kullanılır; mesaj yoksa alan adından bir metin üretilir.
  for (const issue of parsed.errors ?? []) {
    const field = issue.path?.[1];
    if (typeof field === "string" && !fieldErrors[field]) {
      fieldErrors[field] = issue.message ?? `${FIELD_TR[field] ?? field} alanını kontrol edin.`;
    }
  }

  const message = parsed.message
    ? translate(parsed.message)
    : `Beklenmeyen bir hata oluştu (${status}).`;

  return new ApiError(status, message, fieldErrors);
}

/* -------------------------------------------------------------------------- */
/* Yavaş istek bildirimi (Render ücretsiz örneği uykudan uyanırken ~30-50 sn)  */
/* -------------------------------------------------------------------------- */

type SlowListener = (slow: boolean) => void;

const slowListeners = new Set<SlowListener>();
let slowRequestCount = 0;

export function onSlowRequest(listener: SlowListener): () => void {
  slowListeners.add(listener);
  return () => {
    slowListeners.delete(listener);
  };
}

function emitSlow() {
  const slow = slowRequestCount > 0;
  for (const listener of slowListeners) listener(slow);
}

/** İsteği izlemeye başlar; dönen fonksiyon istek bitince çağrılmalı. */
function trackSlowRequest(): () => void {
  let counted = false;
  const timer = setTimeout(() => {
    counted = true;
    slowRequestCount += 1;
    emitSlow();
  }, SLOW_REQUEST_MS);

  return () => {
    clearTimeout(timer);
    if (counted) {
      slowRequestCount -= 1;
      emitSlow();
    }
  };
}

/* -------------------------------------------------------------------------- */
/* Oturum düşürme                                                             */
/* -------------------------------------------------------------------------- */

let unauthorizedHandler: ((message: string) => void) | null = null;

/** AuthProvider bunu bağlar: 401 gelirse oturum temizlenip giriş ekranına dönülür. */
export function setUnauthorizedHandler(handler: ((message: string) => void) | null) {
  unauthorizedHandler = handler;
}

function reportUnauthorized(error: ApiError) {
  if (error.status === 401) unauthorizedHandler?.(error.message);
}

/* -------------------------------------------------------------------------- */
/* İstek yardımcısı                                                           */
/* -------------------------------------------------------------------------- */

interface RequestOptions {
  method?: string;
  token?: string;
  body?: unknown;
  /** 404'te hata fırlatmak yerine null dön (henüz yayınlanmamış uçlar için). */
  allowNotFound?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T | null> {
  const { method = "GET", token, body, allowNotFound = false } = options;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const stopTracking = trackSlowRequest();
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.");
  } finally {
    stopTracking();
  }

  if (response.status === 404 && allowNotFound) return null;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = toApiError(response.status, payload);
    reportUnauthorized(error);
    throw error;
  }

  return payload as T;
}

/* -------------------------------------------------------------------------- */
/* Uçlar                                                                      */
/* -------------------------------------------------------------------------- */

export interface RegisterInput {
  email: string;
  password: string;
  inviteCode: string;
}

/** POST /auth/register -> 201 { user, token } */
export async function register(input: RegisterInput): Promise<{ token: string; user: AuthUser }> {
  const data = await request<{ token: string; user: AuthUser }>("/auth/register", {
    method: "POST",
    body: input,
  });
  return data as { token: string; user: AuthUser };
}

/**
 * POST /auth/login -> 200 { message, token, user }
 * `user` opsiyonel tutuluyor: gelmezse çağıran taraf kullanıcıyı token'dan
 * çözer (bkz. lib/auth.tsx `signIn`).
 */
export async function login(
  email: string,
  password: string,
): Promise<{ token: string; user?: AuthUser }> {
  const data = await request<{ token: string; user?: AuthUser }>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  return data as { token: string; user?: AuthUser };
}

/** GET /documents/search?q=... -> { results: [...] } */
export async function searchDocuments(query: string, token: string): Promise<UniDocument[]> {
  const data = await request<{ results: UniDocument[] }>(
    `/documents/search?q=${encodeURIComponent(query)}`,
    { token },
  );
  return data?.results ?? [];
}

/**
 * GET /documents — tüm kullanıcıların dosyaları (ortak arşiv).
 * Uç yayından kalkarsa arayüz çökmesin diye 404'te null dönüyor; o durumda
 * yalnızca bu oturumda yüklenen dosyalar listelenir.
 * Beklenen yanıt: { documents: [...] } veya doğrudan dizi.
 */
export async function listDocuments(token: string): Promise<UniDocument[] | null> {
  const data = await request<{ documents?: UniDocument[] } | UniDocument[]>("/documents", {
    token,
    allowNotFound: true,
  });
  if (data === null) return null;
  if (Array.isArray(data)) return data;
  return data.documents ?? [];
}

/**
 * POST /documents/upload (multipart, alan adı `file`).
 * fetch yükleme ilerlemesi vermediği için XHR kullanılıyor.
 */
export function uploadDocument(
  file: File,
  token: string,
  onProgress?: (percent: number) => void,
): Promise<UniDocument> {
  if (file.size > MAX_FILE_SIZE) {
    return Promise.reject(new ApiError(0, "Dosya 20 MB sınırını aşıyor."));
  }

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    const stopTracking = trackSlowRequest();

    xhr.open("POST", `${API_BASE}/documents/upload`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      stopTracking();
      let payload: unknown = null;
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        payload = null;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        const uploaded = (payload as { document?: UniDocument } | null)?.document;
        if (uploaded) {
          resolve(uploaded);
        } else {
          reject(new ApiError(xhr.status, "Sunucu beklenmeyen bir yanıt döndürdü."));
        }
        return;
      }

      const error = toApiError(xhr.status, payload);
      reportUnauthorized(error);
      reject(error);
    });

    xhr.addEventListener("error", () => {
      stopTracking();
      reject(new ApiError(0, "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin."));
    });

    xhr.addEventListener("abort", () => {
      stopTracking();
      reject(new ApiError(0, "Yükleme iptal edildi."));
    });

    xhr.send(formData);
  });
}

/** DELETE /documents/:id -> 200 { message } — dosyayı veritabanından ve R2'den siler. */
export async function deleteDocument(id: string, token: string): Promise<void> {
  await request(`/documents/${encodeURIComponent(id)}`, { method: "DELETE", token });
}
