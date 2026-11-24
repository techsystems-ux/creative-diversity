import type { Brand } from "./types";

const SYMBOL: Record<Brand["currency"], string> = { INR: "₹", USD: "$", AED: "AED " };

export function money(v: number, cur: Brand["currency"], digits = 0) {
  if (!isFinite(v)) return "—";
  const locale = cur === "INR" ? "en-IN" : "en-US";
  if (Math.abs(v) >= 100000 && cur === "INR") return `${SYMBOL[cur]}${(v / 100000).toLocaleString(locale, { maximumFractionDigits: 2 })}L`;
  if (Math.abs(v) >= 1000 && cur !== "INR") return `${SYMBOL[cur]}${(v / 1000).toLocaleString(locale, { maximumFractionDigits: 1 })}k`;
  return `${SYMBOL[cur]}${v.toLocaleString(locale, { maximumFractionDigits: digits, minimumFractionDigits: digits })}`;
}

export function num(v: number, digits = 0, cur: Brand["currency"] = "INR") {
  if (!isFinite(v)) return "—";
  return v.toLocaleString(cur === "INR" ? "en-IN" : "en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export function pct(v: number, digits = 1) {
  return isFinite(v) ? `${v.toFixed(digits)}%` : "—";
}

export function x(v: number) {
  return isFinite(v) ? `${v.toFixed(2)}x` : "—";
}
