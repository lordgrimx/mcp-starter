(function() {
    const vscode = acquireVsCodeApi();

    // DOM elementlerini seç
    const refreshBtn = document.getElementById('refreshBtn');
    const addServerBtn = document.getElementById('addServerBtn');
    const serverList = document.getElementById('serverList');

    // Event listener'ları ekle
    refreshBtn.addEventListener('click', () => {
        vscode.postMessage({ command: 'refresh' });
    });

    addServerBtn.addEventListener('click', () => {
        vscode.postMessage({ command: 'addServer' });
    });

    // Webview mesajlarını dinle
    window.addEventListener('message', event => {
        const message = event.data;

        switch (message.command) {
            case 'updateServers':
                updateServerList(message.servers);
                break;
            case 'refresh':
                vscode.postMessage({ command: 'refresh' });
                break;
        }
    });

    // Sunucu listesini güncelle
    function updateServerList(servers) {
        serverList.innerHTML = servers.map(server => `
            <div class="server-card">
                <div class="server-info">
                    <span class="server-name">${server.name}</span>
                    <span class="server-url">${server.url}</span>
                </div>
                <div class="server-status">
                    <span class="status-indicator ${server.status === 'online' ? 'status-online' : 'status-offline'}"></span>
                    <span>${server.status === 'online' ? 'Çevrimiçi' : 'Çevrimdışı'}</span>
                </div>
            </div>
        `).join('');
    }

    // Tool kartlarına tıklama olayı ekle
    document.querySelectorAll('.tool-card').forEach(card => {
        card.addEventListener('click', () => {
            const toolId = card.querySelector('h3').textContent.toLowerCase().replace(' ', '');
            vscode.postMessage({ command: 'openTool', toolId });
        });
    });
})(); 