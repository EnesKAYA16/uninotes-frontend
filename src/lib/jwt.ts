/**
 * JWT payload okuyucu. İmza DOĞRULANMAZ — backend zaten her istekte doğruluyor.
 * Buradaki tek amaç, /auth/login yanıtı `user` nesnesi döndürmediği için
 * kullanıcının e-postasını ve oturumun bitiş anını arayüzde gösterebilmek.
 */
export interface JwtPayload {
  id: string;
  email: string;
  iat: number;
  /** Unix saniye. Backend'de ömür 1 saat. */
  exp: number;
}

export function decodeJwt(token: string): JwtPayload | null {
  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );
    const parsed = JSON.parse(json) as Partial<JwtPayload>;
    if (typeof parsed.id !== "string" || typeof parsed.email !== "string") return null;
    return {
      id: parsed.id,
      email: parsed.email,
      iat: typeof parsed.iat === "number" ? parsed.iat : 0,
      exp: typeof parsed.exp === "number" ? parsed.exp : 0,
    };
  } catch {
    return null;
  }
}

export function isExpired(payload: JwtPayload | null, skewSeconds = 30): boolean {
  if (!payload || !payload.exp) return false;
  return payload.exp * 1000 <= Date.now() + skewSeconds * 1000;
}
