import { useMemo } from "react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { getExpenses, getMonthlyRevenue } from "@/lib/store";
import { CATEGORY_LABELS, ExpenseCategory } from "@/lib/types";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface Props {
  year: number;
  month: number;
}

function getMonthKey(y: number, m: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}

function getPrev(y: number, m: number) {
  return m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 };
}

function DiffBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  const diff = previous === 0 ? 100 : ((current - previous) / previous) * 100;
  const isUp = diff > 0;
  const color = isUp ? "text-loss" : "text-profit";
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${color}`}>
      {isUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(diff).toFixed(0)}%
    </span>
  );
}

export function MonthComparison({ year, month }: Props) {
  const prev = getPrev(year, month);

  const comparison = useMemo(() => {
    const expenses = getExpenses();
    const curKey = getMonthKey(year, month);
    const prevKey = getMonthKey(prev.y, prev.m);

    const curRevenue = getMonthlyRevenue(curKey);
    const prevRevenue = getMonthlyRevenue(prevKey);

    const curExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    const prevExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === prev.y && d.getMonth() === prev.m;
    });

    const curTotal = curExpenses.reduce((s, e) => s + e.amount, 0);
    const prevTotal = prevExpenses.reduce((s, e) => s + e.amount, 0);

    // Per-category comparison
    const categories = new Set<ExpenseCategory>();
    [...curExpenses, ...prevExpenses].forEach((e) => categories.add(e.category));

    const catData = Array.from(categories)
      .map((cat) => ({
        category: cat,
        current: curExpenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
        previous: prevExpenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
      }))
      .sort((a, b) => CATEGORY_LABELS[a.category].localeCompare(CATEGORY_LABELS[b.category], "pt-BR"));

    return { curRevenue, prevRevenue, curTotal, prevTotal, catData };
  }, [year, month, prev.y, prev.m]);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const prevLabel = `${MONTHS[prev.m].substring(0, 3)}/${prev.y}`;
  const curLabel = `${MONTHS[month].substring(0, 3)}/${year}`;

  return (
    <div className="shadow-card rounded-xl bg-card p-5">
      <h3 className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Comparativo: {curLabel} vs {prevLabel}
      </h3>

      <div className="space-y-3">
        {/* Revenue */}
        <div className="flex items-center justify-between rounded-lg bg-accent/50 px-3 py-2">
          <span className="text-sm">Receita</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{fmt(comparison.prevRevenue)}</span>
            <span className="text-sm font-semibold tabular-nums">{fmt(comparison.curRevenue)}</span>
            <DiffBadge current={comparison.curRevenue} previous={comparison.prevRevenue} />
          </div>
        </div>

        {/* Total cost */}
        <div className="flex items-center justify-between rounded-lg bg-accent/50 px-3 py-2">
          <span className="text-sm">Custo Total</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{fmt(comparison.prevTotal)}</span>
            <span className="text-sm font-semibold tabular-nums">{fmt(comparison.curTotal)}</span>
            <DiffBadge current={comparison.curTotal} previous={comparison.prevTotal} />
          </div>
        </div>

        {/* Per category */}
        {comparison.catData.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {comparison.catData.map(({ category, current, previous }) => (
              <div key={category} className="flex items-center justify-between px-3 py-1.5 text-sm">
                <span className="text-muted-foreground">{CATEGORY_LABELS[category]}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground tabular-nums">{fmt(previous)}</span>
                  <span className="tabular-nums font-medium">{fmt(current)}</span>
                  <DiffBadge current={current} previous={previous} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
