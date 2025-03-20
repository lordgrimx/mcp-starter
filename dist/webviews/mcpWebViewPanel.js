"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPWebViewPanel = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
class MCPWebViewPanel {
    static createOrShow(extensionPath, mcpManager) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (MCPWebViewPanel.currentPanel) {
            MCPWebViewPanel.currentPanel._panel.reveal(column);
            return;
        }
        MCPWebViewPanel._mcpManager = mcpManager;
        const panel = vscode.window.createWebviewPanel(MCPWebViewPanel.viewType, 'MCP Manager', column || vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(extensionPath, 'resources')),
                vscode.Uri.file(path.join(extensionPath, 'src', 'webviews', 'resources'))
            ]
        });
        MCPWebViewPanel.currentPanel = new MCPWebViewPanel(panel, extensionPath);
        // Register the panel with VS Code's extension API
        vscode.commands.executeCommand('setContext', 'mcpWebviewFocus', true);
        // Register completion provider for MCP tools
        vscode.languages.registerCompletionItemProvider('*', {
            provideCompletionItems(document, position) {
                const completionItems = [];
                MCPWebViewPanel.tools.forEach(tool => {
                    const item = new vscode.CompletionItem(tool.name, vscode.CompletionItemKind.Function);
                    item.detail = tool.description;
                    item.documentation = new vscode.MarkdownString(`MCP Tool: ${tool.name}\n\n${tool.description}`);
                    completionItems.push(item);
                });
                return completionItems;
            }
        });
        // Register hover provider for MCP tools
        vscode.languages.registerHoverProvider('*', {
            provideHover(document, position) {
                const range = document.getWordRangeAtPosition(position);
                if (!range) {
                    return;
                }
                const word = document.getText(range);
                const tool = MCPWebViewPanel.tools.find(t => t.name.toLowerCase() === word.toLowerCase());
                if (tool) {
                    return new vscode.Hover(`${tool.name}: ${tool.description}`);
                }
            }
        });
    }
    constructor(panel, extensionPath) {
        this._disposables = [];
        this._panel = panel;
        this._extensionPath = extensionPath;
        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.onDidChangeViewState(e => {
            if (this._panel.visible) {
                this._update();
            }
            vscode.commands.executeCommand('setContext', 'mcpWebviewFocus', this._panel.visible);
        }, null, this._disposables);
        this._panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'addServer':
                    await MCPWebViewPanel._mcpManager.addServer();
                    break;
                case 'addClient':
                    await MCPWebViewPanel._mcpManager.addClient();
                    break;
                case 'startServer':
                    MCPWebViewPanel._mcpManager.startServer(message.serverId);
                    break;
                case 'stopServer':
                    MCPWebViewPanel._mcpManager.stopServer(message.serverId);
                    break;
                case 'startClient':
                    MCPWebViewPanel._mcpManager.startClient(message.clientId);
                    break;
                case 'stopClient':
                    MCPWebViewPanel._mcpManager.stopClient(message.clientId);
                    break;
                case 'editServer':
                    MCPWebViewPanel._mcpManager.editServer(message.data);
                    break;
                case 'editClient':
                    MCPWebViewPanel._mcpManager.editClient(message.data);
                    break;
                case 'deleteServer':
                    MCPWebViewPanel._mcpManager.deleteServer(message.serverId);
                    break;
                case 'deleteClient':
                    MCPWebViewPanel._mcpManager.deleteClient(message.clientId);
                    break;
                case 'getServerDetails':
                    const server = MCPWebViewPanel._mcpManager.getServerDetails(message.serverId);
                    this._panel.webview.postMessage({ command: 'editServer', server });
                    break;
                case 'getClientDetails':
                    const client = MCPWebViewPanel._mcpManager.getClientDetails(message.clientId);
                    this._panel.webview.postMessage({ command: 'editClient', client });
                    break;
            }
        }, null, this._disposables);
    }
    static refresh() {
        if (MCPWebViewPanel.currentPanel) {
            MCPWebViewPanel.currentPanel._update();
        }
    }
    dispose() {
        MCPWebViewPanel.currentPanel = undefined;
        vscode.commands.executeCommand('setContext', 'mcpWebviewFocus', false);
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    _update() {
        const webview = this._panel.webview;
        this._panel.title = "MCP Manager";
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }
    _getHtmlForWebview(webview) {
        const servers = MCPWebViewPanel._mcpManager.getServers();
        const clients = MCPWebViewPanel._mcpManager.getClients();
        // HTML template
        return `
            <!DOCTYPE html>
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
                    <div class="tools-section">
                        <h2>Available Tools</h2>
                        <div class="tools-list">
                            ${MCPWebViewPanel.tools.map(tool => `
                                <div class="tool-item">
                                    ${tool.icon ? `<i class="codicon codicon-${tool.icon}"></i>` : ''}
                                    <div class="tool-info">
                                        <h3>${tool.name}</h3>
                                        <p>${tool.description}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="panels-container">
                        <div class="panel">
                            <div class="panel-header">
                                <h2>Servers</h2>
                                <button class="add-button" onclick="addServer()">Add Server</button>
                            </div>
                            <div class="panel-content">
                                ${servers.map(server => `
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
                                `).join('') || '<div class="empty-message">No servers added yet.</div>'}
                            </div>
                        </div>
                        <div class="divider"></div>
                        <div class="panel">
                            <div class="panel-header">
                                <h2>Clients</h2>
                                <button class="add-button" onclick="addClient()">Add Client</button>
                            </div>
                            <div class="panel-content">
                                ${clients.map(client => `
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
                                `).join('') || '<div class="empty-message">No clients added yet.</div>'}
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
            </html>
        `;
    }
}
exports.MCPWebViewPanel = MCPWebViewPanel;
MCPWebViewPanel.viewType = 'mcpWebView';
MCPWebViewPanel.tools = [
    {
        name: 'Process Manager',
        description: 'Start and stop processes',
        icon: 'terminal'
    },
    {
        name: 'SSE Client',
        description: 'Connect to Server-Sent Events',
        icon: 'plug'
    }
];
//# sourceMappingURL=mcpWebViewPanel.js.map