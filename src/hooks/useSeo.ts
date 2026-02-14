import { useEffect } from "react";

interface SeoProps {
  title?: string;
  description?: string;
  path?: string;
  jsonLd?: Record<string, unknown>;
}

const SITE_NAME = "Temerio";
const BASE_URL = "https://temerio-design-foundation.lovable.app";

export function useSeo({ title, description, path, jsonLd }: SeoProps) {
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

    if (path) {
      const url = `${BASE_URL}${path}`;
      setMeta("property", "og:url", url);
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.setAttribute("rel", "canonical");
        document.head.appendChild(canonical);
      }
      canonical.setAttribute("href", url);
    }

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
    };
  }, [title, description, path, jsonLd]);
}
