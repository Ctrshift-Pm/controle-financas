import { useState } from "react";
import { Pencil, Check, X, Truck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getVehicleNames, setVehicleName } from "@/lib/store";
import { VEHICLES } from "@/lib/types";

interface Props {
  onUpdated: () => void;
}

export function VehicleManager({ onUpdated }: Props) {
  const names = getVehicleNames();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (vehicleId: string) => {
    setEditingId(vehicleId);
    setEditValue(names[vehicleId] || vehicleId);
  };

  const save = () => {
    if (editingId && editValue.trim()) {
      setVehicleName(editingId, editValue.trim());
      onUpdated();
    }
    setEditingId(null);
  };

  return (
    <div className="shadow-card rounded-xl bg-card p-5">
      <h3 className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Veículos
      </h3>
      <div className="space-y-2">
        {VEHICLES.map((v) => (
          <div key={v} className="flex items-center justify-between rounded-lg bg-accent/30 px-3 py-2">
            {editingId === v ? (
              <div className="flex flex-1 items-center gap-2">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="h-7 text-sm"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && save()}
                />
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={save}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setEditingId(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium">{names[v] || v}</span>
                  {names[v] && names[v] !== v && (
                    <span className="text-xs text-muted-foreground">({v})</span>
                  )}
                </div>
                <button
                  onClick={() => startEdit(v)}
                  className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
