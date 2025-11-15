
import React from 'react';
import { SparklesIcon } from './icons/Icons';

export const LeftSidebar: React.FC = () => {
    return (
        <aside className="w-[300px] bg-gray-50 border-r border-gray-200 p-4 flex flex-col shrink-0">
            <div className="flex items-center gap-3 mb-8">
                 <div className="relative">
                    <SparklesIcon className="h-8 w-8 text-blue-600" />
                    <div className="absolute top-0 left-0 h-full w-full bg-blue-500/30 blur-md animate-pulse"></div>
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Knowledge Assistant</h1>
            </div>
        </aside>
    );
};
