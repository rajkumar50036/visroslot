"use client";

import React, { useEffect, useState } from "react";
import { ExternalLink, Copy, Check, X, Compass } from "lucide-react";

/**
 * InAppBrowserBreakout:
 * Automatically detects if the website is opened inside Instagram's or Facebook's in-app browser.
 * On Android: Automatically attempts redirect to Google Chrome AND shows a one-tap "Open in Google Chrome" bar.
 * On iOS: Displays a helpful guide banner to open in Safari / Chrome.
 */
export function InAppBrowserBreakout() {
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [chromeIntentUrl, setChromeIntentUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return;

    const ua = navigator.userAgent || navigator.vendor || (window as any).opera || "";
    const isInstagram = /Instagram/i.test(ua);
    const isFacebook = /FBAN|FBAV/i.test(ua);
    const inApp = isInstagram || isFacebook;
    const isAndroidDevice = /Android/i.test(ua);
    const isIOSDevice = /iPhone|iPad|iPod/i.test(ua);

    if (inApp) {
      setIsInAppBrowser(true);
      const cleanUrl = window.location.href.replace(/^https?:\/\//, "");

      if (isAndroidDevice) {
        setIsAndroid(true);
        const intent = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end;`;
        setChromeIntentUrl(intent);
        // Automatic immediate redirect to Google Chrome on Android
        try {
          window.location.href = intent;
        } catch (e) {
          console.warn("Intent redirect error:", e);
        }
      } else if (isIOSDevice) {
        setIsIOS(true);
      }
    }
  }, []);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Do not render if not in in-app browser or dismissed
  if (!isInAppBrowser || dismissed) {
    return null;
  }

  return (
    <aside
      aria-label="Browser notice"
      className="sticky top-0 z-[100] w-full bg-[#101A2B] text-white border-b border-[#C49A46]/40 px-4 py-2.5 shadow-xl text-xs"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Compass className="w-4 h-4 text-[#C49A46] shrink-0" />
          <p className="text-[11px] sm:text-xs text-slate-200 leading-snug">
            {isAndroid ? (
              <>
                For the best experience and fast 1-tap Google login, open VISROSLOT directly in <strong className="text-[#C49A46]">Google Chrome</strong>.
              </>
            ) : (
              <>
                For Google Sign-In & full booking features, tap <strong className="text-white">•••</strong> in the top-right and select <strong className="text-[#C49A46]">Open in Safari</strong> or <strong className="text-[#C49A46]">Open in Chrome</strong>.
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isAndroid && chromeIntentUrl ? (
            <a
              href={chromeIntentUrl}
              className="px-3.5 py-1.5 text-xs font-mono font-bold rounded-xl bg-gradient-to-r from-gold-400 via-gold-300 to-gold-500 text-navy-950 flex items-center gap-1.5 shadow-md hover:brightness-105 active:scale-95 transition-all"
            >
              <span>Open in Google Chrome</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 text-xs font-mono font-bold rounded-xl bg-[#C49A46] hover:bg-[#D9B66E] text-navy-950 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Link Copied!" : "Copy Link"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
