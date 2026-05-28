import { extractFelicityLinks, parseFelicityProductPage, type RawFelicityProductPage } from "@/lib/rag/felicity-parser";

export type FelicityCrawlerOptions = {
  startUrl?: string;
  maxPages?: number;
  timeoutMs?: number;
  concurrency?: number;
};

export type FelicityCrawlResult = {
  products: RawFelicityProductPage[];
  visitedCount: number;
  failedPages: Array<{ url: string; reason: string }>;
  skippedDuplicates: number;
};

const DEFAULT_START_URL = "https://felicitysolar.com";
const PRODUCT_URL_SIGNAL = /\/product\/|battery|inverter|solar-panel|solar_panel|charge-controller|charge_controller|controller/i;
const SKIP_URL_SIGNAL = /\/(blog|news|contact|about|cart|checkout|account|privacy|terms|tag|author|wp-json)\b|[?&](replytocom|add-to-cart)=/i;

function sanitizeText(value: unknown) {
  return String(value || "").trim();
}

function normalizeUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";
    url.search = "";
    if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString();
  } catch {
    return "";
  }
}

function sameHost(url: string, host: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "") === host.replace(/^www\./, "");
  } catch {
    return false;
  }
}

function shouldSkipUrl(url: string) {
  const value = url.toLowerCase();
  if (SKIP_URL_SIGNAL.test(value)) return true;
  if (/\.(jpg|jpeg|png|webp|gif|svg|pdf|zip|rar|docx?|xlsx?)$/i.test(value)) return true;
  return false;
}

function shouldPrioritizeUrl(url: string) {
  return PRODUCT_URL_SIGNAL.test(url);
}

async function fetchText(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "OduzzAI/1.0 (+https://www.oduzzconcept.com.ng)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!/html|xml|text/i.test(contentType)) {
      throw new Error(`Unsupported content type: ${contentType || "unknown"}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function discoverSitemapUrls(startUrl: string, timeoutMs: number) {
  const urls = new Set<string>();
  const sitemapUrl = new URL("/sitemap.xml", startUrl).toString();

  try {
    const xml = await fetchText(sitemapUrl, timeoutMs);
    for (const match of xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)) {
      const url = normalizeUrl(sanitizeText(match[1]));
      if (url) urls.add(url);
    }
  } catch {
    return [];
  }

  return Array.from(urls);
}

function pushDiscoveredUrls({
  urls,
  queue,
  queued,
  visited,
  host,
}: {
  urls: string[];
  queue: string[];
  queued: Set<string>;
  visited: Set<string>;
  host: string;
}) {
  const productUrls: string[] = [];
  const otherUrls: string[] = [];

  for (const rawUrl of urls) {
    const url = normalizeUrl(rawUrl);
    if (!url || queued.has(url) || visited.has(url)) continue;
    if (!sameHost(url, host) || shouldSkipUrl(url)) continue;

    queued.add(url);
    if (shouldPrioritizeUrl(url)) productUrls.push(url);
    else otherUrls.push(url);
  }

  queue.unshift(...productUrls.reverse());
  queue.push(...otherUrls);
}

export async function crawlFelicityProducts(options: FelicityCrawlerOptions = {}): Promise<FelicityCrawlResult> {
  const startUrl = normalizeUrl(options.startUrl || DEFAULT_START_URL) || DEFAULT_START_URL;
  const host = new URL(startUrl).hostname.replace(/^www\./, "");
  const maxPages = Math.max(10, options.maxPages || 180);
  const timeoutMs = Math.max(2500, options.timeoutMs || 12000);
  const queue = [startUrl];
  const queued = new Set(queue);
  const visited = new Set<string>();
  const productUrls = new Set<string>();
  const products: RawFelicityProductPage[] = [];
  const failedPages: FelicityCrawlResult["failedPages"] = [];
  let skippedDuplicates = 0;

  pushDiscoveredUrls({
    urls: await discoverSitemapUrls(startUrl, timeoutMs),
    queue,
    queued,
    visited,
    host,
  });

  while (queue.length && visited.size < maxPages) {
    const url = queue.shift();
    if (!url || visited.has(url)) continue;
    visited.add(url);

    try {
      const html = await fetchText(url, timeoutMs);
      const links = extractFelicityLinks(html, url);
      pushDiscoveredUrls({ urls: links, queue, queued, visited, host });

      if (!shouldPrioritizeUrl(url) && !/product/i.test(html)) continue;

      const product = parseFelicityProductPage(html, url);
      if (!product) continue;
      if (productUrls.has(product.url)) {
        skippedDuplicates += 1;
        continue;
      }

      productUrls.add(product.url);
      products.push(product);
    } catch (error) {
      failedPages.push({
        url,
        reason: error instanceof Error ? error.message : "Unknown crawl error",
      });
    }
  }

  return {
    products,
    visitedCount: visited.size,
    failedPages,
    skippedDuplicates,
  };
}
