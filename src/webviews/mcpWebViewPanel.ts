import * as vscode from 'vscode';
import { MCPManager } from '../mcpManager';

export class MCPWebViewPanel {
    public static currentPanel: MCPWebViewPanel | undefined;
    private static readonly viewType = 'mcpManager';
    
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private readonly _mcpManager: MCPManager;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, mcpManager: MCPManager) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (MCPWebViewPanel.currentPanel) {
            MCPWebViewPanel.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            MCPWebViewPanel.viewType,
            'MCP Manager',
            column || vscode.ViewColumn.One,
            {
                // Enable JavaScript in the webview
                enableScripts: true,
                // Restrict the webview to only load resources from our extension
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'resources')]
            }
        );

        MCPWebViewPanel.currentPanel = new MCPWebViewPanel(panel, extensionUri, mcpManager);
    }

    public static refresh() {
        if (MCPWebViewPanel.currentPanel) {
            MCPWebViewPanel.currentPanel._update();
        }
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, mcpManager: MCPManager) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._mcpManager = mcpManager;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content based on view changes
        this._panel.onDidChangeViewState(
            e => {
                if (this._panel.visible) {
                    this._update();
                }
            },
            null,
            this._disposables
        );

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'addServer':
                        await this._mcpManager.addServer();
                        break;
                    case 'addClient':
                        await this._mcpManager.addClient();
                        break;
                    case 'startServer':
                        this._mcpManager.startServer(message.serverId);
                        break;
                    case 'stopServer':
                        this._mcpManager.stopServer(message.serverId);
                        break;
                    case 'startClient':
                        this._mcpManager.startClient(message.clientId);
                        break;
                    case 'stopClient':
                        this._mcpManager.stopClient(message.clientId);
                        break;
                    case 'editServer':
                        this._mcpManager.editServer(message.data);
                        break;
                    case 'editClient':
                        this._mcpManager.editClient(message.data);
                        break;
                    case 'deleteServer':
                        this._mcpManager.deleteServer(message.serverId);
                        break;
                    case 'deleteClient':
                        this._mcpManager.deleteClient(message.clientId);
                        break;
                    case 'getServerDetails':
                        const server = this._mcpManager.getServerDetails(message.serverId);
                        this._panel.webview.postMessage({ command: 'editServer', server });
                        break;
                    case 'getClientDetails':
                        const client = this._mcpManager.getClientDetails(message.clientId);
                        this._panel.webview.postMessage({ command: 'editClient', client });
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    public dispose() {
        MCPWebViewPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.title = 'MCP Manager';
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const servers = this._mcpManager.getServers();
        const clients = this._mcpManager.getClients();

        // Create HTML representation of servers
        const serversHtml = servers.map(server => {
            return `
                <div class="mcp-item ${server.isActive ? 'active' : ''}">
                    <div class="mcp-item-header">
                        <span class="mcp-item-name">${server.name}</span>
                        <span class="mcp-item-type">${server.type}</span>
                        <span class="mcp-item-status">${server.isActive ? 'Running' : 'Stopped'}</span>
                    </div>
                    <div class="mcp-item-details">
                        <div class="mcp-item-command">${server.command}</div>
                        <div class="mcp-item-actions">
                            <button class="mcp-action-button ${server.isActive ? 'stop' : 'start'}" 
                                    onclick="handleServerAction('${server.id}', ${server.isActive})">
                                ${server.isActive ? 'Stop' : 'Start'}
                            </button>
                            <button class="mcp-action-button edit" onclick="editServer('${server.id}')">
                                Edit
                            </button>
                            <button class="mcp-action-button delete" onclick="deleteServer('${server.id}')">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Create HTML representation of clients
        const clientsHtml = clients.map(client => {
            return `
                <div class="mcp-item ${client.isActive ? 'active' : ''}">
                    <div class="mcp-item-header">
                        <span class="mcp-item-name">${client.name}</span>
                        <span class="mcp-item-type">${client.type}</span>
                        <span class="mcp-item-status">${client.isActive ? 'Running' : 'Stopped'}</span>
                    </div>
                    <div class="mcp-item-details">
                        <div class="mcp-item-command">${client.command}</div>
                        <div class="mcp-item-actions">
                            <button class="mcp-action-button ${client.isActive ? 'stop' : 'start'}" 
                                    onclick="handleClientAction('${client.id}', ${client.isActive})">
                                ${client.isActive ? 'Stop' : 'Start'}
                            </button>
                            <button class="mcp-action-button edit" onclick="editClient('${client.id}')">
                                Edit
                            </button>
                            <button class="mcp-action-button delete" onclick="deleteClient('${client.id}')">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>MCP Manager</title>
                <style>
                    :root {
                        --container-padding: 20px;
                        --input-padding-vertical: 6px;
                        --input-padding-horizontal: 12px;
                        --input-margin-vertical: 4px;
                        --input-margin-horizontal: 0;
                    }

                    body {
                        padding: 0;
                        margin: 0;
                        color: var(--vscode-foreground);
                        font-size: var(--vscode-font-size);
                        font-weight: var(--vscode-font-weight);
                        font-family: var(--vscode-font-family);
                        background-color: var(--vscode-editor-background);
                    }

                    .container {
                        display: flex;
                        flex-direction: column;
                        height: 100vh;
                        max-width: 1200px;
                        margin: 0 auto;
                        padding: var(--container-padding);
                    }

                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                    }

                    .header h1 {
                        margin: 0;
                        padding: 0;
                    }

                    .panels-container {
                        display: flex;
                        flex-direction: column;
                        flex-grow: 1;
                        overflow: hidden;
                        border: 1px solid var(--vscode-widget-border);
                        border-radius: 4px;
                    }

                    .panel {
                        flex: 1;
                        padding: 10px;
                        overflow-y: auto;
                    }

                    .panel-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 10px;
                        padding-bottom: 5px;
                        border-bottom: 1px solid var(--vscode-widget-border);
                    }

                    .divider {
                        height: 1px;
                        background-color: var(--vscode-widget-border);
                    }

                    .mcp-item {
                        margin-bottom: 10px;
                        padding: 10px;
                        border-radius: 4px;
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                    }

                    .mcp-item.active {
                        background-color: var(--vscode-editor-selectionBackground);
                    }

                    .mcp-item-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 5px;
                    }

                    .mcp-item-details {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }

                    .mcp-item-command {
                        font-family: var(--vscode-editor-font-family);
                        font-size: var(--vscode-editor-font-size);
                        color: var(--vscode-textPreformat-foreground);
                        background-color: var(--vscode-textBlockQuote-background);
                        padding: 2px 6px;
                        border-radius: 2px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        max-width: 70%;
                    }

                    .mcp-action-button {
                        padding: var(--input-padding-vertical) var(--input-padding-horizontal);
                        border: none;
                        border-radius: 2px;
                        font-size: var(--vscode-font-size);
                        cursor: pointer;
                    }

                    .mcp-action-button.start {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                    }

                    .mcp-action-button.stop {
                        background-color: var(--vscode-editorError-foreground);
                        color: var(--vscode-button-foreground);
                    }

                    .add-button {
                        padding: var(--input-padding-vertical) var(--input-padding-horizontal);
                        border: none;
                        border-radius: 2px;
                        font-size: var(--vscode-font-size);
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        cursor: pointer;
                    }

                    .empty-message {
                        padding: 20px;
                        text-align: center;
                        color: var(--vscode-descriptionForeground);
                    }

                    @media (min-width: 768px) {
                        .panels-container {
                            flex-direction: row;
                        }

                        .divider {
                            width: 1px;
                            height: auto;
                        }
                    }

                    .modal {
                        display: none;
                        position: fixed;
                        z-index: 1;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(0,0,0,0.4);
                    }

                    .modal-content {
                        background-color: var(--vscode-editor-background);
                        margin: 15% auto;
                        padding: 20px;
                        border: 1px solid var(--vscode-widget-border);
                        width: 80%;
                        max-width: 500px;
                        border-radius: 4px;
                    }

                    .form-group {
                        margin-bottom: 15px;
                    }

                    .form-group label {
                        display: block;
                        margin-bottom: 5px;
                    }

                    .form-group input, .form-group select {
                        width: 100%;
                        padding: 8px;
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 2px;
                    }

                    .modal-buttons {
                        display: flex;
                        justify-content: flex-end;
                        gap: 10px;
                        margin-top: 20px;
                    }

                    .mcp-item-actions {
                        display: flex;
                        gap: 5px;
                    }

                    .mcp-action-button.edit {
                        background-color: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                    }

                    .mcp-action-button.delete {
                        background-color: var(--vscode-errorForeground);
                        color: var(--vscode-button-foreground);
                    }

                    .close {
                        float: right;
                        cursor: pointer;
                        font-size: 20px;
                    }

                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>MCP Manager</h1>
                    </div>
                    <div class="panels-container">
                        <div class="panel">
                            <div class="panel-header">
                                <h2>Servers</h2>
                                <button class="add-button" onclick="addServer()">Add Server</button>
                            </div>
                            <div class="panel-content">
                                ${serversHtml || '<div class="empty-message">No servers added yet.</div>'}
                            </div>
                        </div>
                        <div class="divider"></div>
                        <div class="panel">
                            <div class="panel-header">
                                <h2>Clients</h2>
                                <button class="add-button" onclick="addClient()">Add Client</button>
                            </div>
                            <div class="panel-content">
                                ${clientsHtml || '<div class="empty-message">No clients added yet.</div>'}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Add Server Modal -->
                <div id="addServerModal" class="modal">
                    <div class="modal-content">
                        <span class="close" onclick="closeModal('addServerModal')">&times;</span>
                        <h2>Add Server</h2>
                        <form id="addServerForm">
                            <div class="form-group">
                                <label for="serverName">Name:</label>
                                <input type="text" id="serverName" required>
                            </div>
                            <div class="form-group">
                                <label for="serverType">Type:</label>
                                <select id="serverType" required>
                                    <option value="process">Process</option>
                                    <option value="sse">SSE</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="serverCommand">Command/URL:</label>
                                <input type="text" id="serverCommand" required>
                            </div>
                            <div class="modal-buttons">
                                <button type="button" onclick="closeModal('addServerModal')" class="mcp-action-button">Cancel</button>
                                <button type="submit" class="mcp-action-button start">Add Server</button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Add Client Modal -->
                <div id="addClientModal" class="modal">
                    <div class="modal-content">
                        <span class="close" onclick="closeModal('addClientModal')">&times;</span>
                        <h2>Add Client</h2>
                        <form id="addClientForm">
                            <div class="form-group">
                                <label for="clientName">Name:</label>
                                <input type="text" id="clientName" required>
                            </div>
                            <div class="form-group">
                                <label for="clientType">Type:</label>
                                <select id="clientType" required>
                                    <option value="process">Process</option>
                                    <option value="sse">SSE</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="clientCommand">Command/URL:</label>
                                <input type="text" id="clientCommand" required>
                            </div>
                            <div class="modal-buttons">
                                <button type="button" onclick="closeModal('addClientModal')" class="mcp-action-button">Cancel</button>
                                <button type="submit" class="mcp-action-button start">Add Client</button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Edit Server Modal -->
                <div id="editServerModal" class="modal">
                    <div class="modal-content">
                        <span class="close" onclick="closeModal('editServerModal')">&times;</span>
                        <h2>Edit Server</h2>
                        <form id="editServerForm">
                            <input type="hidden" id="editServerId">
                            <div class="form-group">
                                <label for="editServerName">Name:</label>
                                <input type="text" id="editServerName" required>
                            </div>
                            <div class="form-group">
                                <label for="editServerType">Type:</label>
                                <select id="editServerType" required>
                                    <option value="process">Process</option>
                                    <option value="sse">SSE</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="editServerCommand">Command/URL:</label>
                                <input type="text" id="editServerCommand" required>
                            </div>
                            <div class="modal-buttons">
                                <button type="button" onclick="closeModal('editServerModal')" class="mcp-action-button">Cancel</button>
                                <button type="submit" class="mcp-action-button start">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Edit Client Modal -->
                <div id="editClientModal" class="modal">
                    <div class="modal-content">
                        <span class="close" onclick="closeModal('editClientModal')">&times;</span>
                        <h2>Edit Client</h2>
                        <form id="editClientForm">
                            <input type="hidden" id="editClientId">
                            <div class="form-group">
                                <label for="editClientName">Name:</label>
                                <input type="text" id="editClientName" required>
                            </div>
                            <div class="form-group">
                                <label for="editClientType">Type:</label>
                                <select id="editClientType" required>
                                    <option value="process">Process</option>
                                    <option value="sse">SSE</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="editClientCommand">Command/URL:</label>
                                <input type="text" id="editClientCommand" required>
                            </div>
                            <div class="modal-buttons">
                                <button type="button" onclick="closeModal('editClientModal')" class="mcp-action-button">Cancel</button>
                                <button type="submit" class="mcp-action-button start">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();

                    function showModal(modalId) {
                        document.getElementById(modalId).style.display = "block";
                    }

                    function closeModal(modalId) {
                        document.getElementById(modalId).style.display = "none";
                    }

                    function addServer() {
                        showModal('addServerModal');
                    }

                    function addClient() {
                        showModal('addClientModal');
                    }

                    document.getElementById('addServerForm').addEventListener('submit', function(e) {
                        e.preventDefault();
                        const data = {
                            name: document.getElementById('serverName').value,
                            type: document.getElementById('serverType').value,
                            command: document.getElementById('serverCommand').value
                        };
                        vscode.postMessage({
                            command: 'addServer',
                            data: data
                        });
                        closeModal('addServerModal');
                        this.reset();
                    });

                    document.getElementById('addClientForm').addEventListener('submit', function(e) {
                        e.preventDefault();
                        const data = {
                            name: document.getElementById('clientName').value,
                            type: document.getElementById('clientType').value,
                            command: document.getElementById('clientCommand').value
                        };
                        vscode.postMessage({
                            command: 'addClient',
                            data: data
                        });
                        closeModal('addClientModal');
                        this.reset();
                    });

                    document.getElementById('editServerForm').addEventListener('submit', function(e) {
                        e.preventDefault();
                        const data = {
                            id: document.getElementById('editServerId').value,
                            name: document.getElementById('editServerName').value,
                            type: document.getElementById('editServerType').value,
                            command: document.getElementById('editServerCommand').value
                        };
                        vscode.postMessage({
                            command: 'editServer',
                            data: data
                        });
                        closeModal('editServerModal');
                    });

                    document.getElementById('editClientForm').addEventListener('submit', function(e) {
                        e.preventDefault();
                        const data = {
                            id: document.getElementById('editClientId').value,
                            name: document.getElementById('editClientName').value,
                            type: document.getElementById('editClientType').value,
                            command: document.getElementById('editClientCommand').value
                        };
                        vscode.postMessage({
                            command: 'editClient',
                            data: data
                        });
                        closeModal('editClientModal');
                    });

                    function handleServerAction(serverId, isActive) {
                        vscode.postMessage({
                            command: isActive ? 'stopServer' : 'startServer',
                            serverId: serverId
                        });
                    }

                    function handleClientAction(clientId, isActive) {
                        vscode.postMessage({
                            command: isActive ? 'stopClient' : 'startClient',
                            clientId: clientId
                        });
                    }

                    function editServer(serverId) {
                        vscode.postMessage({
                            command: 'getServerDetails',
                            serverId: serverId
                        });
                    }

                    function editClient(clientId) {
                        vscode.postMessage({
                            command: 'getClientDetails',
                            clientId: clientId
                        });
                    }

                    function deleteServer(serverId) {
                        if (confirm('Are you sure you want to delete this server?')) {
                            vscode.postMessage({
                                command: 'deleteServer',
                                serverId: serverId
                            });
                        }
                    }

                    function deleteClient(clientId) {
                        if (confirm('Are you sure you want to delete this client?')) {
                            vscode.postMessage({
                                command: 'deleteClient',
                                clientId: clientId
                            });
                        }
                    }

                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.command) {
                            case 'editServer':
                                document.getElementById('editServerId').value = message.server.id;
                                document.getElementById('editServerName').value = message.server.name;
                                document.getElementById('editServerType').value = message.server.type;
                                document.getElementById('editServerCommand').value = message.server.command;
                                showModal('editServerModal');
                                break;
                            case 'editClient':
                                document.getElementById('editClientId').value = message.client.id;
                                document.getElementById('editClientName').value = message.client.name;
                                document.getElementById('editClientType').value = message.client.type;
                                document.getElementById('editClientCommand').value = message.client.command;
                                showModal('editClientModal');
                                break;
                        }
                    });
                </script>
            </body>
            </html>`;
    }
}