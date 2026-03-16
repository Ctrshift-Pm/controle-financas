import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getExpenses, getMonthlyRevenue } from "@/lib/store";

const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

interface Props {
  year: number;
}

export function RevenueChart({ year }: Props) {
  const data = useMemo(() => {
    const expenses = getExpenses();
    return MONTH_LABELS.map((label, i) => {
      const key = `${year}-${String(i + 1).padStart(2, "0")}`;
      const revenue = getMonthlyRevenue(key);
      const cost = expenses
        .filter((e) => {
          const d = new Date(e.date);
          return d.getFullYear() === year && d.getMonth() === i;
        })
        .reduce((s, e) => s + e.amount, 0);
      return { name: label, receita: revenue, custo: cost, margem: revenue - cost };
    });
  }, [year]);

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  return (
    <div className="shadow-card rounded-xl bg-card p-5">
      <h3 className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Receita vs Custo — {year}
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 90%)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(240 5% 46%)" />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} stroke="hsl(240 5% 46%)" />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: "hsl(0 0% 100%)",
                border: "1px solid hsl(240 6% 90%)",
                borderRadius: "0.375rem",
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="receita" name="Receita" fill="hsl(142 71% 45%)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="custo" name="Custo" fill="hsl(0 84% 60%)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
