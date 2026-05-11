const moneyFormatter = new Intl.NumberFormat("es-AR", {
  currency: "ARS",
  maximumFractionDigits: 0,
  style: "currency",
});

export function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

const ROLE_LABELS: Record<string, string> = {
  COOK:     "Administrador",
  EMPLOYEE: "Empleado",
  CUSTOMER: "Cliente",
};

export function formatRole(role: string | undefined | null): string {
  if (!role) return "—";
  return ROLE_LABELS[role] ?? role;
}
