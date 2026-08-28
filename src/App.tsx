import { useEffect, useState } from "react";
import { onSlowRequest } from "./lib/api";
import { AuthProvider, useAuth } from "./lib/auth";
import { AppShell } from "./components/AppShell";
import { AuthScreen } from "./components/AuthScreen";
import { Spinner } from "./components/Spinner";

/**
 * Render'ın ücretsiz örneği uykudayken ilk istek 30-50 saniye sürebiliyor.
 * Kullanıcı "bozuk mu?" diye düşünmesin diye bekleyen isteği duyuruyoruz.
 */
function ColdStartBanner() {
  const [slow, setSlow] = useState(false);
  useEffect(() => onSlowRequest(setSlow), []);

  if (!slow) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2.5 bg-amber-500/15 px-4 py-2 text-center text-xs text-amber-100 backdrop-blur sm:text-sm">
      <Spinner className="size-3.5 shrink-0" />
      Sunucu uykudan uyanıyor, bu ilk istek yarım dakika kadar sürebilir…
    </div>
  );
}

function Routes() {
  const { session } = useAuth();
  return session ? <AppShell session={session} /> : <AuthScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <ColdStartBanner />
      <Routes />
    </AuthProvider>
  );
}
