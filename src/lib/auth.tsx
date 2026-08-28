import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { setUnauthorizedHandler, type AuthUser } from "./api";
import { decodeJwt, isExpired } from "./jwt";
import { TOKEN_STORAGE_KEY } from "./constants";

export interface Session {
  token: string;
  user: AuthUser;
}

interface AuthContextValue {
  session: Session | null;
  /** Oturum düştüğünde giriş ekranında gösterilecek bilgi mesajı. */
  notice: string | null;
  signIn: (token: string, user?: AuthUser) => void;
  signOut: (notice?: string) => void;
  dismissNotice: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredSession(): Session | null {
  let token: string | null = null;
  try {
    token = localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null; // Gizli sekmede depolama kapalı olabilir.
  }
  if (!token) return null;

  const payload = decodeJwt(token);
  if (!payload || isExpired(payload)) {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      /* yoksay */
    }
    return null;
  }

  return { token, user: { id: payload.id, email: payload.email } };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readStoredSession);
  const [notice, setNotice] = useState<string | null>(null);
  const expiryTimer = useRef<number | null>(null);

  const signOut = useCallback((message?: string) => {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      /* yoksay */
    }
    setSession(null);
    setNotice(message ?? null);
  }, []);

  const signIn = useCallback((token: string, user?: AuthUser) => {
    const payload = decodeJwt(token);
    // /auth/login `user` döndürmüyor; e-posta token'dan okunuyor.
    const resolvedUser = user ?? (payload ? { id: payload.id, email: payload.email } : null);
    if (!resolvedUser) {
      setNotice("Sunucudan geçersiz bir oturum bilgisi geldi. Tekrar deneyin.");
      return;
    }

    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      /* depolama yoksa oturum yalnızca bu sekmede yaşar */
    }
    setNotice(null);
    setSession({ token, user: resolvedUser });
  }, []);

  // Backend 401 döndürdüğünde oturumu düşür.
  useEffect(() => {
    setUnauthorizedHandler((message) => signOut(message));
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  // Token'ın süresi dolduğu anda kullanıcıyı bekletmeden giriş ekranına al.
  useEffect(() => {
    if (expiryTimer.current !== null) {
      window.clearTimeout(expiryTimer.current);
      expiryTimer.current = null;
    }
    if (!session) return;

    const payload = decodeJwt(session.token);
    if (!payload?.exp) return;

    const msLeft = payload.exp * 1000 - Date.now();
    if (msLeft <= 0) {
      signOut("Oturumunuzun süresi doldu, tekrar giriş yapın.");
      return;
    }

    expiryTimer.current = window.setTimeout(() => {
      signOut("Oturumunuzun süresi doldu, tekrar giriş yapın.");
    }, msLeft);

    return () => {
      if (expiryTimer.current !== null) window.clearTimeout(expiryTimer.current);
    };
  }, [session, signOut]);

  const value = useMemo<AuthContextValue>(
    () => ({ session, notice, signIn, signOut, dismissNotice: () => setNotice(null) }),
    [session, notice, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth, AuthProvider içinde kullanılmalı.");
  return context;
}
