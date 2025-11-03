'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to monitoring service
    logger.error('Global error occurred', error, {
      digest: error.digest,
    });
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4 text-center">
            <h1 className="text-4xl font-bold">500</h1>
            <h2 className="text-xl font-semibold">Something went wrong!</h2>
            <p className="text-muted-foreground">
              We're sorry for the inconvenience. Our team has been notified.
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg text-left">
                <p className="text-sm font-mono text-red-600 dark:text-red-400">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}
            
            <div className="flex gap-4 justify-center mt-6">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
              >
                Go Home
              </Button>
              <Button onClick={() => reset()}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
