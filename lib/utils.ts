import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
