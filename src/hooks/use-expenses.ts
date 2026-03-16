import { useState, useEffect, useCallback } from "react";
import { getExpenses } from "@/lib/store";
import { Expense } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await getExpenses();
    setExpenses(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("expenses-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        () => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { expenses, loading, refresh };
}
