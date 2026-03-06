// ============================================
// GERENCIAMENTO DE ESTADO GLOBAL
// ============================================
const AppState = {
    currentPage: 'dashboard',
    user: {
        name: 'Usuário Demo',
        email: 'demo@perplexity.com',
        role: 'Administrador'
    },
    oficina: {
        nome: 'OFICINA FASTCAR',
        endereco: 'Rua das Oficinas, 123 - Centro',
        telefone: '(31) 99999-9999',
        cnpj: '00.000.000/0000-00'
    },
    data: {
        ordensServico: [],
        clientes: [],
        veiculos: [],
        agendamentos: [],
        financeiro: {
            contasReceber: [],
            contasPagar: []
        }
    }
};

// ============================================
// INICIALIZAÇÃO
// ============================================
function initApp() {
    console.log('🚀 Perplexity - Sistema de Gestão Automotiva v3.0');
    console.log('📦 FASE 1: Layout Profissional + Menu Hamburguer');
    
    loadFromLocalStorage();
    updateDashboard();
    updateOficinaNome();
    
    // Previne navegação padrão dos links
    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
        });
    });
}

// ============================================
// NAVEGAÇÃO
// ============================================
function navigateTo(page) {
    // Remove active de todos os itens do menu
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Adiciona active no item clicado
    const activeLink = document.querySelector(`[onclick="navigateTo('${page}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Esconde todas as páginas
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    
    // Mostra a página selecionada
    const pageElement = document.getElementById(`page-${page}`);
    if (pageElement) {
        pageElement.classList.add('active');
        AppState.currentPage = page;
    }
    
    // Fecha sidebar no mobile
    if (window.innerWidth <= 768) {
        toggleSidebar();
    }
    
    console.log(`📄 Navegando para: ${page}`);
}

// ============================================
// SIDEBAR TOGGLE
// ============================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

// ============================================
// DASHBOARD
// ============================================
function updateDashboard() {
    const { ordensServico, clientes, veiculos, agendamentos, financeiro } = AppState.data;
    
    // Atualizar cards
    document.getElementById('osAbertas').textContent = ordensServico.filter(os => os.status !== 'concluida').length || 0;
    document.getElementById('osHoje').textContent = ordensServico.filter(os => isToday(os.data)).length || 0;
    document.getElementById('totalClientes').textContent = clientes.length || 0;
    document.getElementById('totalVeiculos').textContent = veiculos.length || 0;
    
    // Financeiro
    const totalReceber = financeiro.contasReceber.reduce((sum, c) => sum + (c.valor || 0), 0);
    const totalPagar = financeiro.contasPagar.reduce((sum, c) => sum + (c.valor || 0), 0);
    document.getElementById('contasReceber').textContent = formatMoney(totalReceber);
    document.getElementById('contasPagar').textContent = formatMoney(totalPagar);
    
    // Agendamentos
    document.getElementById('agendamentosHoje').textContent = agendamentos.filter(a => isToday(a.data)).length || 0;
    
    // Faturamento do mês
    const faturamento = ordensServico
        .filter(os => isCurrentMonth(os.data) && os.status === 'concluida')
        .reduce((sum, os) => sum + (os.valorTotal || 0), 0);
    document.getElementById('faturamentoMes').textContent = formatMoney(faturamento);
    
    console.log('📊 Dashboard atualizado');
}

// ============================================
// ATUALIZAR NOME DA OFICINA
// ============================================
function updateOficinaNome() {
    const nomeElement = document.getElementById('oficinaNome');
    if (nomeElement && AppState.oficina.nome) {
        nomeElement.textContent = AppState.oficina.nome;
    }
}

// ============================================
// LOGOUT
// ============================================
function logout() {
    if (confirm('Deseja realmente sair do sistema?')) {
        console.log('👋 Logout realizado');
        alert('Logout realizado! Em breve teremos tela de login.');
        // window.location.href = 'login.html';
    }
}

// ============================================
// LOCAL STORAGE
// ============================================
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('perplexity_data');
    if (savedData) {
        try {
            AppState.data = JSON.parse(savedData);
            console.log('💾 Dados carregados do LocalStorage');
        } catch (e) {
            console.error('❌ Erro ao carregar dados:', e);
        }
    }
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('perplexity_data', JSON.stringify(AppState.data));
        console.log('💾 Dados salvos no LocalStorage');
    } catch (e) {
        console.error('❌ Erro ao salvar dados:', e);
    }
}

// ============================================
// UTILITÁRIOS
// ============================================
function formatMoney(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
}

function isToday(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

function isCurrentMonth(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
}

// ============================================
// INICIALIZAR AO CARREGAR
// ============================================
document.addEventListener('DOMContentLoaded', initApp);

// Salvar dados periodicamente
setInterval(saveToLocalStorage, 30000); // A cada 30 segundos