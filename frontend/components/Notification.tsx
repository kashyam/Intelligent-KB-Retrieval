import React from 'react';
import { XIcon, InformationCircleIcon } from './icons/Icons';

interface NotificationProps {
    message: string;
    onClose: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ message, onClose }) => {
    if (!message) return null;

    return (
        <div className="fixed top-5 right-5 max-w-md w-full bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-lg shadow-lg z-50" role="alert">
            <div className="flex">
                <div className="py-1">
                    <InformationCircleIcon className="h-6 w-6 text-red-500 mr-4"/>
                </div>
                <div className="flex-1">
                    <p className="font-bold">Connection Error</p>
                    <p className="text-sm whitespace-pre-wrap">{message}</p>
                </div>
                <button onClick={onClose} className="ml-2 -mx-1.5 -my-1.5 bg-red-100 text-red-500 rounded-lg focus:ring-2 focus:ring-red-400 p-1.5 hover:bg-red-200 inline-flex h-8 w-8" aria-label="Dismiss">
                    <span className="sr-only">Dismiss</span>
                    <XIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};