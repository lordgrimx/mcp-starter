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
exports.MCPToolsProvider = void 0;
const vscode = __importStar(require("vscode"));
class MCPToolsProvider {
    constructor() {
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
exports.MCPToolsProvider = MCPToolsProvider;
class MCPToolItem extends vscode.TreeItem {
    constructor(label, toolId, collapsibleState) {
        super(label, collapsibleState);
        this.label = label;
        this.toolId = toolId;
        this.collapsibleState = collapsibleState;
        this.tooltip = this.label;
        this.iconPath = new vscode.ThemeIcon(this.getIconName());
        this.contextValue = `mcpTool.${toolId}`;
    }
    getIconName() {
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
//# sourceMappingURL=toolsProvider.js.map