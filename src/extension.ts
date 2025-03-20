import * as vscode from 'vscode';
import { MCPManager } from './mcpManager';
import { MCPWebViewPanel } from './webviews/mcpWebViewPanel';
import { ToolTreeDataProvider } from './providers/toolTreeDataProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('MCP Manager extension is now active!');

    // Initialize the MCP Manager
    const mcpManager = new MCPManager(context);

    // Register commands
    const showPanelCommand = vscode.commands.registerCommand('mcpManager.showPanel', () => {
        MCPWebViewPanel.createOrShow(context.extensionUri.fsPath, mcpManager);
    });

    const addServerCommand = vscode.commands.registerCommand('mcpManager.addServer', () => {
        mcpManager.addServer();
    });

    const addClientCommand = vscode.commands.registerCommand('mcpManager.addClient', () => {
        mcpManager.addClient();
    });

    const startServerCommand = vscode.commands.registerCommand('mcpManager.startServer', (serverId: string) => {
        mcpManager.startServer(serverId);
    });

    const stopServerCommand = vscode.commands.registerCommand('mcpManager.stopServer', (serverId: string) => {
        mcpManager.stopServer(serverId);
    });

    const startClientCommand = vscode.commands.registerCommand('mcpManager.startClient', (clientId: string) => {
        mcpManager.startClient(clientId);
    });

    const stopClientCommand = vscode.commands.registerCommand('mcpManager.stopClient', (clientId: string) => {
        mcpManager.stopClient(clientId);
    });

    // Add commands to the extension context
    context.subscriptions.push(
        showPanelCommand,
        addServerCommand,
        addClientCommand,
        startServerCommand,
        stopServerCommand,
        startClientCommand,
        stopClientCommand
    );

    // Create the TreeView for Servers and Clients
    const serversProvider = mcpManager.getServersProvider();
    const clientsProvider = mcpManager.getClientsProvider();

    const serversTreeView = vscode.window.createTreeView('mcpServersView', {
        treeDataProvider: serversProvider,
        showCollapseAll: true
    });

    const clientsTreeView = vscode.window.createTreeView('mcpClientsView', {
        treeDataProvider: clientsProvider,
        showCollapseAll: true
    });

    context.subscriptions.push(serversTreeView, clientsTreeView);

    // Automatically show the panel when the extension is activated
    MCPWebViewPanel.createOrShow(context.extensionUri.fsPath, mcpManager);

    // Register MCP tools with Copilot and IntelliSense
    const mcpToolsProvider = vscode.languages.registerCompletionItemProvider(
        { scheme: 'file', pattern: '**/{*.ts,*.js,*.json}' }, // Support for TypeScript, JavaScript and JSON files
        {
            provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                
                // Only show suggestions when typing comments or specific contexts
                if (!linePrefix.includes('//') && !linePrefix.includes('/*') && 
                    !linePrefix.toLowerCase().includes('mcp') && 
                    !linePrefix.toLowerCase().includes('tool')) {
                    return undefined;
                }

                const completionItems: vscode.CompletionItem[] = [];
                
                // Add MCP tool suggestions with detailed documentation
                const tools = mcpManager.getTools();
                tools.forEach(tool => {
                    const item = new vscode.CompletionItem(tool.name, vscode.CompletionItemKind.Function);
                    item.detail = `MCP Tool - ${tool.category}`;
                    item.documentation = new vscode.MarkdownString()
                        .appendMarkdown(`## ${tool.name}\n\n`)
                        .appendMarkdown(`${tool.description}\n\n`)
                        .appendMarkdown(`**Category:** ${tool.category}\n\n`)
                        .appendMarkdown(`To use this tool, you can:\n`)
                        .appendMarkdown(`1. Call it directly in your code\n`)
                        .appendMarkdown(`2. Use it through the MCP Manager UI\n`);
                    
                    // Add sortText to ensure MCP tools appear at the top
                    item.sortText = '0' + tool.name;
                    
                    // Add command to show tool details
                    item.command = {
                        command: 'mcpManager.showToolDetails',
                        title: 'Show Tool Details',
                        arguments: [tool]
                    };

                    completionItems.push(item);

                    // Add a snippet version of the tool
                    const snippetItem = new vscode.CompletionItem(`${tool.name} (with options)`, vscode.CompletionItemKind.Snippet);
                    snippetItem.detail = `MCP Tool - ${tool.category} (snippet)`;
                    snippetItem.documentation = item.documentation;
                    snippetItem.insertText = new vscode.SnippetString(`MCPTool.${tool.name}({
    \${1:option}: \${2:value}
});`);
                    snippetItem.sortText = '1' + tool.name;
                    completionItems.push(snippetItem);
                });

                return completionItems;
            }
        },
        '.', // Trigger completion when typing a dot
        '@', // Trigger completion when typing an at sign
        '#'  // Trigger completion when typing a hash
    );

    // Register Copilot context provider for MCP tools
    const copilotProvider = vscode.languages.registerInlineCompletionItemProvider(
        { scheme: 'file', pattern: '**/{*.ts,*.js,*.json}' },
        {
            async provideInlineCompletionItems(document, position, context, token) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                
                // Only provide completions in relevant contexts
                if (!linePrefix.toLowerCase().includes('mcp') && 
                    !linePrefix.toLowerCase().includes('tool')) {
                    return;
                }

                const tools = mcpManager.getTools();
                const items = tools.map(tool => {
                    const item = new vscode.InlineCompletionItem(
                        `MCPTool.${tool.name}`,
                        new vscode.Range(position, position)
                    );
                    item.command = {
                        command: 'mcpManager.showToolDetails',
                        title: 'Show Tool Details',
                        arguments: [tool]
                    };
                    return item;
                });

                return { items };
            }
        }
    );

    // Add providers to subscriptions
    context.subscriptions.push(mcpToolsProvider, copilotProvider);

    // Register hover provider for MCP tools
    const mcpHoverProvider = vscode.languages.registerHoverProvider(
        { scheme: 'file', language: '*' },
        {
            provideHover(document: vscode.TextDocument, position: vscode.Position) {
                const range = document.getWordRangeAtPosition(position);
                if (!range) {
                    return;
                }

                const word = document.getText(range);
                const tool = mcpManager.getTools().find(t => t.name.toLowerCase() === word.toLowerCase());
                
                if (tool) {
                    return new vscode.Hover(`${tool.name}: ${tool.description}`);
                }
            }
        }
    );

    // Register command to show MCP Manager
    let disposable = vscode.commands.registerCommand('mcpstore.showManager', () => {
        MCPWebViewPanel.createOrShow(context.extensionUri.fsPath, mcpManager);
    });

    // Add tool providers to subscriptions
    context.subscriptions.push(mcpToolsProvider);
    context.subscriptions.push(mcpHoverProvider);
    context.subscriptions.push(disposable);

    // Register the view containers and views
    const serverTreeDataProvider = mcpManager.getServersProvider();
    const clientTreeDataProvider = mcpManager.getClientsProvider();
    const toolTreeDataProvider = new ToolTreeDataProvider(mcpManager);

    vscode.window.registerTreeDataProvider('mcpServersView', serverTreeDataProvider);
    vscode.window.registerTreeDataProvider('mcpClientsView', clientTreeDataProvider);
    vscode.window.registerTreeDataProvider('mcpToolsView', toolTreeDataProvider);

    // Register commands for tree view items
    vscode.commands.registerCommand('mcpServersView.refresh', () => serverTreeDataProvider.refresh());
    vscode.commands.registerCommand('mcpClientsView.refresh', () => clientTreeDataProvider.refresh());
    
    vscode.commands.registerCommand('mcpServersView.start', (serverId) => {
        mcpManager.startServer(serverId);
    });

    vscode.commands.registerCommand('mcpServersView.stop', (serverId) => {
        mcpManager.stopServer(serverId);
    });

    vscode.commands.registerCommand('mcpClientsView.start', (clientId) => {
        mcpManager.startClient(clientId);
    });

    vscode.commands.registerCommand('mcpClientsView.stop', (clientId) => {
        mcpManager.stopClient(clientId);
    });

    // Register tool detail command
    context.subscriptions.push(
        vscode.commands.registerCommand('mcpManager.showToolDetails', (tool) => {
            const panel = vscode.window.createWebviewPanel(
                'mcpToolDetails',
                `MCP Tool: ${tool.name}`,
                vscode.ViewColumn.One,
                {
                    enableScripts: true
                }
            );

            panel.webview.html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            padding: 20px;
                            color: var(--vscode-foreground);
                            font-family: var(--vscode-font-family);
                        }
                        .tool-icon {
                            font-size: 24px;
                            margin-bottom: 10px;
                        }
                        .tool-description {
                            margin: 10px 0;
                            line-height: 1.4;
                        }
                    </style>
                </head>
                <body>
                    <div class="tool-icon">$(${tool.icon || 'tools'})</div>
                    <h2>${tool.name}</h2>
                    <div class="tool-description">${tool.description}</div>
                    <p>Category: ${tool.category}</p>
                </body>
                </html>
            `;
        })
    );

    // Register configuration change listener for MCP settings
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('mcp')) {
                const mcpConfig = vscode.workspace.getConfiguration('mcp');
                const servers = mcpConfig.get('servers') as Record<string, any>;
                
                if (servers) {
                    Object.entries(servers).forEach(([serverId, config]) => {
                        // Register each MCP server with Copilot
                        const serverItem = new vscode.CompletionItem(serverId, vscode.CompletionItemKind.Module);
                        serverItem.detail = `MCP Server - ${config.command}`;
                        serverItem.documentation = new vscode.MarkdownString()
                            .appendMarkdown(`## ${serverId}\n\n`)
                            .appendMarkdown(`Command: ${config.command}\n`)
                            .appendMarkdown(`Args: ${config.args ? config.args.join(' ') : 'none'}\n`);
                        
                        // Use kind instead of iconPath for CompletionItem
                        // Set a distinctive icon kind
                        serverItem.kind = vscode.CompletionItemKind.Module;
                        
                        // Add custom label format to make it stand out
                        serverItem.label = {
                            label: serverId,
                            description: "MCP Server"
                        };
                        
                        // Register the completion item
                        const completionDisposable = vscode.languages.registerCompletionItemProvider(
                            { scheme: 'file' },
                            {
                                provideCompletionItems(document, position) {
                                    const linePrefix = document.lineAt(position).text.substr(0, position.character);
                                    if (linePrefix.includes('mcp') || linePrefix.includes('MCP')) {
                                        return [serverItem];
                                    }
                                    return undefined;
                                }
                            },
                            '.',
                            '@'
                        );
                        
                        context.subscriptions.push(completionDisposable);
                    });
                }
            }
        })
    );

    // Register MCP status icon in Copilot
    const mcpStatusProvider = vscode.languages.registerInlineCompletionItemProvider(
        { scheme: 'file' },
        {
            async provideInlineCompletionItems(document, position) {
                const mcpConfig = vscode.workspace.getConfiguration('mcp');
                const servers = mcpConfig.get('servers') as Record<string, any>;
                
                if (!servers) {
                    return;
                }

                const items = Object.keys(servers).map(serverId => {
                    return new vscode.InlineCompletionItem(
                        serverId,
                        new vscode.Range(position, position)
                    );
                });

                return { items };
            }
        }
    );

    context.subscriptions.push(mcpStatusProvider);
}

export function deactivate() {
    // Clean up resources when extension is deactivated
}