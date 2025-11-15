import React from 'react';
import { KnowledgeBase } from '../types';
// FIX: Replaced non-existent BrainIcon with SparklesIcon.
import { SparklesIcon, PlusIcon, RefreshIcon } from './icons/Icons';

interface TopBarProps {
    knowledgeBases: KnowledgeBase[];
    selectedKbId: string;
    onSelectKb: (id: string) => void;
    onCreateKb: () => void;
    onRefresh: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ knowledgeBases, selectedKbId, onSelectKb, onCreateKb, onRefresh }) => {
    return (
        <header className="bg-slate-900/50 backdrop-blur-lg border-b border-slate-700 px-5 py-3 flex justify-between items-center shadow-lg shrink-0 z-20">
            <div className="flex items-center gap-3">
                <div className="relative">
                    {/* FIX: Replaced non-existent BrainIcon with SparklesIcon. */}
                    <SparklesIcon className="h-7 w-7 text-cyan-400" />
                    <div className="absolute top-0 left-0 h-full w-full bg-cyan-400/50 blur-md animate-pulse"></div>
                </div>
                <h1 className="text-xl font-bold text-slate-100">Knowledge Assistant</h1>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <label htmlFor="kb-select" className="text-sm font-semibold text-slate-400 whitespace-nowrap">
                        Knowledge Base:
                    </label>
                    <select
                        id="kb-select"
                        value={selectedKbId}
                        onChange={(e) => onSelectKb(e.target.value)}
                        className="min-w-[280px] bg-slate-800/60 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2"
                    >
                        <option value="">Select a KB...</option>
                        {knowledgeBases.map((kb) => (
                            <option key={kb.id} value={kb.id}>{kb.name}</option>
                        ))}
                    </select>
                </div>
                
                <button
                    onClick={onRefresh}
                    className="p-2 rounded-md border border-slate-700 bg-slate-800/60 text-slate-400 hover:bg-slate-700/80 hover:text-slate-200 transition-colors"
                    title="Refresh KB Info"
                >
                    <RefreshIcon className="h-5 w-5" />
                </button>

                <button
                    onClick={onCreateKb}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 transition-colors shadow-md"
                >
                    <PlusIcon className="h-5 w-5" />
                    Create KB
                </button>
            </div>
        </header>
    );
};
