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
exports.ServerTreeItem = exports.ServerTreeDataProvider = void 0;
const vscode = __importStar(require("vscode"));
class ServerTreeDataProvider {
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
            // Root level - return all servers
            const servers = this.mcpManager.getServers();
            return Promise.resolve(servers.map(server => new ServerTreeItem(server, server.name, vscode.TreeItemCollapsibleState.None, {
                title: server.isActive ? 'Stop Server' : 'Start Server',
                command: server.isActive ? 'mcpManager.stopServer' : 'mcpManager.startServer',
                arguments: [server.id]
            })));
        }
        return Promise.resolve([]);
    }
}
exports.ServerTreeDataProvider = ServerTreeDataProvider;
class ServerTreeItem extends vscode.TreeItem {
    constructor(server, label, collapsibleState, command) {
        super(label, collapsibleState);
        this.server = server;
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.command = command;
        this.tooltip = `Type: ${server.type} | Command: ${server.command}`;
        this.description = server.isActive ? 'Running' : 'Stopped';
        this.iconPath = server.isActive ?
            new vscode.ThemeIcon('play') :
            new vscode.ThemeIcon('stop');
        this.contextValue = 'mcpServer';
    }
}
exports.ServerTreeItem = ServerTreeItem;
//# sourceMappingURL=serverTreeDataProvider.js.map