// HANDLERS DOS CARDS DO DASHBOARD

function setupDashboardCards() {
    const cards = document.querySelectorAll('#page-dashboard .card');
    
    cards.forEach((card, index) => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => handleCardClick(index));
    });
}

function handleCardClick(cardIndex) {
    switch(cardIndex) {
        case 0: // OS Abertas
            navigateToOSAbertas();
            break;
        case 1: // OS Hoje
            navigateToOSHoje();
            break;
        case 2: // Clientes
            navigateTo('clientes');
            break;
        case 3: // Veiculos
            navigateTo('veiculos');
            break;
        case 4: // Contas a Receber
            navigateToContasReceber();
            break;
        case 5: // Contas a Pagar
            navigateToContasPagar();
            break;
        case 6: // Agendamentos Hoje
            navigateToAgendamentosHoje();
            break;
        case 7: // Faturamento Mes
            navigateToFaturamentoMes();
            break;
    }
}

function navigateToOSAbertas() {
    navigateTo('ordens-servico');
    setTimeout(() => {
        const filterEl = document.getElementById('filterStatus');
        if (filterEl) {
            filterEl.value = 'todos';
            // Filtrar apenas abertas (nao concluidas)
            const searchEl = document.getElementById('searchOS');
            if (searchEl) searchEl.value = '';
            renderOrdensServico();
            
            // Scroll suave ate a tabela
            document.querySelector('#page-ordens-servico .table-responsive')?.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    }, 100);
}

function navigateToOSHoje() {
    navigateTo('ordens-servico');
    setTimeout(() => {
        const searchEl = document.getElementById('searchOS');
        const filterEl = document.getElementById('filterStatus');
        
        if (searchEl && filterEl) {
            searchEl.value = '';
            filterEl.value = 'todos';
            renderOrdensServico();
            
            // Filtrar visualmente apenas as OS de hoje
            const hoje = new Date().toISOString().split('T')[0];
            const rows = document.querySelectorAll('#ordensServicoTableBody tr');
            
            let foundToday = false;
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length > 4) {
                    const dataCell = cells[4].textContent;
                    const isToday = formatDate(hoje) === dataCell;
                    
                    if (isToday) {
                        row.style.backgroundColor = 'rgba(0, 102, 204, 0.1)';
                        row.style.border = '2px solid var(--primary-color)';
                        foundToday = true;
                    }
                }
            });
            
            if (foundToday) {
                document.querySelector('#page-ordens-servico .table-responsive')?.scrollIntoView({ 
                    behavior: 'smooth' 
                });
            } else {
                showToast('Nenhuma OS para hoje', 'info');
            }
        }
    }, 100);
}

function navigateToContasReceber() {
    navigateTo('financeiro');
    setTimeout(() => {
        if (typeof showFinanceiroTab === 'function') showFinanceiroTab('receber');
    }, 200);
}

function navigateToContasPagar() {
    navigateTo('financeiro');
    setTimeout(() => {
        if (typeof showFinanceiroTab === 'function') showFinanceiroTab('pagar');
    }, 200);
}

function navigateToAgendamentosHoje() {
    navigateTo('agendamento');
    setTimeout(() => {
        const filterEl = document.getElementById('filterAgendamentoStatus');
        if (filterEl) {
            filterEl.value = 'confirmado';
            renderListaAgendamentos();
            
            // Scroll ate agendamentos de hoje
            document.querySelector('.agendamentos-hoje-section')?.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    }, 100);
}

function navigateToFaturamentoMes() {
    navigateTo('ordens-servico');
    setTimeout(() => {
        const filterEl = document.getElementById('filterStatus');
        if (filterEl) {
            filterEl.value = 'concluida';
            renderOrdensServico();
            
            const mesAtual = new Date().getMonth();
            const anoAtual = new Date().getFullYear();
            
            // Destacar OS do mes atual
            const rows = document.querySelectorAll('#ordensServicoTableBody tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length > 4) {
                    const dataText = cells[4].textContent;
                    const dateParts = dataText.split('/');
                    
                    if (dateParts.length === 3) {
                        const mes = parseInt(dateParts[1]) - 1;
                        const ano = parseInt(dateParts[2]);
                        
                        if (mes === mesAtual && ano === anoAtual) {
                            row.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
                        }
                    }
                }
            });
            
            document.querySelector('#page-ordens-servico .table-responsive')?.scrollIntoView({ 
                behavior: 'smooth' 
            });
        }
    }, 100);
}
