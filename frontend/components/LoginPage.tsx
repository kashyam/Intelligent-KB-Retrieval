
import React, { useState, useEffect } from 'react';

interface LoginPageProps {
    onLogin: (username: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isConfigured, setIsConfigured] = useState(false);

    // Read credentials from environment variables.
    const validUsername = process.env.USERNAME || 'admin';
    const validPassword = process.env.PASSWORD || '!!Passwd1234';
    
    useEffect(() => {
        // Check if credentials are provided in the environment.
        if (validUsername && validPassword) {
            setIsConfigured(true);
        } else {
            setError("Application is not configured with login credentials. Please contact an administrator.");
        }
    }, [validUsername, validPassword]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isConfigured) {
             return; // Don't attempt login if not configured
        }

        if (username === validUsername && password === validPassword) {
            setError('');
            onLogin(username);
        } else {
            setError('Invalid username or password');
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800">Knowledge Assistant</h1>
                    <p className="mt-2 text-gray-600">Please sign in to continue</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label htmlFor="username" className="sr-only">Username</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-200 disabled:cursor-not-allowed"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={!isConfigured}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-200 disabled:cursor-not-allowed"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={!isConfigured}
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-center text-red-600">{error}</p>
                    )}

                    <div>
                        <button
                            type="submit"
                            className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md group hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            disabled={!isConfigured}
                        >
                            Sign in
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
