import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ServerTreeDataProvider } from './providers/serverTreeDataProvider';
import { ClientTreeDataProvider } from './providers/clientTreeDataProvider';
import { MCPServer, MCPServerType } from './models/mcpServer';
import { MCPClient, MCPClientType } from './models/mcpClient';
import { MCPWebViewPanel } from './webviews/mcpWebViewPanel';

interface MCPSettings {
    [key: string]: {
        name: string;
        type: MCPServerType | MCPClientType;
        isActive: boolean;
        command: string;
    };
}

export class MCPManager {
    private servers: MCPServer[] = [];
    private clients: MCPClient[] = [];
    private context: vscode.ExtensionContext;
    private serversProvider: ServerTreeDataProvider;
    private clientsProvider: ClientTreeDataProvider;
    private settingsPath: string;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.serversProvider = new ServerTreeDataProvider(this);
        this.clientsProvider = new ClientTreeDataProvider(this);
        
        // Platform-independent settings path
        this.settingsPath = path.join(
            os.homedir(),
            process.platform === 'darwin' 
                ? 'Library/Application Support/Code - Insiders/User/settings.json'
                : process.platform === 'linux'
                    ? '.config/Code - Insiders/User/settings.json'
                    : 'AppData/Roaming/Code - Insiders/User/settings.json'
        );
        
        this.loadServersAndClients();
    }

    private loadServersAndClients() {
        // Load from storage if available
        const storedServers = this.context.globalState.get<MCPServer[]>('mcpServers', []);
        const storedClients = this.context.globalState.get<MCPClient[]>('mcpClients', []);

        this.servers = storedServers;
        this.clients = storedClients;

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
            if (fs.existsSync(this.settingsPath)) {
                let settings: MCPSettings = {};
                try {
                    const fileContent = fs.readFileSync(this.settingsPath, 'utf8');
                    const parsedSettings = JSON.parse(fileContent.trim());
                    // Type assertion to handle existing non-MCP settings
                    settings = parsedSettings as { [key: string]: any };
                } catch (parseError) {
                    vscode.window.showWarningMessage('Could not parse existing settings file, creating new settings.');
                }
                
                // Clean up any existing MCP settings first
                Object.keys(settings).forEach(key => {
                    if (key.startsWith('mcp.')) {
                        delete settings[key];
                    }
                });
                
                // Update settings based on clients
                for (const client of this.clients) {
                    const key = `mcp.client.${client.id}`;
                    settings[key] = {
                        name: client.name,
                        type: client.type,
                        isActive: client.isActive,
                        command: client.command
                    };
                }

                // Update settings based on servers
                for (const server of this.servers) {
                    const key = `mcp.server.${server.id}`;
                    settings[key] = {
                        name: server.name,
                        type: server.type,
                        isActive: server.isActive,
                        command: server.command
                    };
                }
                
                // Write the settings file with proper formatting
                fs.writeFileSync(this.settingsPath, JSON.stringify(settings, null, 4));
                vscode.window.showInformationMessage('VS Code settings updated successfully.');
            } else {
                vscode.window.showWarningMessage('VS Code settings.json file not found.');
            }
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
                }
            } else if (server.type === 'sse') {
                // SSE connection logic would go here
                vscode.window.showInformationMessage(`SSE connection to ${server.command} established.`);
                server.isActive = true;
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

        // Logic to stop the server (depends on implementation)
        vscode.window.showInformationMessage(`Server ${server.name} stopped.`);

        server.isActive = false;
        this.saveServersAndClients();
        MCPWebViewPanel.refresh();
    }

    public startClient(clientId: string) {
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
        } else if (client.type === 'sse') {
            // SSE connection logic would go here
            vscode.window.showInformationMessage(`SSE connection to ${client.command} established.`);
        }

        client.isActive = true;
        this.saveServersAndClients();
        MCPWebViewPanel.refresh();
    }

    public stopClient(clientId: string) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client) {
            vscode.window.showErrorMessage(`Client with ID ${clientId} not found.`);
            return;
        }

        // Logic to stop the client (depends on implementation)
        vscode.window.showInformationMessage(`Client ${client.name} stopped.`);

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