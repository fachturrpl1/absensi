"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  RefreshCcw,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function OfflinePage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Monitor online status
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Check initial status
    updateOnlineStatus();

    // Listen for online/offline events
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  const handleRetry = () => {
    // Go back 1 step; fallback to home if no history
    if (typeof window !== 'undefined') {
      if (window.history.length > 1) {
        window.history.go(-1);
      } else {
        router.replace("/");
      }
    }
  };

  const handleGoBackTwo = () => {
    // Go back 2 steps; fallback to home if history stack too short
    if (typeof window !== 'undefined') {
      if (window.history.length > 2) {
        window.history.go(-2);
      } else if (window.history.length > 1) {
        window.history.go(-1);
      } else {
        router.replace("/");
      }
    }
  };

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-neutral-50 p-6 dark:bg-neutral-950">
      <Card className="w-full max-w-xl border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
        <CardHeader className="gap-4 text-center">
          <Badge
            variant="outline"
            className="mx-auto flex items-center gap-2 border-neutral-300 text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
          >
            <WifiOff className="size-4" />
            Offline Mode
          </Badge>
          <CardTitle className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
            Connection Lost
          </CardTitle>
          <CardDescription className="text-base text-neutral-600 dark:text-neutral-400">
            Your device appears to be offline. Please check your internet connection and try again.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-left dark:border-neutral-800 dark:bg-neutral-800/50">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-6 text-neutral-700 dark:text-neutral-300" />
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Your Session is Safe
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Don't worry. Your session will automatically resume when you're back online.
                </p>
              </div>
            </div>
          </div>

          <Separator className="bg-neutral-200 dark:bg-neutral-800" />

          <div className="text-center">
            {isOnline ? (
              <div className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                <div className="size-2 rounded-full bg-green-600 dark:bg-green-400" />
                Back online! Click retry to continue.
              </div>
            ) : (
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Make sure your internet connection is active, then click the button below to try again.
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="grid w-full grid-cols-1 sm:grid-cols-2 gap-3">
          <Button 
            className="w-full bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200" 
            size="lg" 
            onClick={handleRetry}
          >
            <RefreshCcw className="size-4" />
            Retry
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            onClick={handleGoBackTwo}
          >
            Go Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
