export type MCPServerType = 'process' | 'sse';

export interface MCPServer {
    id: string;
    name: string;
    type: MCPServerType;
    command: string;
    isActive: boolean;
}