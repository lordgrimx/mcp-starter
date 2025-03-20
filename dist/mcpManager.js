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
        this.activeTerminals = new Map();
        this.tools = [
            {
                name: 'ProcessManager',
                description: 'MCP process yönetimi için kullanılan araç. Süreçleri başlatma, durdurma ve izleme imkanı sağlar.',
                category: 'process',
                icon: 'terminal',
                metadata: {
                    copilotTags: ['mcp', 'process', 'management', 'terminal'],
                    examples: [
                        'ProcessManager.start("myProcess")',
                        'ProcessManager.stop("myProcess")',
                        'ProcessManager.monitor()'
                    ]
                }
            },
            {
                name: 'SSEClient',
                description: 'Server-Sent Events bağlantılarını yöneten araç. Real-time veri akışı sağlar.',
                category: 'network',
                icon: 'plug',
                metadata: {
                    copilotTags: ['mcp', 'sse', 'events', 'streaming'],
                    examples: [
                        'SSEClient.connect("http://localhost:3000/sse")',
                        'SSEClient.subscribe("eventName")',
                        'SSEClient.disconnect()'
                    ]
                }
            },
            {
                name: 'CommandRunner',
                description: 'Shell komutlarını ve scriptleri çalıştırmak için kullanılan araç.',
                category: 'process',
                icon: 'terminal-cmd',
                metadata: {
                    copilotTags: ['mcp', 'command', 'shell', 'script'],
                    examples: [
                        'CommandRunner.execute("npm install")',
                        'CommandRunner.runScript("build.sh")',
                        'CommandRunner.background("watch")'
                    ]
                }
            },
            {
                name: 'NetworkMonitor',
                description: 'Ağ bağlantılarını ve olaylarını izleyen araç.',
                category: 'network',
                icon: 'network',
                metadata: {
                    copilotTags: ['mcp', 'network', 'monitoring', 'events'],
                    examples: [
                        'NetworkMonitor.watch("localhost:3000")',
                        'NetworkMonitor.trackConnections()',
                        'NetworkMonitor.analyze()'
                    ]
                }
            }
        ];
        this.context = context;
        this.serversProvider = new serverTreeDataProvider_1.ServerTreeDataProvider(this);
        this.clientsProvider = new clientTreeDataProvider_1.ClientTreeDataProvider(this);
        // Platform-independent settings path
        this.settingsPath = path.join(os.homedir(), process.platform === 'darwin'
            ? 'Library/Application Support/Code/User/settings.json'
            : process.platform === 'linux'
                ? '.config/Code/User/settings.json'
                : 'AppData/Roaming/Code/User/settings.json');
        this.loadServersAndClients();
    }
    loadServersAndClients() {
        try {
            if (fs.existsSync(this.settingsPath)) {
                const fileContent = fs.readFileSync(this.settingsPath, 'utf8');
                const settings = JSON.parse(fileContent);
                // Load servers from settings
                const savedServers = settings["mcpmanager.servers"] || [];
                this.servers = savedServers.map(s => ({
                    id: s.id,
                    name: s.name,
                    type: s.type,
                    command: s.command,
                    isActive: false // Always start as inactive
                }));
                // Load clients from settings
                const savedClients = settings["mcpmanager.clients"] || [];
                this.clients = savedClients.map(c => ({
                    id: c.id,
                    name: c.name,
                    type: c.type,
                    command: c.command,
                    isActive: false // Always start as inactive
                }));
            }
        }
        catch (error) {
            // If there's an error reading settings, try loading from extension storage
            const storedServers = this.context.globalState.get('mcpServers', []);
            const storedClients = this.context.globalState.get('mcpClients', []);
            this.servers = storedServers;
            this.clients = storedClients;
        }
        // Refresh the tree views
        this.refreshTreeViews();
    }
    async updateGlobalSettings() {
        try {
            const config = vscode.workspace.getConfiguration();
            // Update server and client configurations
            await config.update('mcpmanager.servers', this.servers, vscode.ConfigurationTarget.Global);
            await config.update('mcpmanager.clients', this.clients, vscode.ConfigurationTarget.Global);
            // Update MCP tool settings
            await config.update('mcpmanager.enableToolViews', true, vscode.ConfigurationTarget.Global);
            await config.update('mcpmanager.showStatusBar', true, vscode.ConfigurationTarget.Global);
            await config.update('mcpmanager.autoStartServers', false, vscode.ConfigurationTarget.Global);
            await config.update('mcpmanager.logLevel', 'info', vscode.ConfigurationTarget.Global);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to update global settings: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    saveServersAndClients() {
        // Save to storage
        this.context.globalState.update('mcpServers', this.servers);
        this.context.globalState.update('mcpClients', this.clients);
        // Update both workspace and global settings
        this.updateVSCodeSettings();
        this.updateGlobalSettings();
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
            // Update workspace settings instead of user settings
            const config = vscode.workspace.getConfiguration('mcpmanager');
            config.update('servers', this.servers, vscode.ConfigurationTarget.Workspace);
            config.update('clients', this.clients, vscode.ConfigurationTarget.Workspace);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to update VS Code settings: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async addServer(data) {
        if (data) {
            const newServer = {
                id: Date.now().toString(),
                name: data.name,
                type: data.type,
                command: data.command,
                isActive: false
            };
            this.servers.push(newServer);
            this.saveServersAndClients();
            mcpWebViewPanel_1.MCPWebViewPanel.refresh();
            return;
        }
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
    async addClient(data) {
        if (data) {
            const newClient = {
                id: Date.now().toString(),
                name: data.name,
                type: data.type,
                command: data.command,
                isActive: false
            };
            this.clients.push(newClient);
            this.saveServersAndClients();
            mcpWebViewPanel_1.MCPWebViewPanel.refresh();
            return;
        }
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
    editServer(data) {
        const serverIndex = this.servers.findIndex(s => s.id === data.id);
        if (serverIndex === -1) {
            vscode.window.showErrorMessage(`Server with ID ${data.id} not found.`);
            return;
        }
        const isActive = this.servers[serverIndex].isActive;
        this.servers[serverIndex] = {
            ...data,
            isActive
        };
        this.saveServersAndClients();
        mcpWebViewPanel_1.MCPWebViewPanel.refresh();
    }
    editClient(data) {
        const clientIndex = this.clients.findIndex(c => c.id === data.id);
        if (clientIndex === -1) {
            vscode.window.showErrorMessage(`Client with ID ${data.id} not found.`);
            return;
        }
        const isActive = this.clients[clientIndex].isActive;
        this.clients[clientIndex] = {
            ...data,
            isActive
        };
        this.saveServersAndClients();
        mcpWebViewPanel_1.MCPWebViewPanel.refresh();
    }
    deleteServer(serverId) {
        const serverIndex = this.servers.findIndex(s => s.id === serverId);
        if (serverIndex === -1) {
            vscode.window.showErrorMessage(`Server with ID ${serverId} not found.`);
            return;
        }
        if (this.servers[serverIndex].isActive) {
            this.stopServer(serverId);
        }
        this.servers.splice(serverIndex, 1);
        this.saveServersAndClients();
        mcpWebViewPanel_1.MCPWebViewPanel.refresh();
    }
    deleteClient(clientId) {
        const clientIndex = this.clients.findIndex(c => c.id === clientId);
        if (clientIndex === -1) {
            vscode.window.showErrorMessage(`Client with ID ${clientId} not found.`);
            return;
        }
        if (this.clients[clientIndex].isActive) {
            this.stopClient(clientId);
        }
        this.clients.splice(clientIndex, 1);
        this.saveServersAndClients();
        mcpWebViewPanel_1.MCPWebViewPanel.refresh();
    }
    getServerDetails(serverId) {
        return this.servers.find(s => s.id === serverId);
    }
    getClientDetails(clientId) {
        return this.clients.find(c => c.id === clientId);
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
                    this.activeTerminals.set(serverId, terminal);
                }
            }
            else if (server.type === 'sse') {
                // WebSocket server implementation
                const wsScript = `
                    const WebSocket = require('ws');
                    const port = ${server.command.split(':')[1] || 3000};
                    
                    const wss = new WebSocket.Server({ port });
                    console.log(\`WebSocket Server running on ws://localhost:\${port}\`);
                    
                    wss.on('connection', (ws) => {
                        console.log('New connection established');
                        
                        // Send welcome message
                        ws.send(JSON.stringify({ type: 'connected', message: 'Server ready' }));
                        
                        // Setup heartbeat
                        const heartbeat = setInterval(() => {
                            if (ws.readyState === WebSocket.OPEN) {
                                ws.send(JSON.stringify({ type: 'heartbeat', message: 'ping' }));
                            }
                        }, 5000);
                        
                        ws.on('message', (data) => {
                            try {
                                const message = JSON.parse(data.toString());
                                console.log('Received:', message);
                            } catch (e) {
                                console.log('Received raw message:', data.toString());
                            }
                        });
                        
                        ws.on('close', () => {
                            console.log('Client disconnected');
                            clearInterval(heartbeat);
                        });
                        
                        ws.on('error', (error) => {
                            console.error('WebSocket error:', error);
                        });
                    });
                    
                    process.on('SIGINT', () => {
                        wss.close(() => {
                            console.log('Server closed');
                            process.exit();
                        });
                    });
                `;
                const terminal = await this.startProcess(server.name, `node -e "${wsScript.replace(/\n\s+/g, ' ')}"`);
                if (terminal) {
                    server.isActive = true;
                    this.activeTerminals.set(serverId, terminal);
                }
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
        const terminal = this.activeTerminals.get(serverId);
        if (terminal) {
            terminal.dispose(); // Kill the terminal
            this.activeTerminals.delete(serverId);
        }
        server.isActive = false;
        this.saveServersAndClients();
        mcpWebViewPanel_1.MCPWebViewPanel.refresh();
    }
    async startClient(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client) {
            vscode.window.showErrorMessage(`Client with ID ${clientId} not found.`);
            return;
        }
        try {
            if (client.type === 'process') {
                const terminal = await this.startProcess(client.name, client.command);
                if (terminal) {
                    client.isActive = true;
                    this.activeTerminals.set(clientId, terminal);
                }
            }
            else if (client.type === 'sse') {
                // Use the SSE client script from the workspace
                const scriptPath = path.join(this.context.extensionPath, 'dist', 'scripts', 'wsClient.js');
                if (!fs.existsSync(scriptPath)) {
                    vscode.window.showErrorMessage(`SSE client script not found at ${scriptPath}`);
                    return;
                }
                // Ensure eventsource-parser is installed
                if (!fs.existsSync(path.join(this.context.extensionPath, 'node_modules', 'eventsource-parser'))) {
                    const npmInstall = await this.startProcess('npm install', 'npm install eventsource-parser');
                    if (npmInstall) {
                        await new Promise((resolve) => {
                            npmInstall.processId.then(pid => {
                                if (pid) {
                                    const interval = setInterval(() => {
                                        if (fs.existsSync(path.join(this.context.extensionPath, 'node_modules', 'eventsource-parser'))) {
                                            clearInterval(interval);
                                            resolve();
                                        }
                                    }, 1000);
                                }
                            });
                        });
                    }
                }
                const terminal = await this.startProcess(client.name, `node "${scriptPath}" "${client.command}"`);
                if (terminal) {
                    client.isActive = true;
                    this.activeTerminals.set(clientId, terminal);
                }
            }
            this.saveServersAndClients();
            mcpWebViewPanel_1.MCPWebViewPanel.refresh();
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to start client: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    stopClient(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client) {
            vscode.window.showErrorMessage(`Client with ID ${clientId} not found.`);
            return;
        }
        const terminal = this.activeTerminals.get(clientId);
        if (terminal) {
            terminal.dispose(); // Kill the terminal
            this.activeTerminals.delete(clientId);
        }
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
    getTools() {
        return this.tools;
    }
}
exports.MCPManager = MCPManager;
//# sourceMappingURL=mcpManager.js.map