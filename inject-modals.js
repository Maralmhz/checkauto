// INJEÇÃO DE MODAIS DIRETO NO HTML (SEM FETCH)
(function () {
    if (document.getElementById('clienteModal')) return;

    const modalsHTML = `
<!-- MODAL CLIENTE -->
<div id="clienteModal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3 id="clienteModalTitle">Novo Cliente</h3>
      <span class="close" onclick="closeClienteModal()">&times;</span>
    </div>
    <div class="modal-body">
      <form id="clienteForm">
        <div class="form-row"><div class="form-group"><label for="clienteNome">Nome Completo *</label><input type="text" id="clienteNome" required></div></div>
        <div class="form-row">
          <div class="form-group"><label for="clienteCPF">CPF/CNPJ</label><input type="text" id="clienteCPF" data-mask="cpf-cnpj"></div>
          <div class="form-group"><label for="clienteTelefone">Telefone *</label><input type="text" id="clienteTelefone" data-mask="phone" required></div>
        </div>
        <div class="form-row"><div class="form-group"><label for="clienteEmail">E-mail</label><input type="email" id="clienteEmail"></div></div>
        <div class="form-row"><div class="form-group"><label for="clienteEndereco">Endereço Completo</label><textarea id="clienteEndereco" rows="3"></textarea></div></div>
      </form>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" onclick="closeClienteModal()">Cancelar</button>
      <button type="button" class="btn btn-primary" onclick="salvarCliente()">Salvar</button>
    </div>
  </div>
</div>

<!-- MODAL VEÍCULO -->
<div id="veiculoModal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3 id="veiculoModalTitle">Novo Veículo</h3>
      <span class="close" onclick="closeVeiculoModal()">&times;</span>
    </div>
    <div class="modal-body">
      <form id="veiculoForm">
        <div class="form-row"><div class="form-group"><label for="veiculoCliente">Cliente *</label><select id="veiculoCliente" required><option value="">Selecione um cliente</option></select></div></div>
        <div class="form-row">
          <div class="form-group"><label for="veiculoPlaca">Placa *</label><input type="text" id="veiculoPlaca" maxlength="8" style="text-transform: uppercase;" required></div>
          <div class="form-group"><label for="veiculoModelo">Modelo *</label><input type="text" id="veiculoModelo" required></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label for="veiculoChassis">Chassis</label><input type="text" id="veiculoChassis"></div>
          <div class="form-group"><label for="veiculoAno">Ano</label><input type="text" id="veiculoAno" maxlength="9" placeholder="Ex: 2020/2021"></div>
        </div>
        <div class="form-row"><div class="form-group"><label for="veiculoCor">Cor</label><input type="text" id="veiculoCor"></div></div>
      </form>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" onclick="closeVeiculoModal()">Cancelar</button>
      <button type="button" class="btn btn-primary" onclick="salvarVeiculo()">Salvar</button>
    </div>
  </div>
</div>

<!-- MODAL OS -->
<div id="osModal" class="modal">
  <div class="modal-content modal-large">
    <div class="modal-header">
      <h3 id="osModalTitle">Nova Ordem de Serviço</h3>
      <span class="close" onclick="closeOSModal()">&times;</span>
    </div>
    <div class="modal-body">
      <form id="osForm">
        <div class="form-row">
          <div class="form-group"><label for="osCliente">Cliente *</label><select id="osCliente" onchange="atualizarVeiculosOS()" required><option value="">Selecione um cliente</option></select></div>
          <div class="form-group"><label for="osVeiculo">Veículo *</label><select id="osVeiculo" required disabled><option value="">Selecione um veículo</option></select></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label for="osData">Data de Entrada *</label><input type="date" id="osData" required></div>
        </div>
        <div class="form-row"><div class="form-group"><label for="osDescricao">Descrição do Serviço *</label><textarea id="osDescricao" rows="3" required></textarea></div></div>
        <div class="form-row"><div class="form-group"><label for="osObservacoes">Observações</label><textarea id="osObservacoes" rows="2"></textarea></div></div>

        <div class="form-row">
          <div class="form-group"><label for="servicoDescricao">Serviço</label><input type="text" id="servicoDescricao" placeholder="Descrição do serviço"></div>
          <div class="form-group"><label for="servicoValor">Valor (R$)</label><input type="number" id="servicoValor" step="0.01" min="0" placeholder="0,00"></div>
          <div class="form-group" style="display:flex;align-items:flex-end;"><button type="button" class="btn btn-primary" onclick="addServicoOS()">Adicionar</button></div>
        </div>

        <div class="table-responsive">
          <table class="table"><thead><tr><th>Serviço</th><th>Valor</th><th>Ações</th></tr></thead><tbody id="osServicosTable"><tr><td colspan="3" class="text-center">Nenhum serviço adicionado</td></tr></tbody></table>
        </div>
        <p style="text-align:right;margin-top:10px;"><strong>Total: <span id="osTotal">R$ 0,00</span></strong></p>
      </form>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" onclick="closeOSModal()">Cancelar</button>
      <button type="button" class="btn btn-primary" onclick="salvarOS()">Salvar</button>
    </div>
  </div>
</div>

<!-- MODAL AGENDAMENTO -->
<div id="agendamentoModal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3 id="agendamentoModalTitle">Novo Agendamento</h3>
      <span class="close" onclick="closeAgendamentoModal()">&times;</span>
    </div>
    <div class="modal-body">
      <form id="agendamentoForm">
        <div class="form-row"><div class="form-group"><label for="agendamentoCliente">Cliente *</label><select id="agendamentoCliente" onchange="atualizarVeiculosAgendamento()" required><option value="">Selecione um cliente</option></select></div></div>
        <div class="form-row"><div class="form-group"><label for="agendamentoVeiculo">Veículo *</label><select id="agendamentoVeiculo" required disabled><option value="">Selecione um veículo</option></select></div></div>
        <div class="form-row">
          <div class="form-group"><label for="agendamentoData">Data *</label><input type="date" id="agendamentoData" required></div>
          <div class="form-group"><label for="agendamentoHora">Horário *</label><input type="time" id="agendamentoHora" required></div>
        </div>
        <div class="form-row"><div class="form-group"><label for="agendamentoTipo">Serviço *</label><input type="text" id="agendamentoTipo" required></div></div>
        <div class="form-row"><div class="form-group"><label for="agendamentoObservacoes">Observações</label><textarea id="agendamentoObservacoes" rows="3"></textarea></div></div>
      </form>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" onclick="closeAgendamentoModal()">Cancelar</button>
      <button type="button" class="btn btn-primary" onclick="salvarAgendamento()">Salvar</button>
    </div>
  </div>
</div>


<!-- MODAL CONTA A PAGAR -->
<div id="contaPagarModal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3 id="contaPagarModalTitle">Nova Conta a Pagar</h3>
      <span class="close" onclick="closeContaPagarModal()">&times;</span>
    </div>
    <div class="modal-body">
      <form id="contaPagarForm">
        <div class="form-row"><div class="form-group"><label for="contaPagarFornecedor">Fornecedor *</label><input type="text" id="contaPagarFornecedor" required></div></div>
        <div class="form-row">
          <div class="form-group"><label for="contaPagarValor">Valor (R$) *</label><input type="text" id="contaPagarValor" placeholder="R$ 0,00" inputmode="decimal" autocomplete="off" required></div>
          <div class="form-group"><label for="contaPagarCategoria">Categoria *</label><input type="text" id="contaPagarCategoria" required></div>
        </div>
        <div class="form-row"><div class="form-group"><label for="contaPagarVencimento">Vencimento *</label><input type="date" id="contaPagarVencimento" required></div></div>
        <div class="form-row"><div class="form-group"><label for="contaPagarStatus">Status</label><select id="contaPagarStatus"><option value="aberta">Aberta</option><option value="paga">Paga</option><option value="atrasada">Atrasada</option></select></div></div>
        <div class="form-row"><div class="form-group"><label for="contaPagarObs">Observacoes</label><textarea id="contaPagarObs" rows="3"></textarea></div></div>
      </form>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" onclick="closeContaPagarModal()">Cancelar</button>
      <button type="button" class="btn btn-primary" onclick="salvarContaPagar()">Salvar</button>
    </div>
  </div>
</div>

<!-- MODAL CONTA A RECEBER -->
<div id="contaReceberModal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3 id="contaReceberModalTitle">Nova Conta a Receber</h3>
      <span class="close" onclick="closeContaReceberModal()">&times;</span>
    </div>
    <div class="modal-body">
      <form id="contaReceberForm">
        <div class="form-row"><div class="form-group"><label for="contaReceberOS">OS *</label><select id="contaReceberOS" required></select></div></div>
        <div class="form-row">
          <div class="form-group"><label for="contaReceberValor">Valor (R$) *</label><input type="text" id="contaReceberValor" placeholder="R$ 0,00" inputmode="decimal" autocomplete="off" required></div>
          <div class="form-group"><label for="contaReceberVencimento">Vencimento *</label><input type="date" id="contaReceberVencimento" required></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label for="contaReceberPagadorTipo">Pagador</label><select id="contaReceberPagadorTipo"><option value="cliente">Cliente</option><option value="seguradora">Seguradora</option><option value="associacao">Associacao</option></select></div>
          <div class="form-group"><label for="contaReceberPagadorNome">Nome do Pagador</label><input type="text" id="contaReceberPagadorNome" placeholder="Ex: Seguradora X"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label for="contaReceberFormaPagamento">Forma</label><select id="contaReceberFormaPagamento"><option value="a_definir">A definir</option><option value="boleto">Boleto</option><option value="pix">PIX</option><option value="cartao">Cartao</option><option value="dinheiro">Dinheiro</option></select></div>
          <div class="form-group"><label for="contaReceberStatus">Status</label><select id="contaReceberStatus"><option value="aberta">Aberta</option><option value="parcial">Parcial</option><option value="recebida">Recebida</option><option value="atrasada">Atrasada</option></select></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label for="contaReceberParcelasTotal">Parcelas Totais</label><input type="number" id="contaReceberParcelasTotal" min="1" value="1" required></div>
          <div class="form-group"><label for="contaReceberParcelasRecebidas">Parcelas Recebidas</label><input type="number" id="contaReceberParcelasRecebidas" min="0" value="0" required></div>
        </div>
        <div class="form-row"><div class="form-group"><label for="contaReceberObs">Observacoes</label><textarea id="contaReceberObs" rows="3"></textarea></div></div>
      </form>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" onclick="closeContaReceberModal()">Cancelar</button>
      <button type="button" class="btn btn-primary" onclick="salvarContaReceber()">Salvar</button>
    </div>
  </div>
</div>

<!-- MODAL CONTA FIXA -->
<div id="contaFixaModal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3 id="contaFixaModalTitle">Nova Conta Fixa</h3>
      <span class="close" onclick="closeContaFixaModal()">&times;</span>
    </div>
    <div class="modal-body">
      <form id="contaFixaForm">
        <div class="form-row"><div class="form-group"><label for="contaFixaDescricao">Descricao *</label><input type="text" id="contaFixaDescricao" required></div></div>
        <div class="form-row">
          <div class="form-group"><label for="contaFixaValor">Valor Mensal (R$) *</label><input type="text" id="contaFixaValor" placeholder="R$ 0,00" inputmode="decimal" autocomplete="off" required></div>
          <div class="form-group"><label for="contaFixaDia">Dia do Vencimento *</label><input type="number" id="contaFixaDia" min="1" max="31" required></div>
        </div>
        <div class="form-row"><div class="form-group"><label for="contaFixaCategoria">Categoria *</label><select id="contaFixaCategoria" required><option value="">Selecione</option><option value="pessoal">Pessoal</option><option value="estrutura">Estrutura</option><option value="operacional">Operacional</option><option value="tributos">Tributos</option><option value="servicos">Servicos</option></select></div></div>
      </form>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" onclick="closeContaFixaModal()">Cancelar</button>
      <button type="button" class="btn btn-primary" onclick="salvarContaFixa()">Salvar</button>
    </div>
  </div>
</div>

<!-- MODAL VISUALIZAÇÃO OS -->
<div id="modalViewOS" class="modal">
  <div class="modal-content modal-large">
    <div class="modal-header">
      <h3>Detalhes da OS #<span id="viewOSNumero"></span></h3>
      <span class="close" onclick="closeViewOSModal()">&times;</span>
    </div>
    <div class="modal-body" id="viewOSContent"></div>
    <div class="modal-footer"><button type="button" class="btn btn-secondary" onclick="closeViewOSModal()">Fechar</button></div>
  </div>
</div>

<!-- MODAL VISUALIZAÇÃO AGENDAMENTO -->
<div id="modalViewAgendamento" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3>Detalhes do Agendamento</h3>
      <span class="close" onclick="closeViewAgendamentoModal()">&times;</span>
    </div>
    <div class="modal-body" id="viewAgendamentoContent"></div>
    <div class="modal-footer"><button type="button" class="btn btn-secondary" onclick="closeViewAgendamentoModal()">Fechar</button></div>
  </div>
</div>

<style>
.modal { display:none; position:fixed; z-index:1000; inset:0; background-color:rgba(17,24,39,.5); animation: fadeIn .2s; }
.modal.active { display:flex; align-items:center; justify-content:center; }
.modal-content { background:#fff; border-radius:10px; width:90%; max-width:640px; max-height:90vh; overflow-y:auto; animation: slideDown .2s; box-shadow:0 10px 28px rgba(0,0,0,.2); border:1px solid #e5e7eb; }
.modal-content.modal-large { max-width:980px; }
.modal-header { padding:16px 20px; background:#374151; color:#fff; display:flex; justify-content:space-between; align-items:center; }
.modal-header h3 { margin:0; font-size:1.15rem; font-weight:600; }
.modal-header .close { font-size:26px; cursor:pointer; width:32px; height:32px; display:flex; align-items:center; justify-content:center; border-radius:8px; background:rgba(255,255,255,.12); }
.modal-header .close:hover { background:rgba(255,255,255,.2); }
.modal-body { padding:20px; background:#fff; }
.modal-footer { padding:14px 20px; background:#f3f4f6; display:flex; justify-content:flex-end; gap:10px; border-top:1px solid #e5e7eb; }
@keyframes fadeIn { from {opacity:0;} to {opacity:1;} }
@keyframes slideDown { from {transform: translateY(-14px); opacity:0;} to {transform: translateY(0); opacity:1;} }
@media (max-width:768px) { .modal-content { width:95%; } .modal-body { padding:16px; } }
</style>
`;

    document.body.insertAdjacentHTML('beforeend', modalsHTML);
})();
