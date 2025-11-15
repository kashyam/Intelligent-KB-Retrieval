
import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatSection } from './components/ChatSection';
import { CreateIndexModal } from './components/CreateIndexModal';
import { Notification } from './components/Notification';
import { KnowledgeBase, Message, Settings } from './types';
import * as apiService from './services/apiService';
import { SparklesIcon, LogoutIcon } from './components/icons/Icons';
import { LoginPage } from './components/LoginPage';

const INITIAL_MESSAGE: Message = {
    id: Date.now(),
    role: 'assistant',
    content: "Welcome! I'm your Knowledge Assistant. Please select a knowledge base from the right panel to get started, or create a new one.",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
    const [selectedKb, setSelectedKb] = useState<KnowledgeBase | null>(null);
    const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [uploadStatus, setUploadStatus] = useState("Ready");
    const [settings, setSettings] = useState<Settings>({
        topK: 3,
        temperature: 0.7,
        maxTokens: 1024,
    });
    const [error, setError] = useState<string | null>(null);
    
    const handleLogin = () => {
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setSelectedKb(null);
        setMessages([INITIAL_MESSAGE]);
    };

    const fetchKnowledgeBases = useCallback(async () => {
        setError(null);
        try {
            const kbs = await apiService.getKnowledgeBases();
            setKnowledgeBases(kbs);
        } catch (error) {
            console.error("Failed to fetch knowledge bases:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown network error occurred.";
            setError(`Failed to fetch knowledge bases. Please ensure the backend server is running and accessible. \n\nDetails: ${errorMessage}`);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchKnowledgeBases();
        }
    }, [fetchKnowledgeBases, isAuthenticated]);

    const handleSelectKb = useCallback(async (kbId: string) => {
        if (!kbId) {
            setSelectedKb(null);
            setMessages([INITIAL_MESSAGE]);
            return;
        }
        try {
            const kb = await apiService.getKnowledgeBase(kbId);
            setSelectedKb(kb);
            setMessages([{
                id: Date.now(),
                role: 'assistant',
                content: `Knowledge base '${kb.name}' is loaded. How can I help you?`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }]);
        } catch (error) {
            console.error(`Failed to fetch details for KB ${kbId}:`, error);
            setSelectedKb(null);
            setMessages([INITIAL_MESSAGE]);
        }
    }, []);

    const handleCreateKb = useCallback(async (name: string): Promise<{ success: boolean, message: string }> => {
        if (!name.trim()) {
            return { success: false, message: `❌ KB name cannot be empty` };
        }
        try {
            const newKb = await apiService.createKnowledgeBase(name);
            await fetchKnowledgeBases();
            handleSelectKb(newKb.id);
            setCreateModalOpen(false);
            return { success: true, message: `✅ KB '${name}' created!` };
        } catch (error) {
            console.error("Failed to create KB:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            return { success: false, message: `❌ ${errorMessage}` };
        }
    }, [fetchKnowledgeBases, handleSelectKb]);

    const handleDeleteKb = useCallback(async (kbId: string) => {
        setError(null);
        try {
            await apiService.deleteKnowledgeBase(kbId);
            
            if (selectedKb?.id === kbId) {
                setSelectedKb(null);
                setMessages([INITIAL_MESSAGE]);
            }
            
            await fetchKnowledgeBases();

        } catch (error) {
            console.error(`Failed to delete KB ${kbId}:`, error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while deleting the KB.";
            setError(errorMessage);
        }
    }, [fetchKnowledgeBases, selectedKb]);

    const handleUpload = useCallback(async (file: File): Promise<void> => {
        if (!selectedKb) {
            setUploadStatus("❌ Please select a knowledge base first.");
            return;
        }
        
        const kbId = selectedKb.id;
        setUploadStatus(`⏳ Processing '${file.name}' for '${selectedKb.name}'...`);
        
        try {
            const updatedKb = await apiService.uploadFile(kbId, file);
            
            setKnowledgeBases(prevKbs => prevKbs.map(kb => kb.id === kbId ? updatedKb : kb));
            setSelectedKb(updatedKb);
            
            setUploadStatus(`✅ '${file.name}' uploaded successfully!`);
        } catch(error) {
            console.error("File upload failed:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setUploadStatus(`❌ Error uploading '${file.name}': ${errorMessage}`);
        } finally {
            setTimeout(() => setUploadStatus("Ready"), 5000);
        }
    }, [selectedKb]);

    const handleSendMessage = async (text: string) => {
        if (isGenerating || !text.trim() || !selectedKb) {
             if(!selectedKb) {
                const errorMsg: Message = { id: Date.now() + 1, role: 'assistant', content: "❌ No knowledge base loaded. Please select one first.", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
                setMessages(prev => [...prev, errorMsg]);
             }
             return;
        }

        const userMessage: Message = { id: Date.now(), role: 'user', content: text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setMessages(prev => [...prev, userMessage]);
        setIsGenerating(true);
        const startTime = performance.now();

        try {
            const response = await apiService.sendMessage(selectedKb.id, text, settings);
            const endTime = performance.now();
            const responseTime = (endTime - startTime) / 1000;
            
            const assistantMessage: Message = { 
                id: Date.now() + 1, 
                role: 'assistant', 
                content: response.answer,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                responseTime: parseFloat(responseTime.toFixed(1)),
                citations: response.citations
            };
            setMessages(prev => [...prev, assistantMessage]);

        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessageContent = error instanceof Error ? error.message : "Sorry, I encountered an error processing your request.";
            const errorMessage: Message = { id: Date.now() + 1, role: 'assistant', content: errorMessageContent, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleRefresh = async () => {
        await fetchKnowledgeBases();
        if (selectedKb) {
            await handleSelectKb(selectedKb.id);
        }
    };

    const handleClearChat = useCallback(() => {
        if (selectedKb) {
            setMessages([{
                id: Date.now(),
                role: 'assistant',
                content: `Knowledge base '${selectedKb.name}' is loaded. How can I help you?`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }]);
        } else {
            setMessages([INITIAL_MESSAGE]);
        }
    }, [selectedKb]);
    
    if (!isAuthenticated) {
        return <LoginPage onLogin={handleLogin} />;
    }

    return (
        <div className="h-screen w-screen flex flex-col font-sans overflow-hidden bg-white text-gray-800">
            {error && <Notification message={error} onClose={() => setError(null)} />}
            
            <header className="flex items-center justify-between gap-3 p-4 border-b border-gray-200 bg-white shrink-0">
                 <div className="flex items-center gap-3">
                    <div className="relative">
                        <SparklesIcon className="h-8 w-8 text-blue-600" />
                        <div className="absolute top-0 left-0 h-full w-full bg-blue-500/30 blur-md animate-pulse"></div>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Knowledge Assistant</h1>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                    title="Logout"
                >
                    <LogoutIcon className="h-4 w-4" />
                    Logout
                </button>
            </header>

            <main className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col">
                    <ChatSection
                        messages={messages}
                        isGenerating={isGenerating}
                        onSendMessage={handleSendMessage}
                        onClearChat={handleClearChat}
                    />
                </div>
                <div className="w-[360px] border-l border-gray-200 bg-gray-50/70 shrink-0">
                    <Sidebar
                        knowledgeBases={knowledgeBases}
                        selectedKb={selectedKb}
                        onSelectKb={handleSelectKb}
                        onCreateKb={() => setCreateModalOpen(true)}
                        onDeleteKb={handleDeleteKb}
                        onRefresh={handleRefresh}
                        onUpload={handleUpload}
                        uploadStatus={uploadStatus}
                        settings={settings}
                        onSettingsChange={setSettings}
                    />
                </div>
            </main>
            <CreateIndexModal
                isOpen={isCreateModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onCreate={handleCreateKb}
            />
        </div>
    );
};

export default App;
