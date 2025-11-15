import React from 'react';
import { Citation } from '../types';
import { XIcon, DocumentTextIcon } from './icons/Icons';

interface CitationModalProps {
    citation: Citation | null;
    onClose: () => void;
}

export const CitationModal: React.FC<CitationModalProps> = ({ citation, onClose }) => {
    if (!citation) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
            <div 
                className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl m-4 flex flex-col max-h-[80vh]" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                        Source Chunk Details
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-100">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2">
                    <div className="mb-4">
                        <p className="text-sm text-gray-500 font-medium">Source Document</p>
                        <p className="font-semibold text-gray-800 bg-gray-100 px-2 py-1 rounded-md">{citation.fileName}</p>
                    </div>
                     <div className="mb-4">
                        <p className="text-sm text-gray-500 font-medium">Chunk Number</p>
                        <p className="font-semibold text-gray-800">{citation.chunk}</p>
                    </div>

                    <div>
                         <p className="text-sm text-gray-500 font-medium mb-1">Full Chunk Content</p>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{citation.content}</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 mt-4 border-t border-gray-200">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};