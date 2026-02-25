export function roundMoney(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatMoney(n: number) {
  const fmt = new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 2,
  });
  return fmt.format(n);
}

export function parseMoney(input: string) {
  const normalized = input.replace(",", ".").replace(/\s/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

