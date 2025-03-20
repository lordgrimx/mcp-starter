import * as vscode from 'vscode';
import { MCPManager } from '../mcpManager';
import { MCPServer } from '../models/mcpServer';

export class ServerTreeDataProvider implements vscode.TreeDataProvider<ServerTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ServerTreeItem | undefined | null | void> = new vscode.EventEmitter<ServerTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ServerTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
    
    constructor(private mcpManager: MCPManager) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ServerTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ServerTreeItem): Thenable<ServerTreeItem[]> {
        if (!element) {
            // Root level - return all servers
            const servers = this.mcpManager.getServers();
            return Promise.resolve(
                servers.map(server => new ServerTreeItem(
                    server,
                    server.name,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        title: server.isActive ? 'Stop Server' : 'Start Server',
                        command: server.isActive ? 'mcpManager.stopServer' : 'mcpManager.startServer',
                        arguments: [server.id]
                    }
                ))
            );
        }
        
        return Promise.resolve([]);
    }
}

export class ServerTreeItem extends vscode.TreeItem {
    constructor(
        public readonly server: MCPServer,
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        
        this.tooltip = `Type: ${server.type} | Command: ${server.command}`;
        this.description = server.isActive ? 'Running' : 'Stopped';
        this.iconPath = server.isActive ? 
            new vscode.ThemeIcon('play') :
            new vscode.ThemeIcon('stop');
        this.contextValue = 'mcpServer';
    }
}