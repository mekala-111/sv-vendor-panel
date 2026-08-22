/** Base URL for the public guest site (sv_live_user). */
export function getConfiguredPublicEventBase(): string {
  return (
    process.env.NEXT_PUBLIC_PUBLIC_EVENT_BASE_URL ||
    process.env.PUBLIC_EVENT_BASE_URL ||
    "http://127.0.0.1:3002"
  ).replace(/\/$/, "");
}

/**
 * Public guest URL for an event slug.
 * Uses /event/{slug} so it never collides with marketing routes.
 */
export function buildPublicEventPathUrl(base: string, slug: string): string {
  const cleanSlug = String(slug || "")
    .trim()
    .replace(/^\/+/, "");
  if (!cleanSlug) return "";
  return `${base.replace(/\/$/, "")}/event/${encodeURIComponent(cleanSlug)}`;
}

/**
 * When the vendor panel is opened via LAN IP (e.g. http://192.168.1.10:3001)
 * but PUBLIC_EVENT_BASE_URL is localhost/127.0.0.1, rewrite the QR URL to the
 * same LAN host so a phone can open the event page.
 */
export function resolveScannablePublicEventUrl(
  slug: string,
  configuredBase = getConfiguredPublicEventBase()
): string {
  const pathUrl = buildPublicEventPathUrl(configuredBase, slug);
  if (!pathUrl || typeof window === "undefined") return pathUrl;

  try {
    const configured = new URL(configuredBase);
    const pageHost = window.location.hostname;
    const isLoopback =
      configured.hostname === "localhost" || configured.hostname === "127.0.0.1";
    const pageIsLoopback = pageHost === "localhost" || pageHost === "127.0.0.1";

    if (isLoopback && !pageIsLoopback) {
      const publicPort =
        process.env.NEXT_PUBLIC_PUBLIC_EVENT_PORT ||
        configured.port ||
        "3002";
      return `${window.location.protocol}//${pageHost}:${publicPort}/event/${encodeURIComponent(slug)}`;
    }
  } catch {
    /* keep configured */
  }

  return pathUrl;
}

export function isLoopbackPublicBase(base = getConfiguredPublicEventBase()): boolean {
  return /localhost|127\.0\.0\.1/i.test(base);
}
