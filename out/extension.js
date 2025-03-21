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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const serverProvider_1 = require("./providers/serverProvider");
const toolsProvider_1 = require("./providers/toolsProvider");
const serverManager_1 = require("./managers/serverManager");
const dashboard_1 = require("./views/dashboard");
function activate(context) {
    console.log('MCP Manager eklentisi aktif edildi!');
    // Sunucu yöneticisini başlat
    const serverManager = new serverManager_1.MCPServerManager(context);
    // Tree view sağlayıcılarını kaydet
    const serversProvider = new serverProvider_1.MCPServerProvider(serverManager);
    const toolsProvider = new toolsProvider_1.MCPToolsProvider();
    vscode.window.registerTreeDataProvider('mcpServers', serversProvider);
    vscode.window.registerTreeDataProvider('mcpTools', toolsProvider);
    // Komutları kaydet
    let openDashboard = vscode.commands.registerCommand('mcpstore.openDashboard', () => {
        dashboard_1.MCPDashboard.createOrShow(context.extensionUri);
    });
    let createServer = vscode.commands.registerCommand('mcpstore.createServer', async () => {
        const serverName = await vscode.window.showInputBox({
            prompt: 'Yeni MCP sunucusu için isim girin',
            placeHolder: 'örn: Yerel MCP Sunucusu'
        });
        if (serverName) {
            const serverUrl = await vscode.window.showInputBox({
                prompt: 'Sunucu URL\'ini girin',
                placeHolder: 'örn: http://localhost:8000'
            });
            if (serverUrl) {
                await serverManager.addServer(serverName, serverUrl);
                serversProvider.refresh();
            }
        }
    });
    let manageServers = vscode.commands.registerCommand('mcpstore.manageServers', () => {
        vscode.commands.executeCommand('workbench.view.extension.mcp-explorer');
    });
    context.subscriptions.push(openDashboard, createServer, manageServers);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map