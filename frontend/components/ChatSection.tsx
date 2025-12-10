
import React, { useState, useRef, useEffect } from 'react';
import { Message, Citation, KnowledgeBase, Settings } from '../types';
import { UserIcon, SparklesIcon, SendIcon, DocumentSearchIcon, ClockIcon, TrashIcon, HeadphonesIcon, ChatBubbleIcon, DownloadIcon, RefreshIcon } from './icons/Icons';
import { CitationModal } from './CitationModal';
import { VoiceAssistant } from './VoiceAssistant';
import * as apiService from '../services/apiService';

// --- StreamingText Component ---
const StreamingText: React.FC<{ text: string; animate?: boolean; speed?: number }> = ({ text, animate = true, speed = 15 }) => {
    const [displayedText, setDisplayedText] = useState(animate ? '' : text);
    const indexRef = useRef(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        // If animation is disabled, show full text immediately
        if (!animate) {
            setDisplayedText(text);
            indexRef.current = text.length;
            return;
        }

        // If text content changes significantly (reset), restart
        // We detect reset if the new text is shorter than what we've displayed
        if (text.length < indexRef.current) {
            indexRef.current = 0;
            setDisplayedText('');
        }

        // If we've already displayed everything
        if (indexRef.current >= text.length) {
            return;
        }

        // Clear existing interval to avoid stacking
        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            if (indexRef.current < text.length) {
                // Add chunks for a smoother "word-by-word" feel or fast typing
                // Adding 1-3 chars varies the rhythm slightly making it feel more natural
                const chunkJson = text.slice(indexRef.current, indexRef.current + 2); 
                setDisplayedText((prev) => prev + chunkJson);
                indexRef.current += 2;
            } else {
                if (intervalRef.current) clearInterval(intervalRef.current);
            }
        }, speed);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [text, animate, speed]);

    return <span className="whitespace-pre-wrap">{displayedText}</span>;
};


const TypingIndicator: React.FC = () => (
    <div className="flex items-center space-x-1">
        <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></span>
    </div>
);

const MessageBubble: React.FC<{ msg: Message; onViewCitation: (citation: Citation) => void; username?: string; isLast?: boolean }> = ({ msg, onViewCitation, username, isLast = false }) => {
    return (
        <div className={`flex items-start gap-4 w-full animate-[fadeIn_0.3s_ease-out] ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && 
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 shadow-sm">
                    <SparklesIcon className="h-5 w-5"/>
                </div>
            }
            <div className={`w-full max-w-2xl`}>
                <div className={`flex items-center gap-2 mb-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-xs font-semibold text-gray-500 uppercase">
                        {msg.role === 'user' ? (username || 'User') : 'Assistant'}
                    </span>
                </div>
                <div className={`p-4 rounded-xl ${msg.role === 'user' ? 'bg-blue-100 text-gray-800' : 'bg-gray-100 text-gray-800'}`}>
                   {/* Only animate the last message to prevent history re-animation on updates */}
                   <StreamingText text={msg.content} animate={isLast} />
                </div>
                <div className={`px-2 pt-1.5 flex items-center gap-4 text-xs text-gray-500 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                   <span>{msg.timestamp}</span>
                   {msg.role === 'assistant' && msg.responseTime && (
                       <span className="flex items-center gap-1"><ClockIcon className="h-3 w-3" /> {msg.responseTime}s</span>
                   )}
                </div>
                 {msg.citations && msg.citations.length > 0 && (
                     <div className="mt-2 p-3 border-t border-gray-200">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <DocumentSearchIcon className="h-4 w-4" />Sources
                        </h3>
                        <div className="space-y-2">
                            {msg.citations.map((citation, index) => (
                                <div 
                                    key={index} 
                                    className="bg-gray-100 border-l-4 border-gray-300 p-2 rounded-r-md text-xs text-gray-700 cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-colors"
                                    onClick={() => onViewCitation(citation)}
                                    title="Click to view full chunk content"
                                >
                                    <p className="font-semibold">{citation.fileName} | Chunk {citation.chunk}</p>
                                    <p className="italic mt-1">"{citation.preview}"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {msg.role === 'user' && 
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 shadow-sm">
                    <UserIcon className="h-5 w-5"/>
                </div>
            }
        </div>
    );
};


interface ChatSectionProps {
    messages: Message[];
    isGenerating: boolean;
    onSendMessage: (text: string) => void;
    onClearChat: () => void;
    selectedKb?: KnowledgeBase | null;
    settings?: Settings; 
    username?: string;
}


export const ChatSection: React.FC<ChatSectionProps> = ({ messages, isGenerating, onSendMessage, onClearChat, selectedKb, settings = { topK: 3, temperature: 0.7, maxTokens: 1024 }, username }) => {
    const [input, setInput] = useState('');
    const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
    const [viewMode, setViewMode] = useState<'chat' | 'voice'>('chat');
    const [isDownloading, setIsDownloading] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (viewMode === 'chat') {
            scrollToBottom();
        }
    }, [messages, viewMode]);
    
    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
            const scrollHeight = textAreaRef.current.scrollHeight;
            textAreaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [input]);
    
    const handleViewCitation = (citation: Citation) => {
        setSelectedCitation(citation);
    };

    const handleCloseCitationModal = () => {
        setSelectedCitation(null);
    };

    const handleSend = () => {
        if (input.trim()) {
            onSendMessage(input.trim());
            setInput('');
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleDownloadChat = async () => {
        if (messages.length <= 1) return; // Don't download if only welcome message
        setIsDownloading(true);
        let md = "# Chat Transcript\n\n";
        messages.forEach(msg => {
            const role = msg.role === 'user' ? (username || 'User') : "Assistant";
            md += `**${role}:** ${msg.content}\n\n`;
        });

        try {
            await apiService.downloadVoiceSummary(md);
        } catch (e) {
            console.error("Download failed", e);
            alert("Failed to download transcript.");
        } finally {
            setIsDownloading(false);
        }
    };

    const isKbSelected = selectedKb !== null && selectedKb !== undefined && selectedKb.id !== '';

    return (
        <div className="h-full flex flex-col overflow-hidden bg-white relative">
            {/* Header with Tab Switcher */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
                <h2 className="text-lg font-semibold text-gray-800">
                    {selectedKb ? `Interact with: ${selectedKb.name}` : 'General Chat Mode'}
                </h2>
                
                <div className="flex items-center gap-4">
                    {username && (
                         <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                             <UserIcon className="h-4 w-4" />
                             {username}
                         </div>
                    )}
                    
                    {/* View Mode Toggle */}
                    <div className="bg-gray-100 p-1 rounded-lg flex items-center shadow-inner">
                        <button
                            onClick={() => setViewMode('chat')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${
                                viewMode === 'chat' 
                                    ? 'bg-white text-blue-600 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                            }`}
                        >
                            <ChatBubbleIcon className="h-4 w-4" />
                            Chat
                        </button>
                        <button
                            onClick={() => setViewMode('voice')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${
                                viewMode === 'voice' 
                                    ? 'bg-white text-blue-600 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                            }`}
                        >
                            <HeadphonesIcon className="h-4 w-4" />
                            Voice
                        </button>
                    </div>

                    <div className="h-6 w-px bg-gray-200"></div>

                    {viewMode === 'chat' && (
                         <button
                            onClick={handleDownloadChat}
                            disabled={messages.length <= 1 || isDownloading}
                            className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Download Transcript"
                         >
                            <DownloadIcon className="h-5 w-5" />
                         </button>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            {viewMode === 'chat' ? (
                <>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {messages.map((msg, index) => (
                            <MessageBubble 
                                key={msg.id} 
                                msg={msg} 
                                onViewCitation={handleViewCitation} 
                                username={username} 
                                isLast={index === messages.length - 1} // Only animate the newest message
                            />
                        ))}

                        {isGenerating && (
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 shadow-sm"><SparklesIcon className="h-5 w-5"/></div>
                                <div className="max-w-lg p-3 rounded-lg bg-gray-100 text-gray-800">
                                <TypingIndicator />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    
                    <div className="p-4 border-t border-gray-200 bg-white">
                        <div className="relative max-w-3xl mx-auto">
                            <textarea
                                ref={textAreaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={isKbSelected ? "Ask a question about your documents..." : "Ask a general question..."}
                                className="w-full p-3 pr-14 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 max-h-48 overflow-y-auto bg-white text-gray-800 placeholder-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
                                rows={1}
                                disabled={isGenerating}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <button
                                    onClick={handleSend}
                                    disabled={isGenerating || !input.trim()}
                                    className="p-2 text-gray-500 rounded-full hover:bg-gray-100 transition-colors disabled:text-gray-300 disabled:hover:bg-transparent"
                                    title="Send Message"
                                >
                                    <SendIcon className="h-6 w-6"/>
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 w-full relative overflow-hidden">
                    <VoiceAssistant 
                        selectedKb={selectedKb}
                        settings={settings}
                        username={username}
                    />
                </div>
            )}
            
            <CitationModal 
                citation={selectedCitation}
                onClose={handleCloseCitationModal}
            />
        </div>
    );
};
