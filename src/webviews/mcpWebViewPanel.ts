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
                        <button class="mcp-action-button ${server.isActive ? 'stop' : 'start'}" 
                                onclick="handleServerAction('${server.id}', ${server.isActive})">
                            ${server.isActive ? 'Stop' : 'Start'}
                        </button>
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
                        <button class="mcp-action-button ${client.isActive ? 'stop' : 'start'}" 
                                onclick="handleClientAction('${client.id}', ${client.isActive})">
                            ${client.isActive ? 'Stop' : 'Start'}
                        </button>
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

                <script>
                    const vscode = acquireVsCodeApi();

                    function addServer() {
                        vscode.postMessage({
                            command: 'addServer'
                        });
                    }

                    function addClient() {
                        vscode.postMessage({
                            command: 'addClient'
                        });
                    }

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
                </script>
            </body>
            </html>`;
    }
}