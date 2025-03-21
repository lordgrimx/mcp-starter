import * as vscode from 'vscode';

export class MCPToolsProvider implements vscode.TreeDataProvider<MCPToolItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<MCPToolItem | undefined | null | void> = new vscode.EventEmitter<MCPToolItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<MCPToolItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: MCPToolItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: MCPToolItem): MCPToolItem[] {
        if (!element) {
            return [
                new MCPToolItem('Model Yönetimi', 'model', vscode.TreeItemCollapsibleState.None),
                new MCPToolItem('Context Yönetimi', 'context', vscode.TreeItemCollapsibleState.None),
                new MCPToolItem('Protokol Ayarları', 'protocol', vscode.TreeItemCollapsibleState.None),
                new MCPToolItem('API Dokümantasyonu', 'docs', vscode.TreeItemCollapsibleState.None)
            ];
        }
        return [];
    }
}

class MCPToolItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly toolId: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = this.label;
        this.iconPath = new vscode.ThemeIcon(this.getIconName());
        this.contextValue = `mcpTool.${toolId}`;
    }

    private getIconName(): string {
        switch (this.toolId) {
            case 'model':
                return 'symbol-class';
            case 'context':
                return 'symbol-variable';
            case 'protocol':
                return 'symbol-interface';
            case 'docs':
                return 'book';
            default:
                return 'tools';
        }
    }
} 