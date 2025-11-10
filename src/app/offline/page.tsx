"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <WifiOff className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {isOnline ? "Kembali Online" : "Tidak Ada Koneksi"}
          </h1>
          <p className="text-muted-foreground">
            {isOnline
              ? "Koneksi internet Anda telah pulih. Silakan muat ulang halaman."
              : "Sepertinya Anda sedang offline. Periksa koneksi internet Anda dan coba lagi."}
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleRetry}
            className="w-full"
            disabled={!isOnline}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {isOnline ? "Muat Ulang Halaman" : "Menunggu Koneksi..."}
          </Button>

          {isOnline && (
            <div className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3">
              <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                ✓ Koneksi internet terdeteksi
              </p>
            </div>
          )}
        </div>

        <div className="pt-4 space-y-2 text-sm text-muted-foreground">
          <p className="font-medium">Tips:</p>
          <ul className="space-y-1 text-left">
            <li>• Periksa apakah WiFi atau data seluler sudah aktif</li>
            <li>• Coba aktifkan mode pesawat lalu matikan kembali</li>
            <li>• Pastikan Anda berada dalam jangkauan jaringan</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
