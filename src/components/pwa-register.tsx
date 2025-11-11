"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production" &&
      window.location.protocol === "https:"
    ) {
      // Wait for page load to avoid blocking render
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js", {
            scope: "/",
            updateViaCache: "none"
          })
          .then((registration) => {
            console.log("[PWA] Service Worker registered successfully");

            // Check for updates
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (
                    newWorker.state === "installed" &&
                    navigator.serviceWorker.controller
                  ) {
                    console.log("[PWA] New service worker available");
                    
                    // Auto-update without user prompt for better UX
                    newWorker.postMessage({ type: "SKIP_WAITING" });
                  }
                });
              }
            });

            // Check for updates periodically
            setInterval(() => {
              registration.update();
            }, 60000); // Check every minute
          })
          .catch((error) => {
            console.warn("[PWA] Service Worker registration failed:", error);
          });

        // Handle service worker controller change
        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });
      });
    }
  }, []);

  return null;
}
