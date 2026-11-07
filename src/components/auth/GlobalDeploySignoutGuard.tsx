"use client";

import { useEffect } from "react";
import { getFirebaseClient } from "@/lib/firebase/client";

const DEPLOY_SIGNOUT_FLAG = "visroslot_deploy_signout_20261101_v2";

/**
 * GlobalDeploySignoutGuard
 * Enforces a clean slate across the entire website upon deployment.
 * Any client or visitor opening the application will have any stale
 * session tokens, cached authentication records, and cookies thoroughly purged.
 */
export function GlobalDeploySignoutGuard() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hasExecuted = localStorage.getItem(DEPLOY_SIGNOUT_FLAG);
    if (!hasExecuted) {
      // 1. Purge all legacy & active session cookies
      const cookieNames = [
        "visroslot_session",
        "slotora_session",
        "__session",
        "next-auth.session-token",
      ];

      cookieNames.forEach((name) => {
        document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        document.cookie = `${name}=; path=/; domain=${window.location.hostname}; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      });

      // 2. Clear browser storages
      try {
        sessionStorage.clear();
      } catch (e) {}

      // 3. Force sign out of Firebase Client SDK
      try {
        const { auth } = getFirebaseClient();
        if (auth) {
          import("firebase/auth").then(({ signOut }) => {
            signOut(auth).catch(() => {});
          });
        }
      } catch (e) {}

      // 4. Mark signout as completed for this browser
      localStorage.setItem(DEPLOY_SIGNOUT_FLAG, "true");
    }
  }, []);

  return null;
}
