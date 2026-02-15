import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CURRENCY_CODE = "SLE";
export const CURRENCY_SYMBOL = "Le";

export function formatCurrency(amount: number) {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${CURRENCY_SYMBOL} ${safe.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCurrencyCompact(amount: number) {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${CURRENCY_SYMBOL} ${safe.toLocaleString("en-US")}`;
}
