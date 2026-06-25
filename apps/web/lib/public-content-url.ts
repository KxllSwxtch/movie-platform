const PRODUCTION_APP_URL = "https://sesh-tv.com";

export type PublicContentLike = {
  id?: string | null;
  slug?: string | null;
  contentType?: string | null;
  type?: string | null;
};

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, "");
}

function isLocalOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1"
    );
  } catch {
    return false;
  }
}

function isIpOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname);
  } catch {
    return false;
  }
}

export function getPublicAppBaseUrl(baseUrl?: string): string {
  const isProduction = process.env.NODE_ENV === "production";
  const configured = normalizeBaseUrl(
    baseUrl || process.env.NEXT_PUBLIC_APP_URL || "",
  );

  if (
    configured &&
    !(isProduction && (isIpOrigin(configured) || isLocalOrigin(configured)))
  ) {
    return configured;
  }

  if (!isProduction && typeof window !== "undefined") {
    const origin = normalizeBaseUrl(window.location.origin);
    if (origin && isLocalOrigin(origin)) return origin;
  }

  return PRODUCTION_APP_URL;
}

export function getPublicContentPath(content: PublicContentLike): string {
  const slugOrId = content.slug || content.id || "";
  const encodedSlugOrId = encodeURIComponent(slugOrId);
  const type = (content.contentType || content.type || "").toUpperCase();

  switch (type) {
    case "SHORT":
      return `/shorts/${encodedSlugOrId}`;
    case "SERIES":
      return `/series/${encodedSlugOrId}`;
    case "TUTORIAL":
      return `/tutorials/${encodedSlugOrId}`;
    case "CLIP":
    case "VIDEO":
    default:
      return `/watch/${encodedSlugOrId}`;
  }
}

export function getPublicContentUrl(
  content: PublicContentLike,
  baseUrl?: string,
): string {
  return `${getPublicAppBaseUrl(baseUrl)}${getPublicContentPath(content)}`;
}
