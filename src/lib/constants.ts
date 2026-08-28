/** Backend'in kabul ettiği üst sınır (API_DOCS: max 20MB). */
export const MAX_FILE_SIZE = 20 * 1024 * 1024;

/** Backend PDF ve fotoğraf kabul ediyor. */
export const ACCEPTED_MIME_PREFIXES = ["application/pdf", "image/"] as const;

/** Dosya seçicinin `accept` niteliği. */
export const FILE_ACCEPT = "application/pdf,image/*";

/** Bu süreyi aşan istekte "sunucu uyanıyor" uyarısı gösterilir (Render soğuk başlangıcı). */
export const SLOW_REQUEST_MS = 5000;

/** Arama kutusu debounce süresi. */
export const SEARCH_DEBOUNCE_MS = 350;

/** OCR bekleyen dosya varken listeyi yenileme aralığı. */
export const STATUS_POLL_MS = 10000;

export const TOKEN_STORAGE_KEY = "uninotes.token";
