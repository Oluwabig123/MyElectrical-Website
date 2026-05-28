import { extractFelicityLinks, parseFelicityProductPage, type RawFelicityProductPage } from "@/lib/rag/felicity-parser";

export type FelicityCrawlerOptions = {
  startUrl?: string;
  maxPages?: number;
  timeoutMs?: number;
  delayMs?: number;
  concurrency?: number;
};

export type FelicityCrawlResult = {
  products: RawFelicityProductPage[];
  visitedCount: number;
  failedPages: Array<{ url: string; reason: string }>;
  skippedDuplicates: number;
};

const DEFAULT_START_URL = "https://africa.felicitysolar.com";
const PRODUCT_URL_SIGNAL = /\/(?:[a-z]{2}\/)?product\//i;
const DISCOVERY_URL_SIGNAL = /\/product\/|battery|inverter|solar-panel|solar_panel|charge-controller|charge_controller|controller|ess|combiner/i;
const SKIP_URL_SIGNAL = /\/(blog|news|contact|about|cart|checkout|account|privacy|terms|tag|author|wp-json)\b|[?&](replytocom|add-to-cart)=/i;

function sanitizeText(value: unknown) {
  return String(value || "").trim();
}

function normalizeUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";
    url.search = "";
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
  if (/\/[a-z]{2}(?:\/|$)/i.test(value) && !PRODUCT_URL_SIGNAL.test(value)) return true;
  if (/\.(jpg|jpeg|png|webp|gif|svg|pdf|zip|rar|docx?|xlsx?)$/i.test(value)) return true;
  return false;
}

function shouldPrioritizeUrl(url: string) {
  return DISCOVERY_URL_SIGNAL.test(url);
}

function shouldParseProductUrl(url: string) {
  return PRODUCT_URL_SIGNAL.test(url);
}

async function fetchText(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Referer: "https://www.google.com/",
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

function wait(ms: number) {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
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
  const delayMs = Math.max(0, options.delayMs ?? 350);
  const seedUrls = [
    startUrl,
    normalizeUrl(new URL("/hybrid-inverter/", startUrl).toString()),
    normalizeUrl(new URL("/all-off-grid-inverter/", startUrl).toString()),
    normalizeUrl(new URL("/all-lithium-battery/", startUrl).toString()),
    normalizeUrl(new URL("/gel-battery/", startUrl).toString()),
    normalizeUrl(new URL("/product-category/solar-panel/", startUrl).toString()),
    normalizeUrl(new URL("/product-category/solar-charge-controller/", startUrl).toString()),
  ].filter(Boolean);
  const queue = Array.from(new Set(seedUrls));
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
      await wait(delayMs);
      const html = await fetchText(url, timeoutMs);
      const links = extractFelicityLinks(html, url);
      pushDiscoveredUrls({ urls: links, queue, queued, visited, host });

      if (!shouldParseProductUrl(url)) continue;

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
