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
const mcpManager_1 = require("./mcpManager");
const mcpWebViewPanel_1 = require("./webviews/mcpWebViewPanel");
function activate(context) {
    console.log('MCP Manager extension is now active!');
    // Initialize the MCP Manager
    const mcpManager = new mcpManager_1.MCPManager(context);
    // Register commands
    const showPanelCommand = vscode.commands.registerCommand('mcpManager.showPanel', () => {
        mcpWebViewPanel_1.MCPWebViewPanel.createOrShow(context.extensionUri, mcpManager);
    });
    const addServerCommand = vscode.commands.registerCommand('mcpManager.addServer', () => {
        mcpManager.addServer();
    });
    const addClientCommand = vscode.commands.registerCommand('mcpManager.addClient', () => {
        mcpManager.addClient();
    });
    const startServerCommand = vscode.commands.registerCommand('mcpManager.startServer', (serverId) => {
        mcpManager.startServer(serverId);
    });
    const stopServerCommand = vscode.commands.registerCommand('mcpManager.stopServer', (serverId) => {
        mcpManager.stopServer(serverId);
    });
    const startClientCommand = vscode.commands.registerCommand('mcpManager.startClient', (clientId) => {
        mcpManager.startClient(clientId);
    });
    const stopClientCommand = vscode.commands.registerCommand('mcpManager.stopClient', (clientId) => {
        mcpManager.stopClient(clientId);
    });
    // Add commands to the extension context
    context.subscriptions.push(showPanelCommand, addServerCommand, addClientCommand, startServerCommand, stopServerCommand, startClientCommand, stopClientCommand);
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
    mcpWebViewPanel_1.MCPWebViewPanel.createOrShow(context.extensionUri, mcpManager);
}
function deactivate() {
    // Clean up resources when extension is deactivated
}
//# sourceMappingURL=extension.js.map