// ============================================
// NOTIFICAÇÕES REAIS — CheckAuto
// ============================================

(function() {

    // Gera lista de notificações com base nos dados do AppState
    function gerarNotificacoes() {
        const notifs = [];
        const hoje = new Date(); hoje.setHours(0,0,0,0);
        const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1);
        const data = window.AppState?.data || {};

        // --- OS aguardando há mais de 3 dias ---
        (data.ordensServico || []).forEach(os => {
            if (os.status === 'aguardando' || os.status === 'em_andamento') {
                const dataOs = new Date((os.data || os.created_at || '') + 'T00:00:00');
                const dias = Math.floor((hoje - dataOs) / 86400000);
                if (dias >= 3) {
                    notifs.push({
                        tipo: 'os',
                        cor: '#dc2626',
                        icone: 'fas fa-clipboard-list',
                        titulo: `OS #${os.numero} parada há ${dias} dias`,
                        sub: `${os.cliente || ''} · ${os.veiculo || ''}`,
                        acao: () => { window.navigateTo('ordens-servico'); fecharDropdownNotif(); }
                    });
                }
            }
        });

        // --- Agendamentos de hoje ainda pendentes ---
        (data.agendamentos || []).forEach(ag => {
            const dataAg = new Date((ag.data || '') + 'T00:00:00');
            if (dataAg.getTime() === hoje.getTime() && ag.status !== 'atendido' && ag.status !== 'cancelado') {
                notifs.push({
                    tipo: 'agendamento',
                    cor: '#2563eb',
                    icone: 'fas fa-calendar-check',
                    titulo: `Agendamento hoje às ${ag.hora || ag.horario || '--:--'}`,
                    sub: `${ag.cliente || ''} · ${ag.tipoServico || ag.tipo_servico || ''}`,
                    acao: () => { window.navigateTo('agendamento'); fecharDropdownNotif(); }
                });
            }
        });

        // --- Contas a pagar vencendo hoje ou amanhã ---
        (data.contasPagar || []).forEach(c => {
            if (c.status === 'paga') return;
            const venc = new Date((c.vencimento || '') + 'T00:00:00');
            const diff = Math.floor((venc - hoje) / 86400000);
            if (diff <= 1 && diff >= 0) {
                notifs.push({
                    tipo: 'financeiro',
                    cor: '#d97706',
                    icone: 'fas fa-file-invoice-dollar',
                    titulo: diff === 0 ? `Conta vence HOJE: ${c.fornecedor || c.descricao || ''}` : `Conta vence amanhã: ${c.fornecedor || c.descricao || ''}`,
                    sub: `R$ ${Number(c.valor || 0).toFixed(2).replace('.', ',')}`,
                    acao: () => { window.navigateTo('financeiro'); fecharDropdownNotif(); }
                });
            } else if (diff < 0) {
                notifs.push({
                    tipo: 'financeiro',
                    cor: '#dc2626',
                    icone: 'fas fa-exclamation-circle',
                    titulo: `Conta VENCIDA: ${c.fornecedor || c.descricao || ''}`,
                    sub: `Venceu há ${Math.abs(diff)} dia(s) · R$ ${Number(c.valor || 0).toFixed(2).replace('.', ',')}`,
                    acao: () => { window.navigateTo('financeiro'); fecharDropdownNotif(); }
                });
            }
        });

        // --- Estoque abaixo do mínimo ---
        (data.estoque || []).forEach(item => {
            const qtd = Number(item.qtd || item.quantidade || 0);
            const min = Number(item.qtd_min || item.quantidade_minima || 0);
            if (min > 0 && qtd <= min) {
                notifs.push({
                    tipo: 'estoque',
                    cor: '#7c3aed',
                    icone: 'fas fa-boxes',
                    titulo: `Estoque baixo: ${item.nome || ''}`,
                    sub: `${qtd} unid. (mínimo: ${min})`,
                    acao: () => { window.navigateTo('estoque'); fecharDropdownNotif(); }
                });
            }
        });

        return notifs;
    }

    // Atualiza o badge do sino
    function atualizarBadgeSino() {
        const badge = document.getElementById('notifBadge');
        if (!badge) return;
        const notifs = gerarNotificacoes();
        if (notifs.length === 0) {
            badge.style.display = 'none';
        } else {
            badge.textContent = notifs.length > 9 ? '9+' : notifs.length;
            badge.style.display = 'flex';
        }
    }

    // Fecha o dropdown
    function fecharDropdownNotif() {
        document.getElementById('notifDropdown')?.remove();
    }

    // Abre/fecha o dropdown de notificações
    function toggleNotificacoes(e) {
        e.stopPropagation();
        const existing = document.getElementById('notifDropdown');
        if (existing) { existing.remove(); return; }

        const notifs = gerarNotificacoes();
        const btn = document.getElementById('btnNotificacoes');
        const rect = btn?.getBoundingClientRect() || { right: 200, bottom: 60 };

        const dropdown = document.createElement('div');
        dropdown.id = 'notifDropdown';
        dropdown.style.cssText = [
            'position:fixed',
            `top:${rect.bottom + 8}px`,
            `right:${window.innerWidth - rect.right}px`,
            'width:340px',
            'max-height:480px',
            'overflow-y:auto',
            'background:#fff',
            'border-radius:14px',
            'box-shadow:0 8px 32px rgba(0,0,0,.18)',
            'z-index:99999',
            'font-family:Segoe UI,Tahoma,sans-serif',
            'border:1px solid #e5e7eb'
        ].join(';');

        if (notifs.length === 0) {
            dropdown.innerHTML = `
                <div style="padding:20px;text-align:center;color:#6b7280;">
                    <i class="fas fa-bell-slash" style="font-size:2rem;opacity:.4;display:block;margin-bottom:10px;"></i>
                    <strong>Tudo em dia!</strong><br>
                    <span style="font-size:13px;">Nenhuma notificação no momento.</span>
                </div>
            `;
        } else {
            const header = `
                <div style="padding:14px 16px 10px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f3f4f6;">
                    <strong style="font-size:14px;color:#111827;">Notificações <span style="background:#ef4444;color:#fff;border-radius:20px;padding:1px 7px;font-size:11px;margin-left:4px;">${notifs.length}</span></strong>
                    <button onclick="document.getElementById('notifDropdown').remove()" style="background:none;border:none;color:#9ca3af;cursor:pointer;font-size:18px;">&times;</button>
                </div>
            `;
            const items = notifs.map((n, i) => `
                <div onclick="window._notifAcoes[${i}]()" style="
                    display:flex;align-items:flex-start;gap:12px;padding:12px 16px;
                    border-bottom:1px solid #f9fafb;cursor:pointer;
                    transition:background .15s;
                " onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='#fff'">
                    <div style="
                        width:36px;height:36px;border-radius:50%;flex-shrink:0;
                        background:${n.cor}18;display:flex;align-items:center;justify-content:center;
                    ">
                        <i class="${n.icone}" style="color:${n.cor};font-size:15px;"></i>
                    </div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:13px;font-weight:600;color:#111827;line-height:1.3;">${n.titulo}</div>
                        <div style="font-size:12px;color:#6b7280;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${n.sub}</div>
                    </div>
                    <i class="fas fa-chevron-right" style="color:#d1d5db;font-size:11px;margin-top:4px;"></i>
                </div>
            `).join('');

            dropdown.innerHTML = header + items;
        }

        document.body.appendChild(dropdown);

        // Registra ações para evitar problemas com onclick inline
        window._notifAcoes = notifs.map(n => n.acao);

        // Fecha ao clicar fora
        setTimeout(() => {
            document.addEventListener('click', fecharDropdownNotif, { once: true });
        }, 0);
    }

    // Inicializa o sino ao carregar os dados
    window._initNotificacoes = function() {
        atualizarBadgeSino();
        // Atualiza o badge a cada 60 segundos
        setInterval(atualizarBadgeSino, 60000);
    };

    window._toggleNotificacoes = toggleNotificacoes;
    window._atualizarBadgeSino = atualizarBadgeSino;

})();
