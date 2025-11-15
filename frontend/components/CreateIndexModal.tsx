import React, { useState, useEffect } from 'react';
import { PlusIcon, XIcon } from './icons/Icons';

interface CreateIndexModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string) => Promise<{ success: boolean, message: string }>;
}

export const CreateIndexModal: React.FC<CreateIndexModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    
    useEffect(() => {
        if (isOpen) {
            setName('');
            setStatus(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleCreate = async () => {
        if (!name.trim()) {
            setStatus({ type: 'error', message: '❌ Index name cannot be empty' });
            return;
        }
        const result = await onCreate(name.trim());
        setStatus({ type: result.success ? 'success' : 'error', message: result.message });

        if(result.success) {
            setTimeout(() => {
                onClose();
            }, 1000);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Create Knowledge Base</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-100">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">Enter a unique name for your new knowledge base.</p>
                
                <div className="space-y-4">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., product_documentation_q4"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />

                    {status && (
                        <div className={`p-3 rounded-md text-sm ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {status.message}
                        </div>
                    )}
                    
                    <div className="flex justify-end gap-3">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                           <PlusIcon className="h-5 w-5"/> Create KB
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};