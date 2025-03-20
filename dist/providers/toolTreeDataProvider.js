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
exports.ToolTreeItem = exports.ToolTreeDataProvider = void 0;
const vscode = __importStar(require("vscode"));
class ToolTreeDataProvider {
    constructor(mcpManager) {
        this.mcpManager = mcpManager;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            // Root level - group tools by category
            const tools = this.mcpManager.getTools();
            const categories = new Map();
            tools.forEach(tool => {
                if (!categories.has(tool.category)) {
                    categories.set(tool.category, []);
                }
                categories.get(tool.category)?.push(new ToolTreeItem(tool.name, tool.description, tool.icon || 'tools', vscode.TreeItemCollapsibleState.None, {
                    command: 'mcpManager.showToolDetails',
                    title: 'Show Tool Details',
                    arguments: [tool]
                }));
            });
            // Create category items
            return Promise.resolve(Array.from(categories.entries()).map(([category, items]) => new ToolTreeItem(category.charAt(0).toUpperCase() + category.slice(1), `${items.length} tools`, 'folder', vscode.TreeItemCollapsibleState.Expanded, undefined, items)));
        }
        // Return children of a category
        return Promise.resolve(element.children || []);
    }
}
exports.ToolTreeDataProvider = ToolTreeDataProvider;
class ToolTreeItem extends vscode.TreeItem {
    constructor(label, description, iconName, collapsibleState, command, children) {
        super(label, collapsibleState);
        this.label = label;
        this.description = description;
        this.collapsibleState = collapsibleState;
        this.command = command;
        this.children = children;
        this.tooltip = description;
        this.iconPath = new vscode.ThemeIcon(iconName);
        this.contextValue = children ? 'category' : 'tool';
    }
}
exports.ToolTreeItem = ToolTreeItem;
//# sourceMappingURL=toolTreeDataProvider.js.map