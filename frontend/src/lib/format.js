export function formatBWP(value) {
  if (value == null || isNaN(value)) return "BWP 0";
  return new Intl.NumberFormat("en-BW", {
    style: "currency",
    currency: "BWP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function formatBWPCompact(value) {
  if (value == null || isNaN(value)) return "BWP 0";
  return `BWP ${Number(value).toLocaleString("en-BW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
