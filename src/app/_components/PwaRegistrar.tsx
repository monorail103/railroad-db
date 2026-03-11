"use client";

import { useEffect } from "react";
import { Serwist } from "@serwist/window";

export function PwaRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const serwist = new Serwist("/sw.js", { scope: "/" });

    serwist.register({ immediate: true }).catch((error) => {
      console.error("Service worker registration failed", error);
    });
  }, []);

  return null;
}
