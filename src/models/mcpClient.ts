export type MCPClientType = 'process' | 'sse';

export interface MCPClient {
    id: string;
    name: string;
    type: MCPClientType;
    command: string;
    isActive: boolean;
}