
export interface KnowledgeBase {
    id: string;
    name: string;
    files: string[];
    chunkCount: number;
    vectorCount: number;
    createdAt: string;
}

export interface Message {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    responseTime?: number; // In seconds
    citations?: Citation[];
}

export interface Citation {
    fileName: string;
    chunk: number;
    preview: string;
    content: string; // The full content of the chunk
}

export interface Settings {
    topK: number;
    temperature: number;
    maxTokens: number;
}