/**
 * VISROSLOT Centralized Domain & Hostname Resolver
 * Dynamically resolves the active platform domain on Cloudflare (visroslot.pages.dev),
 * custom domain, or active request host.
 */

export function getPlatformBaseUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "https://visroslot.pages.dev";
}

export function getPlatformDisplayHost(): string {
  if (typeof window !== "undefined" && window.location?.host) {
    return window.location.host;
  }
  const full = getPlatformBaseUrl();
  return full.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function getBookingUrlForSlug(slug: string): string {
  const base = getPlatformBaseUrl();
  return `${base}/book/${slug}`;
}
