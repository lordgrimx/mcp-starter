import * as vscode from 'vscode';
import { MCPManager } from '../mcpManager';
import { MCPClient } from '../models/mcpClient';

export class ClientTreeDataProvider implements vscode.TreeDataProvider<ClientTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ClientTreeItem | undefined | null | void> = new vscode.EventEmitter<ClientTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ClientTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
    
    constructor(private mcpManager: MCPManager) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ClientTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ClientTreeItem): Thenable<ClientTreeItem[]> {
        if (!element) {
            // Root level - return all clients
            const clients = this.mcpManager.getClients();
            return Promise.resolve(
                clients.map(client => new ClientTreeItem(
                    client,
                    client.name,
                    vscode.TreeItemCollapsibleState.None,
                    {
                        title: client.isActive ? 'Stop Client' : 'Start Client',
                        command: client.isActive ? 'mcpManager.stopClient' : 'mcpManager.startClient',
                        arguments: [client.id]
                    }
                ))
            );
        }
        
        return Promise.resolve([]);
    }
}

export class ClientTreeItem extends vscode.TreeItem {
    constructor(
        public readonly client: MCPClient,
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        
        this.tooltip = `Type: ${client.type} | Command: ${client.command}`;
        this.description = client.isActive ? 'Running' : 'Stopped';
        this.iconPath = client.isActive ? 
            new vscode.ThemeIcon('play') :
            new vscode.ThemeIcon('stop');
        this.contextValue = 'mcpClient';
    }
}