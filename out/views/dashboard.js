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
exports.MCPDashboard = void 0;
const vscode = __importStar(require("vscode"));
class MCPDashboard {
    constructor(panel, extensionUri) {
        this._disposables = [];
        this._panel = panel;
        this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'refresh':
                    this._panel.webview.postMessage({ command: 'refresh' });
                    return;
            }
        }, null, this._disposables);
    }
    static createOrShow(extensionUri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (MCPDashboard.currentPanel) {
            MCPDashboard.currentPanel._panel.reveal(column);
            return;
        }
        const panel = vscode.window.createWebviewPanel('mcpDashboard', 'MCP Dashboard', column || vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
        });
        MCPDashboard.currentPanel = new MCPDashboard(panel, extensionUri);
    }
    _getWebviewContent(webview, extensionUri) {
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
    dispose() {
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
exports.MCPDashboard = MCPDashboard;
//# sourceMappingURL=dashboard.js.map