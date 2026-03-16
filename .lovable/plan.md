

## Plano de Implementação

### 1. Corrigir erro no webhook WhatsApp (`toLocaleString` em `undefined`)

O erro ocorre na linha 218 do webhook quando `parsed.amount` é `undefined` (ex: mensagem "Coloque 1 diária para Valdir" — a IA não retorna um valor numérico). 

**Correção:** Adicionar suporte para ação `register_daily` no prompt da IA para interpretar mensagens de diárias. Também adicionar fallback `parsed.amount || 0` antes de chamar `toLocaleString` e validar campos obrigatórios antes do insert.

**Arquivo:** `supabase/functions/whatsapp-webhook/index.ts`

### 2. Mover lembretes para abaixo dos lançamentos

Atualmente os lembretes (PaymentReminders) ficam em uma aba separada. O usuário quer que apareçam logo abaixo da tabela de lançamentos na aba "Lançamentos".

**Arquivo:** `src/pages/Index.tsx` — mover o `<PaymentReminders>` e `<RecurringReminders>` para dentro do `TabsContent` de "lancamentos", após a `ExpenseTable`.

### 3. Diárias via WhatsApp: registrar com valor correto

Expandir o webhook para reconhecer mensagens como "1 diária para Valdir" e registrar automaticamente na tabela `expenses` com `category: "diaria"`, `amount: 45` (valor fixo por rota), `status: "pendente"`, `source: "whatsapp"`.

Nova action no prompt da IA: `register_daily` com campos `driver_name` e `routes` (default 1).

**Arquivo:** `supabase/functions/whatsapp-webhook/index.ts`

### 4. Melhorias de UI/UX (Nielsen, HEART, WCAG 2.0)

Aplicar melhorias em vários componentes:

- **Visibilidade do status do sistema (H1):** Adicionar badges de status mais visíveis na tabela de lançamentos, indicadores de loading states
- **Consistência e padrões (H4):** Padronizar border-radius, espaçamentos e tipografia em todos os cards
- **Prevenção de erros (H5):** Adicionar confirmação antes de deletar itens
- **Reconhecimento ao invés de memória (H6):** Melhorar labels e breadcrumbs nos tabs
- **Acessibilidade WCAG 2.0:** Adicionar `aria-labels`, melhorar contraste de cores (muted-foreground vs background), garantir focus states visíveis nos botões, adicionar `role` e `aria-live` em lembretes
- **HEART (Engagement/Task Success):** Melhorar feedback visual ao marcar como pago (animação), empty states mais informativos

**Arquivos:** `src/pages/Index.tsx`, `src/components/ExpenseTable.tsx`, `src/components/PaymentReminders.tsx`, `src/components/MetricCard.tsx`, `src/components/DriverDailies.tsx`

### Resumo de arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/whatsapp-webhook/index.ts` | Fix `toLocaleString`, adicionar `register_daily` |
| `src/pages/Index.tsx` | Mover lembretes para abaixo dos lançamentos, melhorias de acessibilidade |
| `src/components/ExpenseTable.tsx` | Confirmação de delete, aria-labels, melhor contraste |
| `src/components/PaymentReminders.tsx` | aria-live, focus states |
| `src/components/MetricCard.tsx` | Melhor contraste, aria-labels |
| `src/components/DriverDailies.tsx` | aria-labels, feedback visual |

