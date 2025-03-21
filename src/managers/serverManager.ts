import * as vscode from 'vscode';
import axios from 'axios';

interface MCPServer {
    name: string;
    url: string;
    status?: 'online' | 'offline';
    lastCheck?: Date;
}

export class MCPServerManager {
    private servers: MCPServer[] = [];
    private readonly storageKey = 'mcpServers';

    constructor(private context: vscode.ExtensionContext) {
        this.loadServers();
    }

    private async loadServers() {
        const storedServers = this.context.globalState.get<MCPServer[]>(this.storageKey);
        if (storedServers) {
            this.servers = storedServers;
        }
    }

    private async saveServers() {
        await this.context.globalState.update(this.storageKey, this.servers);
    }

    async getServers(): Promise<MCPServer[]> {
        return this.servers;
    }

    async addServer(name: string, url: string): Promise<void> {
        const server: MCPServer = {
            name,
            url,
            status: 'offline'
        };

        this.servers.push(server);
        await this.saveServers();
        await this.checkServerStatus(server);
    }

    async removeServer(url: string): Promise<void> {
        this.servers = this.servers.filter(server => server.url !== url);
        await this.saveServers();
    }

    async checkServerStatus(server: MCPServer): Promise<void> {
        try {
            const response = await axios.get(`${server.url}/health`);
            server.status = response.status === 200 ? 'online' : 'offline';
            server.lastCheck = new Date();
            await this.saveServers();
        } catch (error: unknown) {
            // Properly type the error and handle it
            server.status = 'offline';
            server.lastCheck = new Date();
            await this.saveServers();
            
            // Optional: Log the error with proper typing
            if (error instanceof Error) {
                console.error(`Server check failed: ${error.message}`);
            } else {
                console.error(`Server check failed with unknown error`);
            }
        }
    }

    async checkAllServers(): Promise<void> {
        for (const server of this.servers) {
            await this.checkServerStatus(server);
        }
    }
}