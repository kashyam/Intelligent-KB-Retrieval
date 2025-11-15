
import React, { useState, useRef, ChangeEvent } from 'react';
import { KnowledgeBase, Settings } from '../types';
import { UploadIcon, DocumentTextIcon, FolderIcon, CalendarIcon, HashtagIcon, VectorIcon, PlusIcon, RefreshIcon, TrashIcon } from './icons/Icons';

interface SidebarProps {
    knowledgeBases: KnowledgeBase[];
    selectedKb: KnowledgeBase | null;
    onSelectKb: (id: string) => void;
    onCreateKb: () => void;
    onDeleteKb: (id: string) => void;
    onRefresh: () => void;
    onUpload: (file: File) => void;
    uploadStatus: string;
    settings: Settings;
    onSettingsChange: (newSettings: Settings) => void;
}

const SidebarSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h3>
        {children}
    </div>
);

const SettingSlider: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
    displayValue?: string;
    helpText: string;
}> = ({ label, value, min, max, step, onChange, displayValue, helpText }) => (
    <div>
        <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <span className="font-semibold text-blue-600 w-12 text-center text-sm">{displayValue || value}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <p className="text-xs text-gray-500 mt-1">{helpText}</p>
    </div>
);


export const Sidebar: React.FC<SidebarProps> = ({ 
    knowledgeBases, 
    selectedKb, 
    onSelectKb, 
    onCreateKb,
    onDeleteKb,
    onRefresh, 
    onUpload, 
    uploadStatus, 
    settings, 
    onSettingsChange 
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleUploadClick = () => {
        if (!selectedFile) return;
        if (!selectedKb) return;
        onUpload(selectedFile);
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    
    const handleDeleteClick = () => {
        if (!selectedKb) return;
        
        if (window.confirm(`Are you sure you want to delete the knowledge base "${selectedKb.name}"? This action cannot be undone.`)) {
            onDeleteKb(selectedKb.id);
        }
    };

    const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
        let colors = "bg-blue-100 border-blue-400 text-blue-700";
        if (status.includes("✅")) {
            colors = "bg-green-100 border-green-400 text-green-700";
        } else if (status.includes("❌")) {
            colors = "bg-red-100 border-red-400 text-red-700";
        }
        return (
             <div className={`p-2 rounded-md border-l-4 text-sm font-medium ${colors} transition-all duration-300`}>
                {status}
            </div>
        )
    };

    return (
        <aside className="h-full overflow-y-auto p-6 flex flex-col">
             <h2 className="text-lg font-semibold text-gray-800 mb-6">Run settings</h2>

            <SidebarSection title="Knowledge Base">
                 <div className="space-y-3 mb-4 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                        <select
                            id="kb-select"
                            value={selectedKb?.id || ''}
                            onChange={(e) => onSelectKb(e.target.value)}
                            className="bg-white border border-gray-300 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        >
                            <option value="">Select a KB...</option>
                            {knowledgeBases.map((kb) => (
                                <option key={kb.id} value={kb.id}>{kb.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={onRefresh}
                            className="p-2.5 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 transition-colors"
                            title="Refresh KB list"
                        >
                            <RefreshIcon className="h-5 w-5" />
                        </button>
                    </div>
                    <button
                        onClick={onCreateKb}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Create KB
                    </button>
                </div>
                {selectedKb ? (
                     <div className="space-y-2 text-sm text-gray-600 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <FolderIcon className="h-5 w-5 text-blue-600"/>
                                <span className="font-semibold text-gray-800 text-base">{selectedKb.name}</span>
                            </div>
                           <button 
                                onClick={handleDeleteClick}
                                className="p-1.5 rounded-md text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                                title={`Delete ${selectedKb.name}`}
                           >
                                <TrashIcon className="h-4 w-4" />
                           </button>
                        </div>
                        <hr className="border-gray-200 my-2"/>
                        <div className="flex justify-between"><span className="flex items-center gap-2"><DocumentTextIcon className="h-4 w-4"/>Files</span> <strong className="text-gray-700">{selectedKb.files.length}</strong></div>
                        <div className="flex justify-between"><span className="flex items-center gap-2"><HashtagIcon className="h-4 w-4"/>Chunks</span> <strong className="text-gray-700">{selectedKb.chunkCount}</strong></div>
                        <div className="flex justify-between"><span className="flex items-center gap-2"><VectorIcon className="h-4 w-4"/>Vectors</span> <strong className="text-gray-700">{selectedKb.vectorCount}</strong></div>
                        <div className="flex justify-between"><span className="flex items-center gap-2"><CalendarIcon className="h-4 w-4"/>Created</span> <strong className="text-gray-700">{new Date(selectedKb.createdAt).toLocaleDateString()}</strong></div>
                    </div>
                ) : (
                    <div className="bg-gray-100 border-l-4 border-gray-300 p-3 rounded-r-md text-sm text-gray-600">
                        <strong>No KB selected.</strong>
                        <p>Select or create one from the controls above.</p>
                    </div>
                )}
            </SidebarSection>
            
            <hr className="border-gray-200 my-2"/>
            
            <SidebarSection title="Upload PDF">
                 <div className="space-y-4 p-3 bg-white rounded-lg border border-gray-200">
                    <input 
                        ref={fileInputRef}
                        className="block w-full text-sm text-gray-600 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 disabled:bg-gray-200 disabled:cursor-not-allowed" 
                        id="file_input" 
                        type="file" 
                        accept=".pdf"
                        onChange={handleFileChange}
                        disabled={!selectedKb}
                    />

                    <button
                        onClick={handleUploadClick}
                        disabled={!selectedFile || !selectedKb || uploadStatus.includes('⏳')}
                        className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <UploadIcon className="h-5 w-5" />
                        Upload to KB
                    </button>
                    
                    <StatusBadge status={uploadStatus} />
                </div>
            </SidebarSection>
            
             <hr className="border-gray-200 my-2"/>

            <SidebarSection title="Model Parameters">
                <div className="space-y-6 p-3 bg-white rounded-lg border border-gray-200">
                    <SettingSlider
                        label="Chunks to retrieve (Top K)"
                        value={settings.topK}
                        min={1} max={10} step={1}
                        onChange={(v) => onSettingsChange({ ...settings, topK: v })}
                        helpText="Number of document chunks to use as context for the answer."
                    />
                     <SettingSlider
                        label="Temperature"
                        value={settings.temperature}
                        min={0} max={2} step={0.1}
                        displayValue={settings.temperature.toFixed(1)}
                        onChange={(v) => onSettingsChange({ ...settings, temperature: v })}
                        helpText="Controls randomness. Lower is more deterministic, higher is more creative."
                    />
                     <SettingSlider
                        label="Max Response Tokens"
                        value={settings.maxTokens}
                        min={100} max={4000} step={100}
                        onChange={(v) => onSettingsChange({ ...settings, maxTokens: v })}
                        helpText="Maximum length of the generated response."
                    />
                </div>
            </SidebarSection>
        </aside>
    );
};