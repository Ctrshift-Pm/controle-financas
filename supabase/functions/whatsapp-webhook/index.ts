import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let messageBody = "";
    let senderNumber = "";
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      messageBody = formData.get("Body")?.toString() || "";
      senderNumber = formData.get("From")?.toString() || "";
    } else {
      const json = await req.json();
      messageBody = json.message || json.Body || "";
      senderNumber = json.from || json.From || "manual";
    }

    if (!messageBody.trim()) {
      return new Response(
        JSON.stringify({ error: "Mensagem vazia" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um assistente de gestão de frota. Interprete mensagens de WhatsApp sobre gastos/despesas de uma empresa de transporte com vans.

Identifique a AÇÃO da mensagem:

1. **register_expense** — Quando o usuário quer REGISTRAR um novo gasto. Ex: "Troca de pneus Van 01 R$450", "Seguro R$400 pendente"
2. **mark_paid_by_description** — Quando o usuário diz que um item específico foi pago, usando a descrição. Ex: "Troca de pneus pago", "Parcela financiamento paga"
3. **mark_paid_by_category** — Quando o usuário diz que uma categoria inteira foi paga. Ex: "Contador paga", "Seguro pago", "Financiamento pago"

Para register_expense, extraia:
- date: data (YYYY-MM-DD, use ${new Date().toISOString().split("T")[0]} se não especificada)
- category: (manutencao, seguro, imposto, financiamento, salario, fgts, contador, rastreador, diaria, outros)
- description: descrição curta
- vehicle: veículo (ex: "Van 01", "Geral" se não especificado)
- amount: valor em reais
- status: "pago" ou "pendente" (default: "pago")

Para mark_paid_by_description, extraia:
- search_description: a descrição do item a ser marcado como pago

Para mark_paid_by_category, extraia:
- search_category: a categoria a ser marcada como paga (use os nomes normalizados: manutencao, seguro, imposto, financiamento, salario, fgts, contador, rastreador, diaria)

Se não parecer nenhuma dessas ações, use action "invalid".`,
          },
          { role: "user", content: messageBody },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "process_message",
              description: "Processa a mensagem do WhatsApp",
              parameters: {
                type: "object",
                properties: {
                  action: {
                    type: "string",
                    enum: ["register_expense", "mark_paid_by_description", "mark_paid_by_category", "invalid"],
                  },
                  date: { type: "string", description: "Data YYYY-MM-DD (para register_expense)" },
                  category: {
                    type: "string",
                    enum: ["manutencao", "seguro", "imposto", "financiamento", "salario", "fgts", "contador", "rastreador", "diaria", "outros"],
                  },
                  description: { type: "string" },
                  vehicle: { type: "string" },
                  amount: { type: "number" },
                  status: { type: "string", enum: ["pago", "pendente"] },
                  search_description: { type: "string", description: "Descrição do item a marcar como pago" },
                  search_category: {
                    type: "string",
                    enum: ["manutencao", "seguro", "imposto", "financiamento", "salario", "fgts", "contador", "rastreador", "diaria", "outros"],
                    description: "Categoria a marcar como paga",
                  },
                },
                required: ["action"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "process_message" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, tente novamente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return structured data");

    const parsed = JSON.parse(toolCall.function.arguments);

    // === INVALID ===
    if (parsed.action === "invalid") {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>❓ Não entendi. Envie algo como:\n• "Troca de pneus Van 01 R$450"\n• "Contador paga"\n• "Troca de pneus pago"</Message></Response>`;
      return new Response(twiml, { headers: { ...corsHeaders, "Content-Type": "text/xml" } });
    }

    // === MARK PAID BY DESCRIPTION ===
    if (parsed.action === "mark_paid_by_description") {
      const search = parsed.search_description || parsed.description || "";
      const { data: items, error: qErr } = await supabase
        .from("expenses")
        .select("*")
        .eq("status", "pendente")
        .ilike("description", `%${search}%`)
        .order("created_at", { ascending: false })
        .limit(1);

      if (qErr || !items || items.length === 0) {
        const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>❌ Nenhum item pendente encontrado com "${search}".</Message></Response>`;
        return new Response(twiml, { headers: { ...corsHeaders, "Content-Type": "text/xml" } });
      }

      const item = items[0];
      await supabase.from("expenses").update({ status: "pago" }).eq("id", item.id);

      const amt = Number(item.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
      const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>✅ Marcado como PAGO!\n📋 ${item.description}\n💰 R$ ${amt}\n📂 ${item.category}</Message></Response>`;
      return new Response(twiml, { headers: { ...corsHeaders, "Content-Type": "text/xml" } });
    }

    // === MARK PAID BY CATEGORY ===
    if (parsed.action === "mark_paid_by_category") {
      const cat = parsed.search_category || parsed.category || "";
      const { data: items, error: qErr } = await supabase
        .from("expenses")
        .select("*")
        .eq("status", "pendente")
        .eq("category", cat)
        .order("created_at", { ascending: false })
        .limit(1);

      if (qErr || !items || items.length === 0) {
        const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>❌ Nenhum item pendente na categoria "${cat}".</Message></Response>`;
        return new Response(twiml, { headers: { ...corsHeaders, "Content-Type": "text/xml" } });
      }

      const item = items[0];
      await supabase.from("expenses").update({ status: "pago" }).eq("id", item.id);

      const amt = Number(item.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
      const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>✅ Marcado como PAGO!\n📋 ${item.description}\n💰 R$ ${amt}\n📂 ${item.category}</Message></Response>`;
      return new Response(twiml, { headers: { ...corsHeaders, "Content-Type": "text/xml" } });
    }

    // === REGISTER EXPENSE ===
    const { data, error } = await supabase.from("expenses").insert({
      date: parsed.date,
      category: parsed.category,
      description: parsed.description,
      vehicle: parsed.vehicle || "Geral",
      amount: parsed.amount,
      status: parsed.status || "pago",
      source: "whatsapp",
    }).select().single();

    if (error) {
      console.error("DB insert error:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    const formattedAmount = parsed.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>✅ Registrado!\n📋 ${parsed.description}\n🚐 ${parsed.vehicle || "Geral"}\n💰 R$ ${formattedAmount}\n📅 ${parsed.date}\n📂 ${parsed.category}\n🔖 ${parsed.status || "pago"}</Message></Response>`;
    return new Response(twiml, { headers: { ...corsHeaders, "Content-Type": "text/xml" } });

  } catch (e) {
    console.error("Webhook error:", e);
    const errorMessage = e instanceof Error ? e.message : "Erro desconhecido";
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>❌ Erro ao processar: ${errorMessage}</Message></Response>`;
    return new Response(twiml, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/xml" },
    });
  }
});
