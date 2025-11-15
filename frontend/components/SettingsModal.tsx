
import React, { useState, useEffect } from 'react';
import { Settings } from '../types';
import { XIcon } from './icons/Icons';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: Settings;
    onSettingsChange: (newSettings: Settings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {
    const [localSettings, setLocalSettings] = useState<Settings>(settings);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSettingsChange(localSettings);
        onClose();
    };

    const handleSliderChange = <K extends keyof Settings,>(key: K, value: number) => {
        setLocalSettings(prev => ({...prev, [key]: value}));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg m-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800">⚙️ Settings</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-100">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <label htmlFor="topK" className="block text-sm font-medium text-slate-700">Chunks to retrieve (Top K)</label>
                        <div className="flex items-center gap-4">
                            <input
                                id="topK"
                                type="range"
                                min="1"
                                max="10"
                                step="1"
                                value={localSettings.topK}
                                onChange={(e) => handleSliderChange('topK', Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="font-semibold text-blue-600 w-8 text-center">{localSettings.topK}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Number of document chunks to use as context for the answer.</p>
                    </div>

                    <div>
                        <label htmlFor="temperature" className="block text-sm font-medium text-slate-700">Temperature</label>
                         <div className="flex items-center gap-4">
                            <input
                                id="temperature"
                                type="range"
                                min="0"
                                max="2"
                                step="0.1"
                                value={localSettings.temperature}
                                onChange={(e) => handleSliderChange('temperature', Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="font-semibold text-blue-600 w-8 text-center">{localSettings.temperature.toFixed(1)}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Controls randomness. Lower is more deterministic, higher is more creative.</p>
                    </div>

                    <div>
                        <label htmlFor="maxTokens" className="block text-sm font-medium text-slate-700">Max Response Tokens</label>
                        <div className="flex items-center gap-4">
                             <input
                                id="maxTokens"
                                type="range"
                                min="100"
                                max="4000"
                                step="100"
                                value={localSettings.maxTokens}
                                onChange={(e) => handleSliderChange('maxTokens', Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="font-semibold text-blue-600 w-12 text-center">{localSettings.maxTokens}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Maximum length of the generated response.</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                        <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors">
                            Save Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
