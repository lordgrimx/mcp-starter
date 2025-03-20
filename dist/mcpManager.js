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
exports.MCPManager = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const serverTreeDataProvider_1 = require("./providers/serverTreeDataProvider");
const clientTreeDataProvider_1 = require("./providers/clientTreeDataProvider");
const mcpWebViewPanel_1 = require("./webviews/mcpWebViewPanel");
class MCPManager {
    constructor(context) {
        this.servers = [];
        this.clients = [];
        this.context = context;
        this.serversProvider = new serverTreeDataProvider_1.ServerTreeDataProvider(this);
        this.clientsProvider = new clientTreeDataProvider_1.ClientTreeDataProvider(this);
        // Platform-independent settings path
        this.settingsPath = path.join(os.homedir(), process.platform === 'darwin'
            ? 'Library/Application Support/Code - Insiders/User/settings.json'
            : process.platform === 'linux'
                ? '.config/Code - Insiders/User/settings.json'
                : 'AppData/Roaming/Code - Insiders/User/settings.json');
        this.loadServersAndClients();
    }
    loadServersAndClients() {
        // Load from storage if available
        const storedServers = this.context.globalState.get('mcpServers', []);
        const storedClients = this.context.globalState.get('mcpClients', []);
        this.servers = storedServers;
        this.clients = storedClients;
        // Refresh the tree views
        this.refreshTreeViews();
    }
    saveServersAndClients() {
        // Save to storage
        this.context.globalState.update('mcpServers', this.servers);
        this.context.globalState.update('mcpClients', this.clients);
        // Refresh the tree views
        this.refreshTreeViews();
    }
    refreshTreeViews() {
        this.serversProvider.refresh();
        this.clientsProvider.refresh();
        this.updateVSCodeSettings();
    }
    updateVSCodeSettings() {
        try {
            if (fs.existsSync(this.settingsPath)) {
                let settings = JSON.parse(fs.readFileSync(this.settingsPath, 'utf8'));
                // Update settings based on clients
                for (const client of this.clients) {
                    // Example: add a property for each client
                    settings[`mcp.client.${client.id}`] = {
                        name: client.name,
                        type: client.type,
                        isActive: client.isActive,
                        // Add other relevant client properties
                    };
                }
                fs.writeFileSync(this.settingsPath, JSON.stringify(settings, null, 4), 'utf8');
                vscode.window.showInformationMessage('VS Code settings updated successfully.');
            }
            else {
                vscode.window.showWarningMessage('VS Code settings.json file not found.');
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to update VS Code settings: ${error}`);
        }
    }
    async addServer() {
        const serverName = await vscode.window.showInputBox({
            prompt: 'Enter a name for the server',
            placeHolder: 'Server Name'
        });
        if (!serverName) {
            return;
        }
        const typeOptions = [
            { label: 'process', description: 'Run a command in a terminal' },
            { label: 'sse', description: 'Connect to Server-Sent Events endpoint' }
        ];
        const selectedType = await vscode.window.showQuickPick(typeOptions, {
            placeHolder: 'Select server type'
        });
        if (!selectedType) {
            return;
        }
        const serverType = selectedType.label;
        let command = '';
        if (serverType === 'process') {
            command = await vscode.window.showInputBox({
                prompt: 'Enter the command to run',
                placeHolder: 'Command'
            }) || '';
        }
        else if (serverType === 'sse') {
            command = await vscode.window.showInputBox({
                prompt: 'Enter the SSE endpoint URL',
                placeHolder: 'URL'
            }) || '';
        }
        const newServer = {
            id: Date.now().toString(),
            name: serverName,
            type: serverType,
            command: command,
            isActive: false
        };
        this.servers.push(newServer);
        this.saveServersAndClients();
        mcpWebViewPanel_1.MCPWebViewPanel.refresh();
    }
    async addClient() {
        const clientName = await vscode.window.showInputBox({
            prompt: 'Enter a name for the client',
            placeHolder: 'Client Name'
        });
        if (!clientName) {
            return;
        }
        const typeOptions = [
            { label: 'process', description: 'Run a command in a terminal' },
            { label: 'sse', description: 'Connect to Server-Sent Events endpoint' }
        ];
        const selectedType = await vscode.window.showQuickPick(typeOptions, {
            placeHolder: 'Select client type'
        });
        if (!selectedType) {
            return;
        }
        const clientType = selectedType.label;
        let command = '';
        if (clientType === 'process') {
            command = await vscode.window.showInputBox({
                prompt: 'Enter the command to run',
                placeHolder: 'Command'
            }) || '';
        }
        else if (clientType === 'sse') {
            command = await vscode.window.showInputBox({
                prompt: 'Enter the SSE endpoint URL',
                placeHolder: 'URL'
            }) || '';
        }
        const newClient = {
            id: Date.now().toString(),
            name: clientName,
            type: clientType,
            command: command,
            isActive: false
        };
        this.clients.push(newClient);
        this.saveServersAndClients();
        mcpWebViewPanel_1.MCPWebViewPanel.refresh();
    }
    async startProcess(name, command) {
        try {
            const terminal = vscode.window.createTerminal(`MCP ${name}`);
            terminal.sendText(command);
            terminal.show();
            return terminal;
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to start process: ${error instanceof Error ? error.message : String(error)}`);
            return undefined;
        }
    }
    async startServer(serverId) {
        const server = this.servers.find(s => s.id === serverId);
        if (!server) {
            vscode.window.showErrorMessage(`Server with ID ${serverId} not found.`);
            return;
        }
        try {
            if (server.type === 'process') {
                const terminal = await this.startProcess(server.name, server.command);
                if (terminal) {
                    server.isActive = true;
                }
            }
            else if (server.type === 'sse') {
                // SSE connection logic would go here
                vscode.window.showInformationMessage(`SSE connection to ${server.command} established.`);
                server.isActive = true;
            }
            this.saveServersAndClients();
            mcpWebViewPanel_1.MCPWebViewPanel.refresh();
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to start server: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    stopServer(serverId) {
        const server = this.servers.find(s => s.id === serverId);
        if (!server) {
            vscode.window.showErrorMessage(`Server with ID ${serverId} not found.`);
            return;
        }
        // Logic to stop the server (depends on implementation)
        vscode.window.showInformationMessage(`Server ${server.name} stopped.`);
        server.isActive = false;
        this.saveServersAndClients();
        mcpWebViewPanel_1.MCPWebViewPanel.refresh();
    }
    startClient(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client) {
            vscode.window.showErrorMessage(`Client with ID ${clientId} not found.`);
            return;
        }
        if (client.type === 'process') {
            // Start the process using the command
            const terminal = vscode.window.createTerminal(`MCP Client: ${client.name}`);
            terminal.sendText(client.command);
            terminal.show();
        }
        else if (client.type === 'sse') {
            // SSE connection logic would go here
            vscode.window.showInformationMessage(`SSE connection to ${client.command} established.`);
        }
        client.isActive = true;
        this.saveServersAndClients();
        mcpWebViewPanel_1.MCPWebViewPanel.refresh();
    }
    stopClient(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client) {
            vscode.window.showErrorMessage(`Client with ID ${clientId} not found.`);
            return;
        }
        // Logic to stop the client (depends on implementation)
        vscode.window.showInformationMessage(`Client ${client.name} stopped.`);
        client.isActive = false;
        this.saveServersAndClients();
        mcpWebViewPanel_1.MCPWebViewPanel.refresh();
    }
    getServers() {
        return this.servers;
    }
    getClients() {
        return this.clients;
    }
    getServersProvider() {
        return this.serversProvider;
    }
    getClientsProvider() {
        return this.clientsProvider;
    }
}
exports.MCPManager = MCPManager;
//# sourceMappingURL=mcpManager.js.map