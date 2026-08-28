import { useState, type FormEvent } from "react";
import { ApiError, login, register } from "../lib/api";
import { useAuth } from "../lib/auth";
import { LogoMark } from "./icons";
import { Spinner } from "./Spinner";

type Mode = "login" | "register";

const MIN_PASSWORD_LENGTH = 6; // Backend kuralı: "Şifre en az 6 karakter olmalıdır"

export function AuthScreen() {
  const { signIn, notice, dismissNotice } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setFieldErrors({});
    dismissNotice();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    dismissNotice();

    try {
      if (mode === "register") {
        const data = await register({
          email: email.trim(),
          password,
          inviteCode: inviteCode.trim().toUpperCase(),
        });
        signIn(data.token, data.user);
      } else {
        const data = await login(email.trim(), password);
        signIn(data.token, data.user);
      }
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        setFieldErrors(caught.fieldErrors);
      } else {
        setError("Beklenmeyen bir hata oluştu. Tekrar deneyin.");
      }
      setSubmitting(false);
    }
  }

  const isRegister = mode === "register";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark className="size-12" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">UniNotes</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Ekibinizin ortak ders notu arşivi. Giriş yalnızca davet kodu ile.
          </p>
        </div>

        {notice && (
          <p className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.08] px-4 py-3 text-sm leading-relaxed text-amber-200">
            {notice}
          </p>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div
            className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-white/5 p-1"
            role="tablist"
            aria-label="Giriş veya kayıt"
          >
            {(["login", "register"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={mode === value}
                onClick={() => switchMode(value)}
                className={`min-h-10 rounded-lg text-sm font-medium transition ${
                  mode === value
                    ? "bg-indigo-500 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {value === "login" ? "Giriş yap" : "Kayıt ol"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Field label="E-posta" error={fieldErrors.email}>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="ad.soyad@ornek.com"
                className={inputClass(Boolean(fieldErrors.email))}
              />
            </Field>

            <Field label="Şifre" error={fieldErrors.password}>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={isRegister ? MIN_PASSWORD_LENGTH : undefined}
                autoComplete={isRegister ? "new-password" : "current-password"}
                placeholder={isRegister ? "En az 6 karakter" : "••••••••"}
                className={inputClass(Boolean(fieldErrors.password))}
              />
            </Field>

            {isRegister && (
              <Field
                label="Davet kodu"
                error={fieldErrors.inviteCode}
                hint="Davet kodları tek kullanımlıktır — her kod yalnızca bir hesap açar."
              >
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                  required
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  placeholder="ABC123"
                  className={`${inputClass(Boolean(fieldErrors.inviteCode))} font-mono tracking-[0.2em] uppercase`}
                />
              </Field>
            )}

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-rose-500/25 bg-rose-500/[0.08] px-4 py-3 text-sm leading-relaxed text-rose-200"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 text-sm font-medium text-white transition hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 disabled:opacity-60"
            >
              {submitting && <Spinner className="size-4" />}
              {submitting
                ? "Gönderiliyor…"
                : isRegister
                  ? "Hesap oluştur"
                  : "Giriş yap"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs leading-relaxed text-slate-500">
          {isRegister ? (
            <>
              Zaten hesabınız var mı?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="text-indigo-300 underline-offset-2 hover:underline"
              >
                Giriş yapın
              </button>
            </>
          ) : (
            <>
              Davet kodunuz var mı?{" "}
              <button
                type="button"
                onClick={() => switchMode("register")}
                className="text-indigo-300 underline-offset-2 hover:underline"
              >
                Hesap oluşturun
              </button>
            </>
          )}
        </p>
      </div>
    </main>
  );
}

function inputClass(hasError: boolean): string {
  return `h-11 w-full rounded-xl border bg-white/[0.04] px-3.5 text-sm text-slate-100 placeholder:text-slate-500 transition focus:bg-white/[0.07] focus:outline-none ${
    hasError
      ? "border-rose-500/50 focus:border-rose-400"
      : "border-white/10 focus:border-indigo-400/60"
  }`;
}

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, error, hint, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      {children}
      {error ? (
        <span className="text-xs text-rose-300">{error}</span>
      ) : (
        hint && <span className="text-xs leading-relaxed text-slate-500">{hint}</span>
      )}
    </label>
  );
}
