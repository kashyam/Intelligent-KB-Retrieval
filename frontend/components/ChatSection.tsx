
import React, { useState, useRef, useEffect } from 'react';
import { Message, Citation } from '../types';
import { UserIcon, SparklesIcon, SendIcon, DocumentSearchIcon, ClockIcon, TrashIcon } from './icons/Icons';
import { CitationModal } from './CitationModal';

const TypingIndicator: React.FC = () => (
    <div className="flex items-center space-x-1">
        <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></span>
    </div>
);

const MessageBubble: React.FC<{ msg: Message; onViewCitation: (citation: Citation) => void }> = ({ msg, onViewCitation }) => {
    return (
        <div className={`flex items-start gap-4 w-full animate-[fadeIn_0.3s_ease-out] ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && 
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 shadow-sm">
                    <SparklesIcon className="h-5 w-5"/>
                </div>
            }
            <div className={`w-full max-w-2xl`}>
                <div className={`p-4 rounded-xl ${msg.role === 'user' ? 'bg-blue-100 text-gray-800' : 'bg-gray-100 text-gray-800'}`}>
                   <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                <div className="px-2 pt-1.5 flex items-center gap-4 text-xs text-gray-500">
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
}


export const ChatSection: React.FC<ChatSectionProps> = ({ messages, isGenerating, onSendMessage, onClearChat }) => {
    const [input, setInput] = useState('');
    const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);
    
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

    return (
        <div className="h-full flex flex-col overflow-hidden bg-white">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
                <h2 className="text-lg font-semibold text-gray-800">Converse with your knowledge</h2>
                <button
                    onClick={onClearChat}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                    title="Clear chat session"
                >
                    <TrashIcon className="h-4 w-4" />
                    Clear Session
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} onViewCitation={handleViewCitation} />)}

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
                        placeholder="Explain the probability of rolling two dice and getting 7..."
                        className="w-full p-3 pr-14 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 max-h-48 overflow-y-auto bg-white text-gray-800 placeholder-gray-400"
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
            <CitationModal 
                citation={selectedCitation}
                onClose={handleCloseCitationModal}
            />
        </div>
    );
};