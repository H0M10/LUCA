import { useEffect, useState } from 'react';

export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="sticky top-0 z-50 animate-slide-in border-b border-clay-700 bg-clay-600 px-4 py-2 text-center font-sans text-sm text-paper-50 shadow-paper">
      <span className="font-mono text-[10px] uppercase tracking-widest">Sin conexión</span>
      <span className="mx-2">·</span>
      Tus cambios no se guardarán hasta que vuelvas a conectarte.
    </div>
  );
}
