"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPServerManager = void 0;
const axios_1 = __importDefault(require("axios"));
class MCPServerManager {
    constructor(context) {
        this.context = context;
        this.servers = [];
        this.storageKey = 'mcpServers';
        this.loadServers();
    }
    async loadServers() {
        const storedServers = this.context.globalState.get(this.storageKey);
        if (storedServers) {
            this.servers = storedServers;
        }
    }
    async saveServers() {
        await this.context.globalState.update(this.storageKey, this.servers);
    }
    async getServers() {
        return this.servers;
    }
    async addServer(name, url) {
        const server = {
            name,
            url,
            status: 'offline'
        };
        this.servers.push(server);
        await this.saveServers();
        await this.checkServerStatus(server);
    }
    async removeServer(url) {
        this.servers = this.servers.filter(server => server.url !== url);
        await this.saveServers();
    }
    async checkServerStatus(server) {
        try {
            const response = await axios_1.default.get(`${server.url}/health`);
            server.status = response.status === 200 ? 'online' : 'offline';
            server.lastCheck = new Date();
            await this.saveServers();
        }
        catch (error) {
            // Properly type the error and handle it
            server.status = 'offline';
            server.lastCheck = new Date();
            await this.saveServers();
            // Optional: Log the error with proper typing
            if (error instanceof Error) {
                console.error(`Server check failed: ${error.message}`);
            }
            else {
                console.error(`Server check failed with unknown error`);
            }
        }
    }
    async checkAllServers() {
        for (const server of this.servers) {
            await this.checkServerStatus(server);
        }
    }
}
exports.MCPServerManager = MCPServerManager;
//# sourceMappingURL=serverManager.js.map