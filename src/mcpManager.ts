import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { WebSocket, WebSocketServer } from 'ws';
import { ServerTreeDataProvider } from './providers/serverTreeDataProvider';
import { ClientTreeDataProvider } from './providers/clientTreeDataProvider';
import { MCPServer, MCPServerType } from './models/mcpServer';
import { MCPClient, MCPClientType } from './models/mcpClient';
import { MCPWebViewPanel } from './webviews/mcpWebViewPanel';

interface MCPConfigSettings {
    "mcpmanager.servers": Array<{
        name: string;
        type: MCPServerType;
        isActive: boolean;
        command: string;
        id: string;
    }>;
    "mcpmanager.clients": Array<{
        name: string;
        type: MCPClientType;
        isActive: boolean;
        command: string;
        id: string;
    }>;
    [key: string]: any;
}

export class MCPManager {
    private servers: MCPServer[] = [];
    private clients: MCPClient[] = [];
    private context: vscode.ExtensionContext;
    private serversProvider: ServerTreeDataProvider;
    private clientsProvider: ClientTreeDataProvider;
    private settingsPath: string;
    private activeTerminals: Map<string, vscode.Terminal> = new Map();

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.serversProvider = new ServerTreeDataProvider(this);
        this.clientsProvider = new ClientTreeDataProvider(this);
        
        // Platform-independent settings path
        this.settingsPath = path.join(
            os.homedir(),
            process.platform === 'darwin' 
                ? 'Library/Application Support/Code/User/settings.json'
                : process.platform === 'linux'
                    ? '.config/Code/User/settings.json'
                    : 'AppData/Roaming/Code/User/settings.json'
        );
        
        this.loadServersAndClients();
    }

    private loadServersAndClients() {
        try {
            if (fs.existsSync(this.settingsPath)) {
                const fileContent = fs.readFileSync(this.settingsPath, 'utf8');
                const settings = JSON.parse(fileContent) as MCPConfigSettings;

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
        } catch (error) {
            // If there's an error reading settings, try loading from extension storage
            const storedServers = this.context.globalState.get<MCPServer[]>('mcpServers', []);
            const storedClients = this.context.globalState.get<MCPClient[]>('mcpClients', []);

            this.servers = storedServers;
            this.clients = storedClients;
        }

        // Refresh the tree views
        this.refreshTreeViews();
    }

    private saveServersAndClients() {
        // Save to storage
        this.context.globalState.update('mcpServers', this.servers);
        this.context.globalState.update('mcpClients', this.clients);

        // Refresh the tree views
        this.refreshTreeViews();
    }

    private refreshTreeViews() {
        this.serversProvider.refresh();
        this.clientsProvider.refresh();
        this.updateVSCodeSettings();
    }

    private updateVSCodeSettings() {
        try {
            // Update workspace settings instead of user settings
            const config = vscode.workspace.getConfiguration('mcpmanager');
            
            config.update('servers', this.servers, vscode.ConfigurationTarget.Workspace);
            config.update('clients', this.clients, vscode.ConfigurationTarget.Workspace);
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to update VS Code settings: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    public async addServer(data?: { name: string; type: MCPServerType; command: string }) {
        if (data) {
            const newServer: MCPServer = {
                id: Date.now().toString(),
                name: data.name,
                type: data.type,
                command: data.command,
                isActive: false
            };

            this.servers.push(newServer);
            this.saveServersAndClients();
            MCPWebViewPanel.refresh();
            return;
        }
        const serverName = await vscode.window.showInputBox({
            prompt: 'Enter a name for the server',
            placeHolder: 'Server Name'
        });

        if (!serverName) {
            return;
        }

        const typeOptions: vscode.QuickPickItem[] = [
            { label: 'process', description: 'Run a command in a terminal' },
            { label: 'sse', description: 'Connect to Server-Sent Events endpoint' }
        ];

        const selectedType = await vscode.window.showQuickPick(typeOptions, {
            placeHolder: 'Select server type'
        });

        if (!selectedType) {
            return;
        }

        const serverType = selectedType.label as MCPServerType;
        let command = '';
        if (serverType === 'process') {
            command = await vscode.window.showInputBox({
                prompt: 'Enter the command to run',
                placeHolder: 'Command'
            }) || '';
        } else if (serverType === 'sse') {
            command = await vscode.window.showInputBox({
                prompt: 'Enter the SSE endpoint URL',
                placeHolder: 'URL'
            }) || '';
        }

        const newServer: MCPServer = {
            id: Date.now().toString(),
            name: serverName,
            type: serverType,
            command: command,
            isActive: false
        };

        this.servers.push(newServer);
        this.saveServersAndClients();
        MCPWebViewPanel.refresh();
    }

    public async addClient(data?: { name: string; type: MCPClientType; command: string }) {
        if (data) {
            const newClient: MCPClient = {
                id: Date.now().toString(),
                name: data.name,
                type: data.type,
                command: data.command,
                isActive: false
            };

            this.clients.push(newClient);
            this.saveServersAndClients();
            MCPWebViewPanel.refresh();
            return;
        }
        const clientName = await vscode.window.showInputBox({
            prompt: 'Enter a name for the client',
            placeHolder: 'Client Name'
        });

        if (!clientName) {
            return;
        }

        const typeOptions: vscode.QuickPickItem[] = [
            { label: 'process', description: 'Run a command in a terminal' },
            { label: 'sse', description: 'Connect to Server-Sent Events endpoint' }
        ];

        const selectedType = await vscode.window.showQuickPick(typeOptions, {
            placeHolder: 'Select client type'
        });

        if (!selectedType) {
            return;
        }

        const clientType = selectedType.label as MCPClientType;
        let command = '';
        if (clientType === 'process') {
            command = await vscode.window.showInputBox({
                prompt: 'Enter the command to run',
                placeHolder: 'Command'
            }) || '';
        } else if (clientType === 'sse') {
            command = await vscode.window.showInputBox({
                prompt: 'Enter the SSE endpoint URL',
                placeHolder: 'URL'
            }) || '';
        }

        const newClient: MCPClient = {
            id: Date.now().toString(),
            name: clientName,
            type: clientType,
            command: command,
            isActive: false
        };

        this.clients.push(newClient);
        this.saveServersAndClients();
        MCPWebViewPanel.refresh();
    }

    public editServer(data: { id: string; name: string; type: MCPServerType; command: string }) {
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
        MCPWebViewPanel.refresh();
    }

    public editClient(data: { id: string; name: string; type: MCPClientType; command: string }) {
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
        MCPWebViewPanel.refresh();
    }

    public deleteServer(serverId: string) {
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
        MCPWebViewPanel.refresh();
    }

    public deleteClient(clientId: string) {
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
        MCPWebViewPanel.refresh();
    }

    public getServerDetails(serverId: string) {
        return this.servers.find(s => s.id === serverId);
    }

    public getClientDetails(clientId: string) {
        return this.clients.find(c => c.id === clientId);
    }

    private async startProcess(name: string, command: string): Promise<vscode.Terminal | undefined> {
        try {
            const terminal = vscode.window.createTerminal(`MCP ${name}`);
            terminal.sendText(command);
            terminal.show();
            return terminal;
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to start process: ${error instanceof Error ? error.message : String(error)}`);
            return undefined;
        }
    }

    public async startServer(serverId: string) {
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
            } else if (server.type === 'sse') {
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
            MCPWebViewPanel.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to start server: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    public stopServer(serverId: string) {
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
        MCPWebViewPanel.refresh();
    }

    public async startClient(clientId: string) {
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
            } else if (client.type === 'sse') {
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
                        await new Promise<void>((resolve) => {
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
            MCPWebViewPanel.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to start client: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    public stopClient(clientId: string) {
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
        MCPWebViewPanel.refresh();
    }

    public getServers(): MCPServer[] {
        return this.servers;
    }

    public getClients(): MCPClient[] {
        return this.clients;
    }

    public getServersProvider(): ServerTreeDataProvider {
        return this.serversProvider;
    }

    public getClientsProvider(): ClientTreeDataProvider {
        return this.clientsProvider;
    }
}