import type { ProductType } from "@/lib/engineering/types";

export type FelicityProductCategory =
  | "lithium_battery"
  | "gel_battery"
  | "hybrid_inverter"
  | "off_grid_inverter"
  | "charge_controller"
  | "solar_panel";

export type RawFelicityProductPage = {
  title: string;
  url: string;
  category: FelicityProductCategory | null;
  productType: ProductType;
  description: string;
  specs: Record<string, string>;
  images: string[];
  rawText: string;
};

function sanitizeText(value: unknown) {
  return decodeHtml(String(value || ""))
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripUnhelpfulBlocks(html: string) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, " ")
    .replace(/<form\b[\s\S]*?<\/form>/gi, " ")
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, " ");
}

function stripTags(html: string) {
  return sanitizeText(html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " "));
}

function absoluteUrl(value: string, baseUrl: string) {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return "";
  }
}

function getAttribute(tag: string, name: string) {
  const pattern = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i");
  return sanitizeText(tag.match(pattern)?.[1] || "");
}

function inferCategoryFromSignals(text: string): FelicityProductCategory | null {
  const value = text.toLowerCase();

  if (/\b(gel|agm)\b/.test(value) && /\bbatter/i.test(value)) return "gel_battery";
  if (/\b(lithium|lifepo4|li-?ion)\b/.test(value) && /\bbatter/i.test(value)) return "lithium_battery";
  if (/\boff[-\s]?grid\b/.test(value) && /\binverter\b/.test(value)) return "off_grid_inverter";
  if (/\bhybrid\b/.test(value) && /\binverter\b/.test(value)) return "hybrid_inverter";
  if (/\b(charge controller|solar controller|mppt controller|pwm controller|controller|mppt|pwm)\b/.test(value)) {
    return "charge_controller";
  }
  if (/\b(solar panel|pv module|photovoltaic module|mono(?:crystalline)?|poly(?:crystalline)?|\d{2,4}\s*w(?:p)?)\b/.test(value)) {
    return "solar_panel";
  }
  if (/\binverter\b/.test(value)) return "hybrid_inverter";
  if (/\bbatter/i.test(value)) return "lithium_battery";

  return null;
}

function inferCategoryFromModel(title: string, url: string): FelicityProductCategory | null {
  const signal = `${title} ${url}`.toLowerCase();

  if (/\b(?:lpbf|lpba|lfp|gel|agm|battery|lithium|lifepo4)\b/.test(signal)) return "lithium_battery";
  if (/\b(?:iv[a-z0-9-]{1,}|hiv[a-z0-9-]{1,}|inverter)\b/.test(signal)) return "hybrid_inverter";
  if (/\b(?:mppt|pwm|controller|scc)\b/.test(signal)) return "charge_controller";
  if (/\b(?:panel|module|pv)\b/.test(signal)) return "solar_panel";

  return null;
}

export function productTypeFromFelicityCategory(category: FelicityProductCategory | null): ProductType {
  if (category === "hybrid_inverter") return "hybrid_inverter";
  if (category === "off_grid_inverter") return "inverter";
  if (category === "charge_controller") return "charge_controller";
  if (category === "solar_panel") return "solar_panel";
  return "battery";
}

function extractTagText(html: string, tagName: string) {
  const match = html.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? stripTags(match[1]) : "";
}

function extractMetaContent(html: string, matcher: RegExp) {
  const match = html.match(matcher);
  return match ? getAttribute(match[0], "content") : "";
}

function collectDescription(html: string) {
  const meta = extractMetaContent(html, /<meta\b(?=[^>]*(?:name|property)=["'](?:description|og:description)["'])[^>]*>/i);
  if (meta) return meta.slice(0, 1800);

  const paragraphs = Array.from(html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi))
    .map((match) => stripTags(match[1]))
    .filter((text) => text.length >= 40 && !/cookie|copyright|whatsapp/i.test(text));
  const paragraphText = paragraphs.slice(0, 5).join(" ");
  if (paragraphText.length > 80) return paragraphText.slice(0, 1800);

  return stripTags(html).slice(0, 1800);
}

function collectSpecs(html: string) {
  const specs: Record<string, string> = {};

  for (const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = Array.from(row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi))
      .map((cell) => stripTags(cell[1]))
      .filter(Boolean);

    if (cells.length >= 2) {
      const key = cells[0];
      const value = cells.slice(1).join(" / ");
      if (key.length <= 90 && value.length <= 240) specs[key] = value;
    }
  }

  const terms = Array.from(html.matchAll(/<dt\b[^>]*>([\s\S]*?)<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/gi));
  for (const term of terms) {
    const key = stripTags(term[1]);
    const value = stripTags(term[2]);
    if (key && value) specs[key] = value;
  }

  for (const item of html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
    const text = stripTags(item[1]);
    const match = text.match(/^([^:：]{3,70})[:：]\s*(.{2,220})$/);
    if (!match) continue;
    specs[sanitizeText(match[1])] = sanitizeText(match[2]);
  }

  return specs;
}

function collectCategorySignals(html: string, baseUrl: string) {
  const signals: string[] = [];
  const seen = new Set<string>();

  const push = (value: string) => {
    const text = sanitizeText(value);
    if (!text || seen.has(text)) return;
    seen.add(text);
    signals.push(text);
  };

  for (const script of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    push(stripTags(script[1]));
  }

  for (const match of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = absoluteUrl(sanitizeText(match[1]), baseUrl);
    const label = stripTags(match[2]);
    if (!href) continue;
    if (/product-category|inverter|battery|panel|controller|mppt|pwm|lifepo4|gel/i.test(`${href} ${label}`)) {
      push(`${href} ${label}`);
    }
  }

  return signals.join(" ");
}

function collectImages(html: string, url: string) {
  const images = new Set<string>();

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0];
    const src = getAttribute(tag, "data-src") || getAttribute(tag, "data-large_image") || getAttribute(tag, "src");
    const absolute = src ? absoluteUrl(src, url) : "";
    if (absolute && !/logo|icon|spinner|placeholder/i.test(absolute)) images.add(absolute);
  }

  return Array.from(images).slice(0, 8);
}

function extractTitle(html: string) {
  return (
    extractTagText(html, "h1") ||
    extractMetaContent(html, /<meta\b(?=[^>]*property=["']og:title["'])[^>]*>/i) ||
    extractTagText(html, "title")
  ).replace(/\s*[-|]\s*Felicity.*$/i, "");
}

export function parseFelicityProductPage(html: string, url: string): RawFelicityProductPage | null {
  const cleanHtml = stripUnhelpfulBlocks(html);
  const title = extractTitle(cleanHtml);
  const description = collectDescription(cleanHtml);
  const specs = collectSpecs(cleanHtml);
  const rawText = stripTags(cleanHtml).slice(0, 5000);
  const categorySignals = collectCategorySignals(cleanHtml, url);
  const category =
    inferCategoryFromModel(title, url) ||
    inferCategoryFromSignals([url, title, description, Object.keys(specs).join(" "), categorySignals].join(" "));
  const hasProductSignal = category || Object.keys(specs).length >= 3 || /\/product\//i.test(url);
  const noisyTitle = /roofing services|home\s*-|^\s*all\s*-|^\s*-\s*/i.test(title);

  if (!title || noisyTitle || !hasProductSignal || !/\/(?:[a-z]{2}\/)?product\//i.test(url)) return null;

  return {
    title,
    url,
    category,
    productType: productTypeFromFelicityCategory(category),
    description,
    specs,
    images: collectImages(cleanHtml, url),
    rawText,
  };
}

export function extractFelicityLinks(html: string, baseUrl: string) {
  const links = new Set<string>();

  for (const match of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
    const absolute = absoluteUrl(sanitizeText(match[1]), baseUrl);
    if (absolute) links.add(absolute.replace(/#.*$/, ""));
  }

  return Array.from(links);
}
