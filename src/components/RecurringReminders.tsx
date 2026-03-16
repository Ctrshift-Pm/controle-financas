import { useState, useMemo } from "react";
import { Bell, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RecurringReminder, ExpenseCategory, SORTED_CATEGORIES, CATEGORY_LABELS } from "@/lib/types";
import { getRecurringReminders, saveRecurringReminder, deleteRecurringReminder } from "@/lib/store";
import { toast } from "sonner";

interface Props {
  onUpdated: () => void;
}

export function RecurringReminders({ onUpdated }: Props) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [day, setDay] = useState("5");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("imposto");

  const reminders = useMemo(() => {
    void refreshKey;
    return getRecurringReminders();
  }, [refreshKey]);

  const refresh = () => {
    setRefreshKey((k) => k + 1);
    onUpdated();
  };

  const handleAdd = () => {
    const numAmount = parseFloat(amount.replace(",", "."));
    if (!label.trim() || isNaN(numAmount) || numAmount <= 0) {
      toast.error("Preencha todos os campos.");
      return;
    }
    saveRecurringReminder({
      label: label.trim(),
      dayOfMonth: parseInt(day),
      amount: numAmount,
      category,
    });
    toast.success("Lembrete recorrente adicionado.");
    setLabel("");
    setAmount("");
    setAdding(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteRecurringReminder(id);
    toast("Lembrete removido.");
    refresh();
  };

  const today = new Date().getDate();

  return (
    <div className="shadow-card rounded-xl bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Lembretes Recorrentes
        </h3>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1 text-xs"
          onClick={() => setAdding(!adding)}
        >
          <Plus className="h-3 w-3" />
          Novo
        </Button>
      </div>

      {adding && (
        <div className="mb-4 space-y-2 rounded-lg border bg-muted/30 p-3">
          <Input
            placeholder="Ex: Imposto da nota fiscal"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="h-8 text-sm"
          />
          <div className="flex gap-2">
            <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTED_CATEGORIES.map(([key, lbl]) => (
                  <SelectItem key={key} value={key}>{lbl}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Dia"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              type="number"
              min={1}
              max={31}
              className="h-8 w-16 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Valor R$"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-8 text-sm flex-1"
            />
            <Button size="sm" className="h-8" onClick={handleAdd}>
              Salvar
            </Button>
          </div>
        </div>
      )}

      {reminders.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum lembrete recorrente.</p>
      ) : (
        <div className="space-y-2">
          {reminders.map((r) => {
            const isNear = Math.abs(r.dayOfMonth - today) <= 3 || (today > 25 && r.dayOfMonth <= 3);
            return (
              <div
                key={r.id}
                className={`flex items-center justify-between rounded-lg px-3 py-2 border ${
                  isNear
                    ? "border-warning/30 bg-warning/5"
                    : "border-border/50 bg-muted/20"
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Bell className={`h-3.5 w-3.5 ${isNear ? "text-warning" : "text-muted-foreground"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {CATEGORY_LABELS[r.category]} · Dia {r.dayOfMonth} ·{" "}
                      {r.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="rounded p-1 text-muted-foreground/50 hover:bg-destructive/10 hover:text-loss ml-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
