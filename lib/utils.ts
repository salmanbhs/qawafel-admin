import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize Arabic text for search comparison.
 * أ/إ/آ → ا, ة → ه, ى → ي, strips diacritics (tashkeel).
 */
export function normalizeArabic(text: string): string {
  return text
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670]/g, "") // strip tashkeel
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");
}

/**
 * Custom cmdk filter with Arabic normalization.
 * Returns 1 (match) or 0 (no match).
 */
export function arabicCommandFilter(value: string, search: string): number {
  const normalizedValue = normalizeArabic(value).toLowerCase();
  const normalizedSearch = normalizeArabic(search).toLowerCase();
  return normalizedValue.includes(normalizedSearch) ? 1 : 0;
}

export function formatDate(date: string | Date, locale = "ar") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-BH" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatCurrency(amount: number, currency = "BHD", locale = "ar") {
  return new Intl.NumberFormat(locale === "ar" ? "ar-BH" : "en-BH", {
    style: "currency",
    currency,
  }).format(amount);
}

export function getInitials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

export function decodeJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(base64));
  } catch {
    return null;
  }
}

export function msUntilExpiry(token: string): number {
  const payload = decodeJwt(token);
  if (!payload?.exp) return 0;
  return payload.exp * 1000 - Date.now();
}
