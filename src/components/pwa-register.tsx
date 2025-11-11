"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    // Only run in production on HTTPS
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      console.log("[PWA] Service Worker disabled - not in production or not supported");
      return;
    }

    // Check if on HTTPS or localhost
    const isHttps = window.location.protocol === "https:";
    const isLocalhost = window.location.hostname === "localhost" || 
                       window.location.hostname === "127.0.0.1" ||
                       window.location.hostname === "[::1]";
    
    if (!isHttps && !isLocalhost) {
      console.warn("[PWA] Service Worker requires HTTPS");
      return;
    }

    // Register after page load
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[PWA] Service Worker registered:", registration.scope);

          // Check for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  console.log("[PWA] New version available");
                  newWorker.postMessage({ type: "SKIP_WAITING" });
                }
              });
            }
          });

          // Auto-update check every 5 minutes
          setInterval(() => {
            registration.update();
          }, 5 * 60 * 1000);
        })
        .catch((error) => {
          console.error("[PWA] Registration failed:", error);
        });

      // Handle controller change
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    });
  }, []);

  return null;
}
