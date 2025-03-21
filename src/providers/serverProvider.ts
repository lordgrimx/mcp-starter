import * as vscode from 'vscode';
import { MCPServerManager } from '../managers/serverManager';

// Create a base type for server tree items
type ServerTreeItem = MCPServerItem | AddServerItem;

export class MCPServerProvider implements vscode.TreeDataProvider<ServerTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ServerTreeItem | undefined | null | void> = new vscode.EventEmitter<ServerTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ServerTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private serverManager: MCPServerManager) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ServerTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: ServerTreeItem): Promise<ServerTreeItem[]> {
        if (!element) {
            const servers = await this.serverManager.getServers();
            const serverItems = servers.map(server => new MCPServerItem(server.name, server.url, vscode.TreeItemCollapsibleState.None));
            const addServerItem = new AddServerItem();
            return [...serverItems, addServerItem];
        }
        return [];
    }
}

class MCPServerItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly url: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
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