import * as vscode from 'vscode';
import { MCPServerManager } from '../managers/serverManager';

export class MCPServerProvider implements vscode.TreeDataProvider<MCPServerItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<MCPServerItem | undefined | null | void> = new vscode.EventEmitter<MCPServerItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<MCPServerItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private serverManager: MCPServerManager) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: MCPServerItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: MCPServerItem): Promise<MCPServerItem[]> {
        if (!element) {
            const servers = await this.serverManager.getServers();
            return servers.map(server => new MCPServerItem(server.name, server.url, vscode.TreeItemCollapsibleState.None));
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