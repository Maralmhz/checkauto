# Roadmap de Melhorias — Checkauto

Este roadmap consolida os problemas levantados em testes reais e organiza uma sequência de execução por impacto no negócio, risco técnico e esforço.

## Objetivos

- Estabilizar fluxos críticos (Veículos, OS, Agendamento e Login).
- Reduzir erros operacionais e inconsistências de dados.
- Melhorar UX de busca, histórico e permissões por perfil.
- Criar base para escala com rastreabilidade (issues por etapa).

---

## Fase 0 — Hotfix imediato (1 a 2 dias)

### 0.1 Veículos: edição, exclusão e vínculo com cliente

**Problemas reportados**
- Erro ao editar (`Cannot set properties of null` em `openVeiculoModal`).
- Exclusão bloqueada por FK em `checklists` (`23503`).
- Campo de seleção/busca de cliente não vincula corretamente.

**Ações**
- Garantir preenchimento de campos com checagem de existência no DOM.
- Tratar erro FK com mensagem amigável e ação orientada para o usuário.
- Padronizar campo de cliente no modal (id único e binding único).
- Adicionar telemetria de erro (console estruturado) para rastrear casos restantes.

**Critérios de aceite**
- Editar veículo sem erro em 100% dos casos.
- Excluir veículo sem checklist vinculado funciona.
- Excluir veículo com checklist mostra mensagem clara e não quebra a UI.
- Seleção de cliente persiste corretamente em criação/edição.

### 0.2 Login: recuperação de senha (Supabase)

**Problema reportado**
- Link de recuperação redireciona para `localhost:3000` em produção.

**Ações**
- Configurar no Supabase Auth:
  - `Site URL`: `https://checkauto.pages.dev`
  - `Redirect URLs`: `https://checkauto.pages.dev/**`
- Revisar tratamento de hash/query na tela de login para fluxo `type=recovery`.

**Critérios de aceite**
- E-mail de recuperação abre página de produção.
- Usuário consegue redefinir senha e autenticar em seguida.

---

## Fase 1 — Fluxos de operação diária (3 a 5 dias)

### 1.1 Ordem de Serviço (OS)

**Problemas reportados**
- Não há pré-cadastro no fluxo da OS.
- Busca não destaca/guia usuário para resultado.
- Dúvida sobre localização de OS finalizadas.

**Ações**
- Permitir pré-cadastro rápido de cliente/veículo dentro do modal de OS.
- Melhorar busca com:
  - filtro por número/cliente/placa,
  - highlight temporário da linha encontrada,
  - scroll automático até o resultado.
- Exibir OS finalizadas na lista com filtro por status:
  - `Abertas`, `Finalizadas`, `Todas`.

**Critérios de aceite**
- Usuário abre OS sem sair do fluxo mesmo sem cadastro prévio.
- Busca encontra e destaca item em até 1 interação.
- Finalizadas permanecem acessíveis para histórico/auditoria.

### 1.2 Agendamento

**Problemas reportados**
- Não puxa clientes/veículos já cadastrados no fluxo principal.
- Busca não retorna por nome/veículo.
- Conversão para OS falha com “Cliente não encontrado”.

**Ações**
- Unificar fonte de dados de clientes/veículos entre Agendamento e OS.
- Ajustar busca por `cliente_id` e `veiculo_id` (não por nome textual).
- Corrigir conversão Agendamento → OS usando IDs persistidos.
- Manter opção de pré-cadastro rápido como fallback.

**Critérios de aceite**
- Agendamento lista e filtra clientes/veículos já cadastrados.
- Conversão para OS funciona sem erro de cliente não encontrado.

---

## Fase 2 — Financeiro e clareza de indicadores (2 a 4 dias)

### 2.1 Integração OS ↔ Financeiro

**Problema reportado**
- Necessidade de lançamento automático ao informar valores na OS.

**Decisão funcional recomendada**
- OS gera **Conta a Receber** automaticamente (receita), e não conta a pagar.

**Ações**
- Ao salvar/atualizar OS com valor total:
  - criar/atualizar `conta_receber` vinculada à OS.
- Definir regra de status inicial (`aberta`) e baixa no recebimento.

**Critérios de aceite**
- Toda OS com valor gera item financeiro rastreável.
- Evita duplicidade em edições sucessivas de OS.

### 2.2 Card “Saldo Atual”

**Problema reportado**
- Conceito do card não está claro para usuário final.

**Ações**
- Exibir tooltip/microcopy com fórmula:
  - `Receitas recebidas - Despesas pagas` (período selecionado).
- Separar visualmente:
  - `Saldo do período` e `Saldo acumulado`.

**Critérios de aceite**
- Usuário entende cálculo sem precisar suporte.

---

## Fase 3 — Acesso de funcionários e segurança (4 a 7 dias)

### 3.1 Perfis e permissões de funcionários

**Necessidade reportada**
- Funcionário deve logar com credenciais definidas pelo admin e acessar checklist/agendamento.

**Ações**
- Implementar RBAC por perfil (ex.: `admin_oficina`, `recepcao`, `mecanico`).
- Definir matriz inicial de permissões:
  - Recepção: agendamento, checklist, consulta OS.
  - Mecânico: checklist, atualização de execução OS.
  - Admin oficina: acesso completo da oficina.
- Registrar trilha de auditoria por ação sensível.

**Critérios de aceite**
- Cada perfil enxerga somente módulos permitidos.
- Operações bloqueadas mostram mensagem clara de permissão.

### 3.2 Configurações de conta

**Necessidade reportada**
- Troca de senha e prevenção de logout acidental.

**Ações**
- Criar formulário de troca de senha:
  - senha atual, nova senha, confirmar nova senha.
- Mover ação “Sair” para aba Configurações com confirmação.

**Critérios de aceite**
- Troca de senha concluída sem intervenção técnica.
- Queda de logouts acidentais.

---

## Fase 4 — Qualidade contínua (contínuo)

### 4.1 Testes e observabilidade

**Ações**
- Criar checklists de QA por módulo (Veículos, OS, Agendamento, Financeiro, Auth).
- Adicionar logs padronizados para erros de integração com Supabase.
- Criar testes automatizados mínimos de regressão para fluxos críticos.

### 4.2 Performance e UX

**Ações**
- Revisar buscas em tabelas com debounce e feedback visual de carregamento.
- Garantir consistência entre listas e modais (dados sempre atualizados).

---

## Backlog sugerido de issues (GitHub)

1. **[HOTFIX] Veículos: corrigir edição sem erro de campo nulo**
2. **[HOTFIX] Veículos: tratamento FK ao excluir com checklist vinculado**
3. **[HOTFIX] Veículos: corrigir binding de cliente no modal**
4. **[HOTFIX] Auth: corrigir redirect de recuperação de senha no Supabase**
5. **[OS] Pré-cadastro rápido de cliente/veículo no modal**
6. **[OS] Busca com highlight + scroll para item encontrado**
7. **[OS] Exibir finalizadas com filtro por status**
8. **[AG] Unificar busca de cliente/veículo com IDs persistidos**
9. **[AG] Corrigir conversão Agendamento → OS (cliente não encontrado)**
10. **[FIN] Gerar conta a receber automaticamente a partir da OS**
11. **[FIN] Clarificar card saldo atual (fórmula e período)**
12. **[SEC] Perfis e permissões por tipo de funcionário (RBAC)**
13. **[CFG] Troca de senha na aba Configurações**
14. **[CFG] Mover botão sair do header para Configurações**

---

## Ordem de execução recomendada

1. Hotfix Veículos + Auth recovery.
2. OS e Agendamento (cadastro, busca, conversão).
3. Financeiro (integração automática + clareza de saldo).
4. Funcionários/RBAC e Configurações.
5. Automação de testes e observabilidade.
