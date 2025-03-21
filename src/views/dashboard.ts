import * as vscode from 'vscode';
import * as path from 'path';

export class MCPDashboard {
    public static currentPanel: MCPDashboard | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;

        this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'refresh':
                        this._panel.webview.postMessage({ command: 'refresh' });
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (MCPDashboard.currentPanel) {
            MCPDashboard.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'mcpDashboard',
            'MCP Dashboard',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );

        MCPDashboard.currentPanel = new MCPDashboard(panel, extensionUri);
    }

    private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'resources', 'dashboard.css'));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'resources', 'dashboard.js'));

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>MCP Dashboard</title>
            <link href="${styleUri}" rel="stylesheet">
        </head>
        <body>
            <div class="container">
                <header>
                    <h1>MCP Dashboard</h1>
                    <div class="actions">
                        <button id="refreshBtn">Yenile</button>
                        <button id="addServerBtn">Sunucu Ekle</button>
                    </div>
                </header>
                
                <main>
                    <section class="servers">
                        <h2>MCP Sunucuları</h2>
                        <div id="serverList" class="server-list">
                            <!-- Sunucular buraya dinamik olarak eklenecek -->
                        </div>
                    </section>

                    <section class="tools">
                        <h2>MCP Araçları</h2>
                        <div class="tool-grid">
                            <div class="tool-card">
                                <h3>Model Yönetimi</h3>
                                <p>Model yapılandırmalarını görüntüle ve düzenle</p>
                            </div>
                            <div class="tool-card">
                                <h3>Context Yönetimi</h3>
                                <p>Context yapılandırmalarını yönet</p>
                            </div>
                            <div class="tool-card">
                                <h3>Protokol Ayarları</h3>
                                <p>MCP protokol ayarlarını yapılandır</p>
                            </div>
                            <div class="tool-card">
                                <h3>API Dokümantasyonu</h3>
                                <p>MCP API referansını görüntüle</p>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
            <script src="${scriptUri}"></script>
        </body>
        </html>`;
    }

    public dispose() {
        MCPDashboard.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
} 