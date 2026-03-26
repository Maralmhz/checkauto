# 🔧 CheckAuto — Sistema de Gestão para Oficinas Mecânicas

Sistema completo de gestão automotiva, desenvolvido em **Mobile First**, com backend em **Supabase** e hospedagem via **GitHub Pages**.

> ✅ **Versão estável v1.0 — pronta para produção**

---

## 📱 Acesso ao Sistema

| Ambiente | URL |
|---|---|
| **App principal** | [https://maralmhz.github.io/checkauto/](https://maralmhz.github.io/checkauto/) |
| **Painel Admin** | [https://maralmhz.github.io/checkauto/admin.html](https://maralmhz.github.io/checkauto/admin.html) |

---

## 📦 Módulos do Sistema

| Módulo | Descrição |
|---|---|
| 📄 **Ordens de Serviço** | Criação, edição, status e geração de PDF |
| 👥 **Clientes** | Cadastro completo com histórico de veículos e OS |
| 🚗 **Veículos** | Vinculados a clientes, com histórico de serviços |
| 📅 **Agendamento** | Calendário de agendamentos com status |
| 💰 **Financeiro** | Contas a pagar, receber, fixas e fluxo de caixa |
| 📦 **Estoque** | Controle de peças com alertas de estoque mínimo |
| ✅ **Checklists** | Inspeção visual de veículos com fotos |
| 👷 **Funcionários** | Cadastro e controle de comissões |
| 🏭 **Fornecedores** | Cadastro e gestão de fornecedores |
| 🔔 **Notificações** | Alertas de agendamentos, contas e estoque |
| ⚙️ **Configurações** | White-label: logo, cores, nome e dados da oficina |

---

## 🔐 Sistema de Planos

| Plano | Comportamento |
|---|---|
| **TRIAL** | 14 dias gratuitos — banner de contagem regressiva |
| **TRIAL vencido** | Tela de bloqueio total com opções de assinar |
| **MENSAL / ANUAL** | Acesso completo enquanto `plano_fim` for válido |
| **Plano vencendo** | Banner de aviso nos últimos 5 dias |
| **Plano vencido** | Tela de bloqueio com opções de renovar |

---

## 🛠️ Tecnologias

- **Frontend:** HTML5, CSS3, JavaScript Vanilla (ES Modules)
- **Backend:** [Supabase](https://supabase.com) (PostgreSQL + Auth + Storage)
- **Hospedagem:** GitHub Pages
- **PWA:** `manifest.json` + Service Worker (`sw.js`)
- **Ícones:** Font Awesome
- **PDF:** Geração client-side via JavaScript

---

## 🗂️ Estrutura de Arquivos

```
checkauto/
├── index.html              # App principal
├── login.html              # Página de login
├── admin.html              # Painel superadmin
├── app.js                  # Inicialização, auth, trial/plano e estado global
├── admin.js                # Lógica do painel admin
├── inject-modals.js        # White-label e carregamento da oficina
├── agendamento.js          # Módulo de agendamentos
├── checklist.js            # Módulo de checklists
├── clientes.js             # Módulo de clientes
├── veiculos.js             # Módulo de veículos
├── ordens-servico.js       # Módulo de OS
├── financeiro.js           # Módulo financeiro
├── estoque.js              # Módulo de estoque
├── funcionarios.js         # Módulo de funcionários
├── configuracoes.js        # Módulo de configurações
├── notifications.js        # Sistema de notificações
├── pr13-tabs.js            # Abas e navegação avançada
├── dashboard-handlers.js   # Cards e métricas do dashboard
├── calendario.js           # Componente de calendário
├── masks.js                # Máscaras de input (CPF, telefone, placa)
├── supabase.js             # Client Supabase e helpers CRUD
├── login.js                # Lógica de autenticação
├── styles.css              # Estilos globais
├── checklist.css           # Estilos do checklist
├── agendamento-styles.css  # Estilos do agendamento
├── dashboard-cards.css     # Estilos dos cards
├── os-styles.css           # Estilos das OS
├── login.css               # Estilos da tela de login
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker
├── favicon.png             # Ícone do site
├── logo-default.png        # Logo padrão das oficinas
├── docs/                   # Documentação extra
├── sql/                    # Scripts SQL do Supabase
└── legacy/                 # Arquivos de versões anteriores
```

---

## 👥 Multi-Tenancy

Cada oficina é isolada por `oficina_id`. Todas as queries aplicam o escopo automático via `applyOficinaScope()` em `app.js`, garantindo que cada oficina veja apenas seus próprios dados.

---

## 📧 Contato / Suporte

Dúvidas ou assinatura: [WhatsApp](https://wa.me/5531996766963)

---

**Versão:** 1.0 estável — Março 2026
