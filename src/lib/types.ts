export type ExpenseCategory =
  | "combustivel"
  | "contador"
  | "diaria"
  | "fgts"
  | "financiamento"
  | "imposto"
  | "manutencao"
  | "outros"
  | "rastreador"
  | "salario"
  | "seguro";

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  vehicle: string;
  amount: number;
  status: "pago" | "pendente";
}

export interface RecurringReminder {
  id: string;
  label: string;
  dayOfMonth: number; // dia do mês para lembrar
  amount: number;
  category: ExpenseCategory;
}

export interface DriverDaily {
  id: string;
  date: string;
  driverName: string;
  routes: number; // 2-4
  valuePerRoute: number;
  vehicle: string;
}

// Sorted alphabetically
export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  combustivel: "Combustível",
  contador: "Contador",
  diaria: "Diária",
  fgts: "FGTS",
  financiamento: "Financiamento",
  imposto: "Imposto",
  manutencao: "Manutenção",
  outros: "Outros",
  rastreador: "Rastreador",
  salario: "Salário",
  seguro: "Seguro",
};

export const SORTED_CATEGORIES = (Object.entries(CATEGORY_LABELS) as [ExpenseCategory, string][])
  .sort(([, a], [, b]) => a.localeCompare(b, "pt-BR"));

export const VEHICLES = ["Van 01", "Van 02", "Van 03", "Geral"];
