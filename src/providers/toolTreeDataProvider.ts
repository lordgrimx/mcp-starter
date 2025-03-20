import * as vscode from 'vscode';
import { MCPManager } from '../mcpManager';

export class ToolTreeDataProvider implements vscode.TreeDataProvider<ToolTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ToolTreeItem | undefined | null | void> = new vscode.EventEmitter<ToolTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ToolTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
    
    constructor(private mcpManager: MCPManager) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ToolTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ToolTreeItem): Thenable<ToolTreeItem[]> {
        if (!element) {
            // Root level - group tools by category
            const tools = this.mcpManager.getTools();
            const categories = new Map<string, ToolTreeItem[]>();
            
            tools.forEach(tool => {
                if (!categories.has(tool.category)) {
                    categories.set(tool.category, []);
                }
                categories.get(tool.category)?.push(
                    new ToolTreeItem(
                        tool.name,
                        tool.description,
                        tool.icon || 'tools',
                        vscode.TreeItemCollapsibleState.None,
                        {
                            command: 'mcpManager.showToolDetails',
                            title: 'Show Tool Details',
                            arguments: [tool]
                        }
                    )
                );
            });

            // Create category items
            return Promise.resolve(
                Array.from(categories.entries()).map(([category, items]) => 
                    new ToolTreeItem(
                        category.charAt(0).toUpperCase() + category.slice(1),
                        `${items.length} tools`,
                        'folder',
                        vscode.TreeItemCollapsibleState.Expanded,
                        undefined,
                        items
                    )
                )
            );
        }

        // Return children of a category
        return Promise.resolve(element.children || []);
    }
}

export class ToolTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly description: string,
        iconName: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command,
        public readonly children?: ToolTreeItem[]
    ) {
        super(label, collapsibleState);
        
        this.tooltip = description;
        this.iconPath = new vscode.ThemeIcon(iconName);
        this.contextValue = children ? 'category' : 'tool';
    }
}