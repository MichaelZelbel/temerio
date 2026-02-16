import { useEffect } from "react";

interface SeoProps {
  title?: string;
  description?: string;
  path?: string;
  canonicalUrl?: string;
  jsonLd?: Record<string, unknown>;
  noIndex?: boolean;
}

const SITE_NAME = "Temerio";
const BASE_URL = "https://temerio.lovable.app";

export function useSeo({ title, description, path, canonicalUrl, jsonLd, noIndex }: SeoProps) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Document-powered life timeline`;
    document.title = fullTitle;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    if (description) {
      setMeta("name", "description", description);
      setMeta("property", "og:description", description);
      setMeta("name", "twitter:description", description);
    }

    setMeta("property", "og:title", fullTitle);
    setMeta("name", "twitter:title", fullTitle);

    // noIndex for private pages
    if (noIndex) {
      setMeta("name", "robots", "noindex, nofollow");
    } else {
      const robotsEl = document.querySelector('meta[name="robots"]');
      if (robotsEl) robotsEl.remove();
    }

    // Canonical URL: explicit > path-based > auto from window.location
    const resolvedCanonical =
      canonicalUrl ||
      (path ? `${BASE_URL}${path}` : `${window.location.origin}${window.location.pathname}`);

    setMeta("property", "og:url", resolvedCanonical);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", resolvedCanonical);

    // JSON-LD
    const existingLd = document.getElementById("page-jsonld");
    if (jsonLd) {
      const script = existingLd || document.createElement("script");
      script.id = "page-jsonld";
      script.setAttribute("type", "application/ld+json");
      script.textContent = JSON.stringify(jsonLd);
      if (!existingLd) document.head.appendChild(script);
    } else if (existingLd) {
      existingLd.remove();
    }

    return () => {
      document.title = `${SITE_NAME} — Document-powered life timeline`;
      const ld = document.getElementById("page-jsonld");
      if (ld) ld.remove();
      const robots = document.querySelector('meta[name="robots"]');
      if (robots) robots.remove();
    };
  }, [title, description, path, canonicalUrl, jsonLd, noIndex]);
}
