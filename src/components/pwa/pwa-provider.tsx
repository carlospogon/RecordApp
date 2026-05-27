"use client";

import { useEffect } from "react";

export function PwaProvider() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // The MVP should not fail if PWA registration is unavailable.
    });
  }, []);

  return null;
}
