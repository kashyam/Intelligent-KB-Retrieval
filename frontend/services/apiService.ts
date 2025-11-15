import { KnowledgeBase, Settings, Citation } from '../types';

// IMPORTANT: For local development, use your local backend server's URL.
const API_BASE_URL = 'http://localhost:8000/rag/api'; // Use this for local development

// Helper to transform API's snake_case KB to our camelCase KnowledgeBase
const transformApiKbToState = (apiKb: any): KnowledgeBase => {
    return {
        id: apiKb.name, // The API uses name as the identifier
        name: apiKb.name,
        files: apiKb.files || [],
        chunkCount: apiKb.chunk_count || 0,
        vectorCount: apiKb.ntotal || 0,
        createdAt: apiKb.created_at || new Date().toISOString(),
    };
};

// Helper to transform API's snake_case citation to our camelCase Citation
const transformApiCitationToState = (apiCitation: any): Citation => {
    return {
        fileName: apiCitation.file,
        chunk: apiCitation.chunk,
        preview: apiCitation.preview,
        content: apiCitation.content || apiCitation.preview, // Assume backend provides 'content', fallback to preview
    };
};


// A helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'An API error occurred');
    }
    return response.json();
}

export async function getKnowledgeBases(): Promise<KnowledgeBase[]> {
    const response = await fetch(`${API_BASE_URL}/kbs`, {
        headers: {
            'Accept': 'application/json',
        },
    });
    const data = await handleResponse<{ kbs: any[] }>(response);
    return data.kbs.map(transformApiKbToState);
}

export async function getKnowledgeBase(id: string): Promise<KnowledgeBase> {
    const response = await fetch(`${API_BASE_URL}/kbs/${id}`, {
        headers: {
            'Accept': 'application/json',
        },
    });
    const data = await handleResponse<{ kb: any }>(response);
    return transformApiKbToState(data.kb);
}

export async function createKnowledgeBase(name: string): Promise<KnowledgeBase> {
    const response = await fetch(`${API_BASE_URL}/kbs`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({ name }),
    });
    const data = await handleResponse<{ kb: any }>(response);
    return transformApiKbToState(data.kb);
}

export async function deleteKnowledgeBase(kbId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/kbs/${kbId}`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
        },
    });
    return handleResponse<{ message: string }>(response);
}


export async function uploadFile(kbId: string, file: File): Promise<KnowledgeBase> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/kbs/${kbId}/upload`, {
        method: 'POST',
        body: formData,
    });
    const data = await handleResponse<{ kb: any }>(response);
    return transformApiKbToState(data.kb);
}

interface ChatResponse {
    answer: string;
    citations: Citation[];
}

export async function sendMessage(kbId: string, message: string, settings: Settings): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/kbs/${kbId}/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            message: message,
            top_k: settings.topK,
            temperature: settings.temperature,
            max_tokens: settings.maxTokens,
        }),
    });
    const data = await handleResponse<{ answer: string; citations: any[] }>(response);
    return {
        answer: data.answer,
        citations: data.citations.map(transformApiCitationToState),
    };
}
