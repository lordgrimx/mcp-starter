import * as vscode from 'vscode';
import { MCPManager } from './mcpManager';
import { MCPWebViewPanel } from './webviews/mcpWebViewPanel';

export function activate(context: vscode.ExtensionContext) {
    console.log('MCP Manager extension is now active!');

    // Initialize the MCP Manager
    const mcpManager = new MCPManager(context);

    // Register commands
    const showPanelCommand = vscode.commands.registerCommand('mcpManager.showPanel', () => {
        MCPWebViewPanel.createOrShow(context.extensionUri, mcpManager);
    });

    const addServerCommand = vscode.commands.registerCommand('mcpManager.addServer', () => {
        mcpManager.addServer();
    });

    const addClientCommand = vscode.commands.registerCommand('mcpManager.addClient', () => {
        mcpManager.addClient();
    });

    const startServerCommand = vscode.commands.registerCommand('mcpManager.startServer', (serverId: string) => {
        mcpManager.startServer(serverId);
    });

    const stopServerCommand = vscode.commands.registerCommand('mcpManager.stopServer', (serverId: string) => {
        mcpManager.stopServer(serverId);
    });

    const startClientCommand = vscode.commands.registerCommand('mcpManager.startClient', (clientId: string) => {
        mcpManager.startClient(clientId);
    });

    const stopClientCommand = vscode.commands.registerCommand('mcpManager.stopClient', (clientId: string) => {
        mcpManager.stopClient(clientId);
    });

    // Add commands to the extension context
    context.subscriptions.push(
        showPanelCommand,
        addServerCommand,
        addClientCommand,
        startServerCommand,
        stopServerCommand,
        startClientCommand,
        stopClientCommand
    );

    // Create the TreeView for Servers and Clients
    const serversProvider = mcpManager.getServersProvider();
    const clientsProvider = mcpManager.getClientsProvider();

    const serversTreeView = vscode.window.createTreeView('mcpServersView', {
        treeDataProvider: serversProvider,
        showCollapseAll: true
    });

    const clientsTreeView = vscode.window.createTreeView('mcpClientsView', {
        treeDataProvider: clientsProvider,
        showCollapseAll: true
    });

    context.subscriptions.push(serversTreeView, clientsTreeView);

    // Automatically show the panel when the extension is activated
    MCPWebViewPanel.createOrShow(context.extensionUri, mcpManager);
}

export function deactivate() {
    // Clean up resources when extension is deactivated
}