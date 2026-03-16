import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Expense, CATEGORY_LABELS } from "@/lib/types";
import { getVehicleName } from "@/lib/store";
import { Button } from "@/components/ui/button";

interface Props {
  expenses: Expense[];
  onMarkPaid: (id: string) => void;
}

export function PaymentReminders({ expenses, onMarkPaid }: Props) {
  const pending = useMemo(
    () =>
      expenses
        .filter((e) => e.status === "pendente")
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [expenses]
  );

  const recentlyPaid = useMemo(
    () =>
      expenses
        .filter((e) => e.status === "pago")
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5),
    [expenses]
  );

  if (pending.length === 0 && recentlyPaid.length === 0) {
    return (
      <div className="shadow-card rounded-xl bg-card p-5">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Lembretes de Pagamento
        </h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Nenhum pagamento registrado.
        </div>
      </div>
    );
  }

  const totalPending = pending.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="shadow-card rounded-xl bg-card p-5">
      {/* Pendentes */}
      {pending.length > 0 && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Pagamentos Pendentes
            </h3>
            <span className="inline-flex items-center gap-1 rounded-md bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
              <AlertTriangle className="h-3 w-3" />
              {pending.length} pendente{pending.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {pending.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between rounded-lg border border-warning/20 bg-warning/5 px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{CATEGORY_LABELS[e.category]}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {e.description ? `${e.description} · ` : ""}
                    {getVehicleName(e.vehicle)} · {new Date(e.date).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-sm font-semibold tabular-nums text-warning whitespace-nowrap">
                    {e.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-profit hover:bg-profit/10 hover:text-profit"
                    onClick={() => onMarkPaid(e.id)}
                    title="Marcar como pago"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t pt-3">
            <span className="text-xs text-muted-foreground">Total pendente</span>
            <span className="text-sm font-bold tabular-nums text-warning">
              {totalPending.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>
        </>
      )}

      {/* Pagos recentes */}
      {recentlyPaid.length > 0 && (
        <div className={pending.length > 0 ? "mt-4 pt-4 border-t" : ""}>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Últimos Pagos
          </h3>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {recentlyPaid.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between rounded-lg px-3 py-1.5 bg-profit/5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">{CATEGORY_LABELS[e.category]}</p>
                  <p className="text-xs text-muted-foreground/70 truncate">
                    {new Date(e.date).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <span className="text-sm tabular-nums text-profit">
                  {e.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
