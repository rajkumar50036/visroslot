/**
 * VISROSLOT Centralized Domain & Hostname Resolver
 * Dynamically resolves the active platform domain whether hosted on Firebase (visroslot.web.app),
 * custom domain, or cloud edge.
 */

export function getPlatformBaseUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://visroslot.web.app")
  );
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
