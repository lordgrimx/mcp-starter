import * as vscode from 'vscode';
import { MCPServerProvider } from './providers/serverProvider';
import { MCPToolsProvider } from './providers/toolsProvider';
import { MCPServerManager } from './managers/serverManager';
import { MCPDashboard } from './views/dashboard';

export function activate(context: vscode.ExtensionContext) {
    console.log('MCP Manager eklentisi aktif edildi!');

    // Sunucu yöneticisini başlat
    const serverManager = new MCPServerManager(context);
    
    // Tree view sağlayıcılarını kaydet
    const serversProvider = new MCPServerProvider(serverManager);
    const toolsProvider = new MCPToolsProvider();

    vscode.window.registerTreeDataProvider('mcpServers', serversProvider);
    vscode.window.registerTreeDataProvider('mcpTools', toolsProvider);

    // Komutları kaydet
    let openDashboard = vscode.commands.registerCommand('mcpstore.openDashboard', () => {
        MCPDashboard.createOrShow(context.extensionUri);
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

export function deactivate() {} 