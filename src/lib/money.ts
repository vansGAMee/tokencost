import Decimal from "decimal.js";

const numberFormatter = new Intl.NumberFormat("en-US");
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

export function calculateInputCost(tokens: number, inputUsdPer1M: string): string {
  return new Decimal(tokens).mul(inputUsdPer1M).div(1_000_000).toDecimalPlaces(12).toString();
}

export function convertUsd(usd: string, rate: string): string {
  return new Decimal(usd).mul(rate).toDecimalPlaces(12).toString();
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: string): string {
  return `${dateTimeFormatter.format(new Date(value))} UTC`;
}

export function formatMoney(value: string, currency = "USD"): string {
  const amount = new Decimal(value);
  const decimals = amount.abs().lt(0.0001) && !amount.isZero() ? 8 : amount.abs().lt(0.01) && !amount.isZero() ? 5 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: decimals === 8 ? 2 : decimals,
    maximumFractionDigits: decimals,
  }).format(amount.toNumber());
}
