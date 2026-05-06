const moneyFormatter = new Intl.NumberFormat("es-AR", {
  currency: "ARS",
  maximumFractionDigits: 0,
  style: "currency",
});

export function formatMoney(value: number) {
  return moneyFormatter.format(value);
}
