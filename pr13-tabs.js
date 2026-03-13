(function () {
  const state = {
    historicoPage: 1,
    historicoPageSize: 50,
    charts: {},
    selectedPeriod: '30d'
  };

  const $ = (id) => document.getElementById(id);
  const parseDate = (value) => (value ? new Date(`${value}T00:00:00`) : null);

  function safeList(arr) { return Array.isArray(arr) ? arr : []; }
  function safeText(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
  function formatDateTime(dateValue) {
    if (!dateValue) return '-';
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('pt-BR');
  }

  function getOrdemRows() {
    const app = window.AppState || { data: {} };
    const clientesById = new Map(safeList(app.data.clientes).map((c) => [c.id, c]));
    const funcionariosById = new Map(safeList(app.data.funcionarios).map((u) => [u.id, u]));

    return safeList(app.data.ordensServico).map((os) => {
      const cliente = clientesById.get(os.cliente_id || os.clienteId) || {};
      const tecnico = funcionariosById.get(os.tecnico_id) || {};
      return {
        id: os.id,
        data: os.data || os.created_at,
        clienteNome: cliente.nome || os.cliente || '-',
        placa: cliente.placa || '-',
        servico: os.servico || (safeList(os.servicos).map((s) => s.descricao).join(', ') || '-'),
        valor: Number(os.valor || os.valorTotal || os.valor_total || 0),
        tecnicoNome: tecnico.nome || '-',
        status: os.status || '-'
      };
    }).sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));
  }

  function renderHistorico() {
    const rows = getOrdemRows();
    const inicio = parseDate($('historicoDataInicio')?.value);
    const fim = parseDate($('historicoDataFim')?.value);
    const status = $('historicoStatus')?.value || 'todos';
    const tecnico = $('historicoTecnico')?.value || 'todos';
    const busca = ($('historicoBusca')?.value || '').toLowerCase();

    const filtered = rows.filter((row) => {
      const d = parseDate((row.data || '').slice(0, 10));
      if (inicio && d && d < inicio) return false;
      if (fim && d && d > fim) return false;
      if (status !== 'todos' && row.status !== status) return false;
      if (tecnico !== 'todos' && row.tecnicoNome !== tecnico) return false;
      if (busca && !`${row.clienteNome} ${row.placa} ${row.servico}`.toLowerCase().includes(busca)) return false;
      return true;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / state.historicoPageSize));
    if (state.historicoPage > totalPages) state.historicoPage = totalPages;
    const start = (state.historicoPage - 1) * state.historicoPageSize;
    const pageRows = filtered.slice(start, start + state.historicoPageSize);

    const tbody = $('historicoTableBody');
    if (!tbody) return;
    if (!pageRows.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum registro encontrado</td></tr>';
    } else {
      tbody.innerHTML = pageRows.map((r) => `
        <tr>
          <td>${formatDateTime(r.data)}</td>
          <td>${r.clienteNome}</td>
          <td>${r.placa}</td>
          <td>${r.servico}</td>
          <td>${window.formatMoney(r.valor)}</td>
          <td>${r.tecnicoNome}</td>
          <td>${window.getStatusBadge ? window.getStatusBadge(r.status) : r.status}</td>
        </tr>
      `).join('');
    }

    $('historicoTotal') && ($('historicoTotal').textContent = `${filtered.length} registros`);
    $('historicoPageInfo') && ($('historicoPageInfo').textContent = `Página ${state.historicoPage}/${totalPages}`);
    $('historicoPrev') && ($('historicoPrev').disabled = state.historicoPage <= 1);
    $('historicoNext') && ($('historicoNext').disabled = state.historicoPage >= totalPages);
  }

  function exportHistoricoCSV() {
    const rows = getOrdemRows();
    const header = ['Data', 'Cliente', 'Placa', 'Serviço', 'Valor', 'Técnico', 'Status'];
    const body = rows.map((r) => [formatDateTime(r.data), r.clienteNome, r.placa, r.servico, r.valor.toFixed(2), r.tecnicoNome, r.status]);
    const csv = [header, ...body].map((line) => line.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(';')).join('\n');
    downloadFile(csv, 'historico-os.csv', 'text/csv;charset=utf-8;');
  }

  function exportHistoricoPDF() {
    if (!window.jspdf?.jsPDF) return window.showToast('jsPDF não carregado', 'warning');
    const doc = new window.jspdf.jsPDF({ orientation: 'landscape' });
    const rows = getOrdemRows();
    doc.text('Histórico de Ordens de Serviço', 14, 15);
    doc.autoTable({
      startY: 20,
      head: [['Data', 'Cliente', 'Placa', 'Serviço', 'Valor', 'Técnico', 'Status']],
      body: rows.map((r) => [formatDateTime(r.data), r.clienteNome, r.placa, r.servico, window.formatMoney(r.valor), r.tecnicoNome, r.status])
    });
    doc.save('historico-os.pdf');
  }

  function periodToDays() {
    return state.selectedPeriod === '7d' ? 7 : (state.selectedPeriod === '30d' ? 30 : 365);
  }

  function renderRelatorios() {
    const os = safeList(window.AppState?.data?.ordensServico);
    const clientes = safeList(window.AppState?.data?.clientes);
    const funcionarios = safeList(window.AppState?.data?.funcionarios).filter((f) => f.role === 'tecnico');

    const days = periodToDays();
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - days);

    const osPeriodo = os.filter((item) => new Date(item.data || item.created_at || 0) >= cutoff);
    $('relatorioTotalOs') && ($('relatorioTotalOs').textContent = osPeriodo.length);
    $('relatorioFaturamento') && ($('relatorioFaturamento').textContent = window.formatMoney(osPeriodo.reduce((s, i) => s + Number(i.valor || i.valor_total || i.valorTotal || 0), 0)));
    $('relatorioTicket') && ($('relatorioTicket').textContent = window.formatMoney(osPeriodo.length ? osPeriodo.reduce((s, i) => s + Number(i.valor || i.valor_total || i.valorTotal || 0), 0) / osPeriodo.length : 0));
    $('relatorioClientes') && ($('relatorioClientes').textContent = new Set(osPeriodo.map((o) => o.cliente_id || o.clienteId)).size || clientes.length);

    drawLinhaFaturamento(osPeriodo);
    drawPizzaStatus(osPeriodo);
    drawBarTecnico(osPeriodo, funcionarios);
    drawTopClientes(osPeriodo, clientes);
  }

  function getChart(id, type, data, options) {
    const canvas = $(id);
    if (!canvas || !window.Chart) return;
    if (state.charts[id]) state.charts[id].destroy();
    state.charts[id] = new window.Chart(canvas, { type, data, options });
  }

  function drawLinhaFaturamento(osPeriodo) {
    const map = new Map();
    osPeriodo.forEach((o) => {
      const d = (o.data || o.created_at || '').slice(0, 10);
      map.set(d, (map.get(d) || 0) + Number(o.valor || o.valor_total || o.valorTotal || 0));
    });
    const labels = [...map.keys()].sort();
    getChart('chartFaturamentoLinha', 'line', {
      labels,
      datasets: [{ label: 'Faturamento', data: labels.map((l) => map.get(l)), borderColor: '#27ae60', backgroundColor: 'rgba(39,174,96,.2)' }]
    }, { responsive: true, maintainAspectRatio: false });
  }

  function drawPizzaStatus(osPeriodo) {
    const status = {};
    osPeriodo.forEach((o) => { status[o.status || 'sem_status'] = (status[o.status || 'sem_status'] || 0) + 1; });
    const labels = Object.keys(status);
    getChart('chartStatusPizza', 'pie', {
      labels,
      datasets: [{ data: labels.map((l) => status[l]), backgroundColor: ['#3498db', '#f39c12', '#27ae60', '#e74c3c', '#9b59b6'] }]
    }, { responsive: true, maintainAspectRatio: false });
  }

  function drawBarTecnico(osPeriodo, funcionarios) {
    const byTec = {};
    osPeriodo.forEach((o) => { byTec[o.tecnico_id || 'nao_atribuido'] = (byTec[o.tecnico_id || 'nao_atribuido'] || 0) + 1; });
    const labels = Object.keys(byTec).map((id) => funcionarios.find((f) => f.id === id)?.nome || 'Não atribuído');
    getChart('chartTecnicoBarra', 'bar', {
      labels,
      datasets: [{ label: 'OS por técnico', data: Object.values(byTec), backgroundColor: '#2563eb' }]
    }, { responsive: true, maintainAspectRatio: false });
  }

  function drawTopClientes(osPeriodo, clientes) {
    const byCli = {};
    osPeriodo.forEach((o) => { byCli[o.cliente_id || o.clienteId || 'sem_cliente'] = (byCli[o.cliente_id || o.clienteId || 'sem_cliente'] || 0) + 1; });
    const top = Object.entries(byCli).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const tbody = $('topClientesTableBody');
    if (!tbody) return;
    if (!top.length) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center">Sem dados no período</td></tr>';
      return;
    }
    tbody.innerHTML = top.map(([id, total], idx) => `<tr><td>${idx + 1}</td><td>${clientes.find((c) => c.id === id)?.nome || 'Cliente não identificado'}</td><td>${total}</td></tr>`).join('');
  }

  async function renderEstoque() {
    const tbody = $('estoqueTableBody');
    const itens = safeList(window.AppState?.data?.estoque);
    const busca = ($('estoqueBusca')?.value || '').toLowerCase();
    const filtrado = itens.filter((i) => `${i.nome} ${i.codigo || ''}`.toLowerCase().includes(busca));
    if (!tbody) return;
    if (!filtrado.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum item cadastrado</td></tr>';
      return;
    }
    tbody.innerHTML = filtrado.map((i) => {
      const qtd = Number(i.qtd || 0);
      const minimo = Number(i.qtd_min || 0);
      const classe = qtd < minimo ? 'stock-alert' : '';
      return `<tr class="${classe}"><td>${i.nome}</td><td>${i.codigo || '-'}</td><td>${qtd}</td><td>${window.formatMoney(i.valor_unit || 0)}</td><td>${window.formatMoney(qtd * Number(i.valor_unit || 0))}</td><td>${minimo}</td><td><button class="btn btn-secondary btn-sm" onclick="window.pr13MovimentarEstoque('${i.id}','entrada')">+Entrada</button> <button class="btn btn-warning btn-sm" onclick="window.pr13MovimentarEstoque('${i.id}','saida')">-Saída</button></td></tr>`;
    }).join('');
  }

  async function movimentarEstoque(id, tipo) {
    const item = safeList(window.AppState?.data?.estoque).find((e) => e.id === id);
    if (!item) return;
    const qtd = Number(prompt(`Quantidade para ${tipo}:`, '1'));
    if (!qtd || qtd <= 0) return;
    const payload = { item_id: id, tipo, qtd, oficina_id: window.AppState?.user?.oficina_id || null };
    if (tipo === 'saida') {
      payload.os_id = prompt('OS ID vinculada (opcional):', '') || null;
      payload.cliente_id = prompt('Cliente ID vinculado (opcional):', '') || null;
    }
    const novaQtd = tipo === 'entrada' ? Number(item.qtd || 0) + qtd : Number(item.qtd || 0) - qtd;
    if (novaQtd < 0) return window.showToast('Quantidade insuficiente', 'warning');
    await window.supabase.from('movimentos_estoque').insert(payload);
    await window.supabase.from('estoque').update({ qtd: novaQtd }).eq('id', id);
    await window.loadFromSupabase();
    await renderEstoque();
    window.showToast('Movimentação registrada', 'success');
  }

  async function renderFornecedores() {
    const tbody = $('fornecedoresTableBody');
    const fornecedores = safeList(window.AppState?.data?.fornecedores);
    const os = safeList(window.AppState?.data?.ordensServico);
    if (!tbody) return;
    if (!fornecedores.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum fornecedor cadastrado</td></tr>';
      return;
    }
    tbody.innerHTML = fornecedores.map((f) => {
      const osAssociadas = os.filter((o) => o.fornecedor_id === f.id).length;
      return `<tr><td>${f.nome || '-'}</td><td>${f.cnpj || '-'}</td><td>${f.contato || '-'}</td><td>${f.tel || '-'}</td><td>${f.email || '-'}</td><td>${osAssociadas}</td></tr>`;
    }).join('');
  }

  function renderTabelaFuncionarios() {
    const tbody = $('funcionariosTableBody');
    const funcionarios = safeList(window.AppState?.data?.funcionarios);
    const os = safeList(window.AppState?.data?.ordensServico);
    if (!tbody) return;
    if (!funcionarios.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum funcionário cadastrado</td></tr>';
      return;
    }
    tbody.innerHTML = funcionarios.map((f) => `<tr><td>${safeText(f.nome || '-')}</td><td>${safeText(f.cpf || '-')}</td><td>${safeText(f.telefone || '-')}</td><td>${Number(f.comissao || 0)}%</td><td>${os.filter((o) => o.tecnico_id === f.id).length}</td><td>${safeText(f.role || 'tecnico')}</td></tr>`).join('');
  }

  async function initFuncionarios() {
    const oficinaId = window.AppState?.user?.oficina_id;
    let query = window.supabase.from('funcionarios').select('*').order('nome');
    if (window.AppState?.user?.role !== 'superadmin' && oficinaId) {
      query = query.eq('oficina_id', oficinaId);
    }
    const { data: funcionarios, error } = await query;
    if (error) {
      window.showToast('Erro ao carregar funcionários', 'error');
      return;
    }
    window.AppState.data.funcionarios = safeList(funcionarios);
    fillTecnicosSelect();
    renderTabelaFuncionarios();
  }

  function openModal(id) {
    $(id)?.classList.add('is-open');
  }

  function closeModal(id) {
    $(id)?.classList.remove('is-open');
  }

  function bindModal(id) {
    const modal = $(id);
    if (!modal || modal.dataset.bound) return;
    modal.dataset.bound = '1';
    modal.querySelectorAll('[data-modal-close]').forEach((btn) => btn.addEventListener('click', () => closeModal(id)));
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeModal(id);
    });
  }

  async function createEstoqueItem(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const payload = {
      nome: formData.get('nome'),
      codigo: formData.get('codigo') || null,
      qtd: Number(formData.get('qtd') || 0),
      valor_unit: Number(formData.get('valor_unit') || 0),
      qtd_min: Number(formData.get('qtd_min') || 0),
      oficina_id: window.AppState?.user?.oficina_id || null
    };
    const { error } = await window.supabase.from('estoque').insert(payload);
    if (error) return window.showToast('Erro ao salvar item', 'error');
    form.reset();
    closeModal('modal-estoque');
    await window.loadFromSupabase();
    await renderEstoque();
    window.showToast('Item criado com sucesso', 'success');
  }

  async function createFornecedor(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const payload = {
      nome: formData.get('nome'),
      cnpj: formData.get('cnpj') || null,
      contato: formData.get('contato') || null,
      tel: formData.get('tel') || null,
      email: formData.get('email') || null,
      oficina_id: window.AppState?.user?.oficina_id || null
    };
    const { error } = await window.supabase.from('fornecedores').insert(payload);
    if (error) return window.showToast('Erro ao salvar fornecedor', 'error');
    event.target.reset();
    closeModal('modal-fornecedores');
    await window.loadFromSupabase();
    await renderFornecedores();
    window.showToast('Fornecedor criado com sucesso', 'success');
  }

  async function createFuncionario(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const payload = {
      nome: formData.get('nome'),
      cpf: formData.get('cpf') || null,
      telefone: formData.get('telefone') || null,
      comissao: Number(formData.get('comissao') || 0),
      oficina_id: window.AppState?.user?.oficina_id || null
    };
    const { error } = await window.supabase.from('funcionarios').insert(payload);
    if (error) return window.showToast('Erro ao salvar funcionário', 'error');
    event.target.reset();
    closeModal('modal-funcionarios');
    await initFuncionarios();
    window.showToast('Funcionário criado com sucesso', 'success');
  }

  function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportRelatoriosExcel() {
    const rows = safeList(window.AppState?.data?.ordensServico).map((o) => [o.numero || '-', o.status || '-', o.data || '-', Number(o.valor || o.valor_total || o.valorTotal || 0)]);
    const csv = [['OS', 'Status', 'Data', 'Valor'], ...rows].map((r) => r.join(';')).join('\n');
    downloadFile(csv, 'relatorios.xls', 'application/vnd.ms-excel');
  }

  function exportRelatoriosPDF() {
    if (!window.jspdf?.jsPDF) return;
    const doc = new window.jspdf.jsPDF();
    doc.text('Relatórios CheckAuto', 14, 14);
    doc.autoTable({ head: [['Indicador', 'Valor']], body: [
      ['OS período', $('relatorioTotalOs')?.textContent || '0'],
      ['Faturamento', $('relatorioFaturamento')?.textContent || 'R$ 0'],
      ['Ticket médio', $('relatorioTicket')?.textContent || 'R$ 0'],
      ['Clientes ativos', $('relatorioClientes')?.textContent || '0']
    ]});
    doc.save('relatorios.pdf');
  }

  function initHistoricoBindings() {
    ['historicoDataInicio', 'historicoDataFim', 'historicoStatus', 'historicoTecnico', 'historicoBusca'].forEach((id) => {
      $(id)?.addEventListener(id === 'historicoBusca' ? 'input' : 'change', () => { state.historicoPage = 1; renderHistorico(); });
    });
    $('historicoPrev')?.addEventListener('click', () => { state.historicoPage -= 1; renderHistorico(); });
    $('historicoNext')?.addEventListener('click', () => { state.historicoPage += 1; renderHistorico(); });
    $('btnHistoricoCsv')?.addEventListener('click', exportHistoricoCSV);
    $('btnHistoricoPdf')?.addEventListener('click', exportHistoricoPDF);
  }

  function fillTecnicosSelect() {
    const select = $('historicoTecnico');
    const modalSelect = $('historicoTecnicoModal');
    if (!select && !modalSelect) return;
    const tecnicos = safeList(window.AppState?.data?.funcionarios).filter((u) => u.role === 'tecnico').map((u) => u.nome);
    const options = '<option value="todos">Todos técnicos</option>' + [...new Set(tecnicos)].map((n) => `<option value="${n}">${n}</option>`).join('');
    if (select) select.innerHTML = options;
    if (modalSelect) modalSelect.innerHTML = options;
  }

  function syncHistoricoFiltersToModal() {
    $('historicoDataInicioModal') && ($('historicoDataInicioModal').value = $('historicoDataInicio')?.value || '');
    $('historicoDataFimModal') && ($('historicoDataFimModal').value = $('historicoDataFim')?.value || '');
    $('historicoStatusModal') && ($('historicoStatusModal').value = $('historicoStatus')?.value || 'todos');
    $('historicoTecnicoModal') && ($('historicoTecnicoModal').value = $('historicoTecnico')?.value || 'todos');
  }

  function applyModalHistoricoFilters() {
    $('historicoDataInicio') && ($('historicoDataInicio').value = $('historicoDataInicioModal')?.value || '');
    $('historicoDataFim') && ($('historicoDataFim').value = $('historicoDataFimModal')?.value || '');
    $('historicoStatus') && ($('historicoStatus').value = $('historicoStatusModal')?.value || 'todos');
    $('historicoTecnico') && ($('historicoTecnico').value = $('historicoTecnicoModal')?.value || 'todos');
  }

  function initPR13Tabs() {
    initHistoricoBindings();
    $('relatorioPeriodo')?.addEventListener('change', (e) => { state.selectedPeriod = e.target.value; renderRelatorios(); });
    $('btnRelatoriosExcel')?.addEventListener('click', exportRelatoriosExcel);
    $('btnRelatoriosPdf')?.addEventListener('click', exportRelatoriosPDF);
    $('estoqueBusca')?.addEventListener('input', renderEstoque);
    bindModal('modal-estoque');
    bindModal('modal-fornecedores');
    bindModal('modal-funcionarios');
    bindModal('modal-historico-filtros');

    $('btnNovoItemEstoque')?.addEventListener('click', () => openModal('modal-estoque'));
    $('btnNovoFornecedor')?.addEventListener('click', () => openModal('modal-fornecedores'));
    $('btnNovoFuncionario')?.addEventListener('click', () => openModal('modal-funcionarios'));
    $('btnHistoricoFiltros')?.addEventListener('click', () => {
      syncHistoricoFiltersToModal();
      openModal('modal-historico-filtros');
    });
    $('btnAplicarFiltrosHistorico')?.addEventListener('click', () => {
      applyModalHistoricoFilters();
      closeModal('modal-historico-filtros');
      state.historicoPage = 1;
      renderHistorico();
    });

    $('form-estoque')?.addEventListener('submit', createEstoqueItem);
    $('form-fornecedores')?.addEventListener('submit', createFornecedor);
    $('form-funcionarios')?.addEventListener('submit', createFuncionario);

    fillTecnicosSelect();
    initFuncionarios();
    renderHistorico();
  }

  function renderPR13Page(page) {
    if (page === 'historico') renderHistorico();
    if (page === 'relatorios') renderRelatorios();
    if (page === 'estoque') renderEstoque();
    if (page === 'fornecedores') renderFornecedores();
    if (page === 'funcionarios') initFuncionarios();
  }

  window.initPR13Tabs = initPR13Tabs;
  window.renderPR13Page = renderPR13Page;
  window.pr13MovimentarEstoque = movimentarEstoque;
})();
