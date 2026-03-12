# Auditoria técnica e roadmap de finalização (CheckAuto)

## Resumo executivo

- **Seu mentor está no caminho certo** sobre os 4 bugs críticos e a sequência geral de entrega.
- A auditoria confirma que:
  - o bug de valores com vírgula existe no Checklist/PDF;
  - há risco real de duplicação de cliente por normalização incompleta;
  - o upload de logo hoje só persiste no clique de “Salvar”; 
  - listeners globais podem se acumular por falta de guard de inicialização.
- **Ajuste recomendado de prioridade**: incluir **painel/sistema de super admin e onboarding de oficinas** como trilha de prioridade alta (paralela ao Financeiro), pois isso é bloqueador para operação multi-tenant com aprovação de novos clientes.

---

## Evidências da auditoria (código atual)

## 1) Bugs críticos

### 1.1 parseFloat com vírgula BR (confirmado)
No checklist, os totais usam `parseFloat` diretamente em valores digitados em formato BR (`"12,34"`), o que pode truncar/zerar somas silenciosamente.

- Cálculo de totais e coleta de serviços/peças usam `parseFloat` sem normalização BR. 

### 1.2 Cliente duplicado (confirmado parcialmente)
A busca no `salvarChecklist()` já usa `trim().toLowerCase()` no nome salvo, mas **não aplica `trim()` no valor digitado** antes da comparação final (e não remove acentos), mantendo chance de duplicata semântica.

### 1.3 Logo some após reload (confirmado)
No upload do logo em Configurações, a imagem é colocada em `AppState` e preview local, mas a persistência no banco ocorre apenas em `salvarConfiguracoes()`.

### 1.4 Listeners acumulados no autocomplete (confirmado)
`setupAutoCompleteGenerico()` registra listener global em `document` toda vez que chamado, sem flag/guard por seletor.

---

## 2) Financeiro

O módulo está **bem avançado**: há dashboard, contas a pagar/receber/fixas, fluxo de caixa e sincronização de OS para contas a receber.

### Implementado e funcional no código
- Dashboard financeiro com cartões (`A Pagar`, `A Receber`, `Saldo Atual`).
- CRUD de contas a pagar/receber/fixas.
- Marcação de pagamento (`pagarConta`) e recebimento de parcela (`receberConta`).
- Fluxo de caixa montado por movimentos (entradas/saídas).
- Sync OS → contas a receber (`syncContasReceberFromOS`).

### Pontos que exigem validação/correção
- Se o **Saldo Atual** permanece `R$ 0,00`, o problema tende a ser dados/estado (sem `valor_recebido` ou sem status `paga`) e/ou ordem de atualização da tela, não ausência de função.
- Fluxo hoje usa `vencimento` como data de movimento para entradas e saídas; pode divergir de regime de caixa real (data de baixa).
- Conta fixa usa `pago_este_mes` simples, sem histórico por competência (limitação de rastreabilidade mensal).

---

## 3) Módulos novos

### Status real hoje
- **Histórico, Relatórios, Estoque, Fornecedores, Funcionários** existem no menu, mas estão como “Em desenvolvimento” na página.
- Não há arquivos JS dedicados a fornecedores/funcionários/estoque/relatórios com CRUD completo nesta versão.

Conclusão: esses módulos estão **planejados na UI**, mas **não concluídos** no fluxo de negócio.

---

## 4) Super admin e aprovação de novos clientes

### Gap confirmado
- Login já lê `role` e `oficina_id`, porém redireciona todos para `index.html` e comenta que o admin ainda não está pronto.
- Não há `admin.html`/painel de aprovação implementado no repositório.

### Impacto
Sem trilha de super admin, o onboarding/aprovação de novas oficinas/clientes fica sem governança operacional.

---

## Roadmap recomendado (priorizado)

## Fase 0 — Correções críticas (4 PRs pequenos, imediato)
1. **Fix parse BR no checklist/PDF** (parser utilitário único para moeda BR em inputs).
2. **Fix deduplicação de cliente** (`normalizeName`: trim + lower + remover acento + colapsar espaços).
3. **Fix persistência imediata de logo** (upload grava em Supabase no `change`, com feedback).
4. **Fix listeners acumulados** (guard idempotente em autocomplete/teclado/upload).

## Fase 1 — Governança (Super Admin) [subir prioridade]
5. **Painel Super Admin v1**: fila de aprovação (`pendente/aprovado/rejeitado`) para novos cadastros de oficina.
6. **RBAC mínimo**: rotas e UI por `role` (`superadmin`, `admin_oficina`, `user`).
7. **Onboarding seguro**: usuário só acessa app operacional se oficina estiver aprovada.

## Fase 2 — Financeiro “produção”
8. **Diagnóstico e correção do Saldo Atual** (dataset + regra de baixa + testes manuais guiados).
9. **Baixa de pagamento/recebimento com data real de baixa** (separar vencimento x competência x baixa).
10. **Fluxo de caixa por período com regime de caixa** e exportação básica.
11. **Contas fixas com recorrência por competência** (histórico mensal).
12. **OS → contas a receber** com idempotência robusta e trilha de auditoria.

## Fase 3 — Módulos operacionais
13. **Histórico (read-only)** com filtros por cliente/placa/OS/status/data.
14. **Fornecedores (CRUD + tabela Supabase + vínculo com contas a pagar)**.
15. **Funcionários (CRUD + vínculo com OS/checklist)**.
16. **Estoque (CRUD + movimentações + baixa automática por checklist/OS)**.
17. **Relatórios** (último, dependente da consistência dos módulos acima).

## Fase 4 — Débito técnico e qualidade
18. Padronizar `logo` vs `logo_url`.
19. Extrair utilitário `getPdfSafeImage()` e consolidar tratamento de imagem.
20. Smoke tests de PDF + testes de regressão dos parsers de moeda.
21. Telemetria mínima de erros (console estruturado + rastreio de falhas de sync).

---

## Plano de PRs (sugestão prática)

- **Sprint A (rápida):** PR-01 a PR-04 (bugs críticos) + PR-05 (Super Admin skeleton).
- **Sprint B:** PR-06/07 (aprovação + RBAC) + PR-08/09 (saldo/baixa financeira).
- **Sprint C:** PR-10/11/12 (fluxo/recorrência/idempotência OS).
- **Sprint D:** PR-13 a PR-17 (módulos novos) + PR-18+ (débito técnico/tests).

---

## Resposta objetiva à sua pergunta

- **“Está correto?”** → **Sim, em grande parte.**
- **“Podemos implementar?”** → **Sim, e a base atual permite começar imediatamente.**
- **Ajuste essencial:** elevar **Super Admin + aprovação** para prioridade alta, em paralelo às correções críticas, para não bloquear crescimento e governança do sistema.
