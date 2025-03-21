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
exports.MCPServerProvider = void 0;
const vscode = __importStar(require("vscode"));
class MCPServerProvider {
    constructor(serverManager) {
        this.serverManager = serverManager;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        if (!element) {
            const servers = await this.serverManager.getServers();
            const serverItems = servers.map(server => new MCPServerItem(server.name, server.url, vscode.TreeItemCollapsibleState.None));
            const addServerItem = new AddServerItem();
            return [...serverItems, addServerItem];
        }
        return [];
    }
}
exports.MCPServerProvider = MCPServerProvider;
class MCPServerItem extends vscode.TreeItem {
    constructor(label, url, collapsibleState) {
        super(label, collapsibleState);
        this.label = label;
        this.url = url;
        this.collapsibleState = collapsibleState;
        this.tooltip = `${this.label} (${this.url})`;
        this.description = this.url;
        this.iconPath = new vscode.ThemeIcon('server');
        this.contextValue = 'mcpServer';
    }
}
class AddServerItem extends vscode.TreeItem {
    constructor() {
        super('Sunucu Ekle', vscode.TreeItemCollapsibleState.None);
        this.iconPath = new vscode.ThemeIcon('add');
        this.contextValue = 'addServer';
        this.command = {
            command: 'mcpstore.createServer',
            title: 'Sunucu Ekle',
            tooltip: 'Yeni MCP sunucusu ekle'
        };
    }
}
//# sourceMappingURL=serverProvider.js.map