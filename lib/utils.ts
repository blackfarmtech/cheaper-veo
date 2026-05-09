import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Format USD with up to 3 decimal places — for per-second prices that
 * collapse visually when rounded to 2 decimals.
 */
export function formatUsdPrecise(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(cents / 100);
}

export function formatCredits(credits: number): string {
  return new Intl.NumberFormat("en-US").format(credits);
}

/**
 * Formats an amount (in cents) for the given ISO currency code.
 * Falls back to USD formatting if currency is null/undefined.
 */
export function formatMoney(
  cents: number,
  currency: string | null | undefined,
): string {
  const cur = (currency ?? "usd").toUpperCase();
  const locale = cur === "BRL" ? "pt-BR" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: cur,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatBrl(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
