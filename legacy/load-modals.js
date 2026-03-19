// CARREGAMENTO AUTOMÁTICO DOS MODALS
(function() {
    // Carregar modals.html
    fetch('modals.html')
        .then(response => response.text())
        .then(html => {
            const modalsContainer = document.createElement('div');
            modalsContainer.id = 'modals-container';
            modalsContainer.innerHTML = html;
            document.body.appendChild(modalsContainer);
            console.log('✅ Modals carregados com sucesso');
        })
        .catch(error => {
            console.error('❌ Erro ao carregar modals:', error);
        });
})();