'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [offline, setOffline] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);

    const handleOffline = () => { setOffline(true); setVisible(true); };
    const handleOnline = () => {
      setTimeout(() => setVisible(false), 3000);
      setOffline(false);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!offline && !visible) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      className={[
        'fixed top-0 inset-x-0 z-[200]',
        'flex items-center justify-center gap-2',
        'px-4 py-2 text-xs font-medium',
        'border-b border-n-300',
        offline
          ? 'bg-n-800 text-n-100 dark:bg-n-900 dark:text-n-200'
          : 'bg-ok text-white',
        'transition-colors duration-[140ms]',
      ].join(' ')}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {offline ? (
        <>
          <WifiOff className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} aria-hidden="true" />
          {isAr
            ? 'أنت غير متصل بالإنترنت حالياً. إجاباتك محفوظة محلياً.'
            : 'You are currently offline. Your answers are saved locally.'}
        </>
      ) : (
        isAr ? 'عاد الاتصال بالإنترنت' : 'Internet connection restored'
      )}
    </div>
  );
}
