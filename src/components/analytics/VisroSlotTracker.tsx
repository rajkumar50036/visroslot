"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function VisroSlotTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    // Strict filter: Exclude internal business dashboard and Super Admin
    if (
      pathname.startsWith("/app") ||
      pathname.startsWith("/super-admin") ||
      pathname.startsWith("/_")
    ) {
      return;
    }

    // Avoid duplicate triggers on same path
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;

    try {
      // Get or create anonymous visitor token
      let vid = "";
      if (typeof window !== "undefined") {
        vid = localStorage.getItem("visroslot_vid") || "";
        if (!vid) {
          vid = "v_" + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
          localStorage.setItem("visroslot_vid", vid);
        }

        const device = /Mobi|Android/i.test(navigator.userAgent)
          ? "mobile"
          : /Tablet|iPad/i.test(navigator.userAgent)
          ? "tablet"
          : "desktop";

        let eventName = "page_view";
        if (pathname.includes("/pricing")) eventName = "pricing_view";
        else if (pathname.includes("/register")) eventName = "register_start";
        else if (pathname.startsWith("/book/")) eventName = "booking_portal_view";

        const payload = {
          visitorId: vid,
          eventName,
          path: pathname,
          referrer: document.referrer || "direct",
          device,
        };

        // Send analytics beacon
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/analytics/collect", JSON.stringify(payload));
        } else {
          fetch("/api/analytics/collect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            keepalive: true,
          }).catch(() => {});
        }
      }
    } catch (e) {
      // Non-blocking
    }
  }, [pathname]);

  return null;
}
