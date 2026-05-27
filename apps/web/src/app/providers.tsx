import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ScrollToHash } from './ScrollToHash.js';
import { Toaster } from '../shared/components/Toaster.js';
import { OfflineBanner } from '../shared/components/OfflineBanner.js';
import { EmailVerifyBanner } from '../shared/components/EmailVerifyBanner.js';
import { SessionGuard } from './SessionGuard.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ScrollToHash />
        <SessionGuard />
        <OfflineBanner />
        <EmailVerifyBanner />
        {children}
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
