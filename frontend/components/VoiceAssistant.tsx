
import React, { useEffect, useRef, useState } from 'react';
import { KnowledgeBase, Settings } from '../types';
import * as apiService from '../services/apiService';
import { convertFloat32ToInt16, resampleAudio, playPcm16Audio, arrayBufferToBase64, base64ToArrayBuffer } from '../utils/audioUtils';
import { PhoneXIcon, SparklesIcon, UserIcon, DownloadIcon, RefreshIcon, MicIcon, MicOffIcon, HeadphonesIcon } from './icons/Icons';

// --- StreamingText Component (Duplicated for Voice isolation) ---
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
                // Adding 2 chars varies the rhythm slightly making it feel more natural
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

interface VoiceAssistantProps {
    selectedKb?: KnowledgeBase | null;
    settings: Settings;
    username?: string;
}

interface TranscriptItem {
    role: 'user' | 'assistant';
    text: string;
    isPartial?: boolean;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ selectedKb, settings, username }) => {
    const [hasStarted, setHasStarted] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<string | null>(null);
    const [showSummary, setShowSummary] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    
    // Mute State
    const [isMicMuted, setIsMicMuted] = useState(false);
    const isMicMutedRef = useRef(false); // Ref for audio processor access

    // Audio Context Refs
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const audioStreamRef = useRef<MediaStream | null>(null);
    
    // Analyser Refs for Visualization
    const outputAnalyserRef = useRef<AnalyserNode | null>(null);
    
    // Volume Refs
    const inputVolumeRef = useRef<number>(0);
    const outputVolumeRef = useRef<number>(0);
    
    // Playback timing
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    // Visualization Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>(0);
    const containerRef = useRef<HTMLDivElement>(null); // For resizing canvas

    // Helper to scroll transcript
    const transcriptRef = useRef<HTMLDivElement>(null);

    // Config for Azure Realtime
    const AZURE_SAMPLE_RATE = 24000;

    useEffect(() => {
        if (transcriptRef.current) {
            transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
        }
    }, [transcripts]);

    // Handle KB change - reset everything
    useEffect(() => {
        handleResetSession();
        return () => {
            cleanup();
        };
    }, [selectedKb]);

    const handleResetSession = () => {
        cleanup();
        setHasStarted(false);
        setTranscripts([]);
        setSummary(null);
        setShowSummary(false);
        setError(null);
        setIsMicMuted(false);
        isMicMutedRef.current = false;
    };

    // Toggle Mute
    const toggleMute = () => {
        const newState = !isMicMuted;
        setIsMicMuted(newState);
        isMicMutedRef.current = newState;
    };

    // Canvas Visualizer Loop
    useEffect(() => {
        // Only run visualizer if we have started a session
        if (!hasStarted) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx || !containerRef.current) return;

        // Resize handler
        const resizeCanvas = () => {
             if (containerRef.current && canvas) {
                 canvas.width = containerRef.current.clientWidth;
                 canvas.height = containerRef.current.clientHeight;
             }
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        let phase = 0;
        const particles: {x: number, y: number, size: number, speed: number, angle: number, radius: number}[] = [];

        for(let i=0; i<30; i++) {
            particles.push({
                x: 0, y: 0,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 0.02 + 0.01,
                angle: Math.random() * Math.PI * 2,
                radius: 80 + Math.random() * 80
            });
        }

        const animate = () => {
            if (!canvas || !ctx) return;
            
            let currentOutputVol = 0;
            if (outputAnalyserRef.current) {
                const dataArray = new Uint8Array(outputAnalyserRef.current.frequencyBinCount);
                outputAnalyserRef.current.getByteFrequencyData(dataArray);
                const sum = dataArray.reduce((a, b) => a + b, 0);
                currentOutputVol = (sum / dataArray.length) / 255; 
                outputVolumeRef.current = currentOutputVol;
            }

            const totalVolume = Math.max(inputVolumeRef.current, outputVolumeRef.current * 1.5); 

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            const coreRadius = 40 + (totalVolume * 50);
            const glowRadius = 70 + (totalVolume * 100);

            // Light Mode Theme Colors (Blue/Purple)
            let r = 59, g = 130, b = 246; // Blue-500
            if (outputVolumeRef.current > inputVolumeRef.current + 0.05) {
                r = 147; g = 51; b = 234; // Purple-600
            }

            const gradient = ctx.createRadialGradient(centerX, centerY, coreRadius * 0.2, centerX, centerY, glowRadius);
            
            // SIGNIFICANTLY Reduced Opacity
            if (isConnected) {
                gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.2)`);
                gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.05)`);
                gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            } else {
                gradient.addColorStop(0, 'rgba(203, 213, 225, 0.2)'); // Slate-300
                gradient.addColorStop(1, 'rgba(203, 213, 225, 0)');
            }

            ctx.beginPath();
            ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            // Core
            ctx.beginPath();
            ctx.arc(centerX, centerY, coreRadius * 0.5, 0, Math.PI * 2);
            // Reduced core opacity
            ctx.fillStyle = isConnected ? `rgba(${r}, ${g}, ${b}, 0.3)` : 'rgba(203, 213, 225, 0.3)';
            ctx.fill();

            if (isConnected) {
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.2)`;
                particles.forEach(p => {
                    p.angle += p.speed + (totalVolume * 0.05);
                    const r_orbit = p.radius + (Math.sin(phase + p.angle) * 15);
                    const px = centerX + Math.cos(p.angle) * r_orbit;
                    const py = centerY + Math.sin(p.angle) * r_orbit;
                    
                    ctx.beginPath();
                    ctx.arc(px, py, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.1 + totalVolume})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(px, py);
                    ctx.lineTo(px - Math.cos(p.angle) * 15, py - Math.sin(p.angle) * 15);
                    ctx.stroke();
                });

                ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.1)`;
                ctx.lineWidth = 2;
                
                ctx.beginPath();
                ctx.ellipse(centerX, centerY, 100 + totalVolume*20, 30, phase, 0, Math.PI * 2);
                ctx.stroke();

                ctx.beginPath();
                ctx.ellipse(centerX, centerY, 100 + totalVolume*20, 30, phase + Math.PI/2, 0, Math.PI * 2);
                ctx.stroke();
            }

            phase += 0.01;
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
             if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
             window.removeEventListener('resize', resizeCanvas);
        };
    }, [isConnected, hasStarted]);


    const cleanup = () => {
        setIsConnected(false);
        inputVolumeRef.current = 0;
        outputVolumeRef.current = 0;
        
        // Stop Input
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop());
            audioStreamRef.current = null;
        }
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (inputSourceRef.current) {
            inputSourceRef.current.disconnect();
            inputSourceRef.current = null;
        }
        if (inputAudioContextRef.current) {
            inputAudioContextRef.current.close();
            inputAudioContextRef.current = null;
        }

        // Stop Output
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        if (outputAnalyserRef.current) {
            outputAnalyserRef.current.disconnect();
            outputAnalyserRef.current = null;
        }
        if (outputAudioContextRef.current) {
            outputAudioContextRef.current.close();
            outputAudioContextRef.current = null;
        }
        nextStartTimeRef.current = 0;

        // Close WS
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    };

    const startSession = async () => {
        try {
            setError(null);
            setHasStarted(true);
            
            // Explicitly use selectedKb passed from parent. 
            // If null, we default to 'default' inside getVoiceWebSocketUrl (or pass explicit null).
            // NOTE: apiService handles encoding.
            const kbId = selectedKb ? selectedKb.id : null;
            
            console.log("Initiating Voice Session with KB ID:", kbId || 'default');
            const wsUrl = apiService.getVoiceWebSocketUrl(kbId);

            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.binaryType = "arraybuffer";

            ws.onopen = () => {
                console.log('Voice session connected');
                setIsConnected(true);
                const welcomeMsg = selectedKb 
                    ? `Connected to ${selectedKb.name}. I'm listening...`
                    : "Connected to General Chat. I'm listening...";
                setTranscripts([{ role: 'assistant', text: welcomeMsg }]);
            };

            ws.onerror = (e) => {
                console.error("WebSocket error", e);
                setError("Connection error. Ensure backend is running.");
                setIsConnected(false);
            };

            ws.onclose = () => {
                console.log("WebSocket closed");
                setIsConnected(false);
            };

            const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            outputAudioContextRef.current = outputCtx;
            
            if (outputCtx.state === 'suspended') {
                 outputCtx.resume().catch(e => console.warn("AudioContext resume failed:", e));
            }
            
            const outputAnalyser = outputCtx.createAnalyser();
            outputAnalyser.fftSize = 256;
            outputAnalyser.connect(outputCtx.destination);
            outputAnalyserRef.current = outputAnalyser;

            ws.onmessage = async (event) => {
                if (event.data instanceof ArrayBuffer) {
                     if (!outputAudioContextRef.current || !outputAnalyserRef.current) return;
                     const { source, nextStartTime } = await playPcm16Audio(
                         event.data, outputAudioContextRef.current, AZURE_SAMPLE_RATE, nextStartTimeRef.current, outputAnalyserRef.current
                     );
                     nextStartTimeRef.current = nextStartTime;
                     sourcesRef.current.add(source);
                     source.addEventListener('ended', () => sourcesRef.current.delete(source));
                     return;
                }

                try {
                    const msg = JSON.parse(event.data);
                    
                    if (msg.type === 'audio_delta' && msg.payload) {
                        if (!outputAudioContextRef.current || !outputAnalyserRef.current) return;
                        const audioBuffer = base64ToArrayBuffer(msg.payload);
                        const { source, nextStartTime } = await playPcm16Audio(
                             audioBuffer, outputAudioContextRef.current, AZURE_SAMPLE_RATE, nextStartTimeRef.current, outputAnalyserRef.current
                        );
                        nextStartTimeRef.current = nextStartTime;
                        sourcesRef.current.add(source);
                        source.addEventListener('ended', () => sourcesRef.current.delete(source));
                    }
                    else if (msg.type === 'transcript') {
                         setTranscripts(prev => {
                            const last = prev[prev.length - 1];
                            const normalize = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                            
                            const msgText = msg.text || "";
                            
                            // 1. Deduplication (Same text as last message)
                            if (last && last.role === msg.role) {
                                if (normalize(last.text) === normalize(msgText)) return prev;
                            }
                            
                            // 2. Merging (Combine consecutive assistant messages)
                            // If the last message was assistant, and this is assistant, merge them.
                            // This avoids multiple bubbles for a single response.
                            if (last && last.role === 'assistant' && msg.role === 'assistant') {
                                const newPrev = [...prev];
                                newPrev[newPrev.length - 1] = {
                                    ...last,
                                    text: last.text.trim() + " " + msgText.trim()
                                };
                                return newPrev;
                            }

                            return [...prev, { role: msg.role, text: msgText, isPartial: false }];
                         });
                    }
                    else if (msg.type === 'interrupt') {
                        sourcesRef.current.forEach(source => { try { source.stop(); } catch(e) {} });
                        sourcesRef.current.clear();
                        if (outputAudioContextRef.current) nextStartTimeRef.current = outputAudioContextRef.current.currentTime;
                    }
                    else if (msg.type === 'error') {
                        const errorMessage = msg.error?.message || "Unknown server error";
                        setError(`Server Error: ${errorMessage}`);
                    }
                    else if (msg.type === 'response.audio.delta' && msg.delta) {
                         if (!outputAudioContextRef.current || !outputAnalyserRef.current) return;
                         const audioBuffer = base64ToArrayBuffer(msg.delta);
                         const { source, nextStartTime } = await playPcm16Audio(
                             audioBuffer, outputAudioContextRef.current, AZURE_SAMPLE_RATE, nextStartTimeRef.current, outputAnalyserRef.current
                         );
                         nextStartTimeRef.current = nextStartTime;
                         sourcesRef.current.add(source);
                         source.addEventListener('ended', () => sourcesRef.current.delete(source));
                    }
                    else if (msg.type === 'summary') {
                         setSummary(msg.text || msg.content || "");
                    } 
                    
                } catch (e) {
                    // console.log("Received non-JSON message:", event.data);
                }
            };

            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)(); 
            inputAudioContextRef.current = inputCtx;
            if (inputCtx.state === 'suspended') inputCtx.resume().catch(e => console.warn("Input AudioContext resume failed:", e));
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
            audioStreamRef.current = stream;
            
            const source = inputCtx.createMediaStreamSource(stream);
            inputSourceRef.current = source;
            
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            source.connect(processor);
            processor.connect(inputCtx.destination);

            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                
                let sum = 0;
                for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                const rms = Math.sqrt(sum / inputData.length);
                // Even if muted, we can show visualizer if desired, but typically we silence input
                inputVolumeRef.current = isMicMutedRef.current ? 0 : rms * 5; 

                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && !isMicMutedRef.current) {
                    const resampled = resampleAudio(inputData, inputCtx.sampleRate, AZURE_SAMPLE_RATE);
                    const pcmInt16 = convertFloat32ToInt16(resampled);
                    const base64Audio = arrayBufferToBase64(pcmInt16.buffer);
                    wsRef.current.send(JSON.stringify({
                        type: 'input_audio_buffer.append',
                        audio: base64Audio
                    }));
                }
            };

        } catch (e) {
            console.error("Failed to start voice session:", e);
            setError("Could not access microphone or connect to AI service.");
        }
    };

    const handleEndCall = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            // Optional: Send end session message
        }
        cleanup();
        setShowSummary(true);
    };

    const handleDownloadSummary = async () => {
        setIsDownloading(true);
        let md = "# Conversation Transcript\n\n";
        if (summary) {
            md += "## Summary\n" + summary + "\n\n## Detail\n";
        }
        transcripts.forEach(t => {
            const role = t.role === 'user' ? (username || 'User') : "Assistant";
            md += `**${role}:** ${t.text}\n\n`;
        });

        try {
            await apiService.downloadVoiceSummary(md);
        } catch (e) {
            console.error("Download failed", e);
            alert("Failed to download summary.");
        } finally {
            setIsDownloading(false);
        }
    };

    // Summary View
    if (showSummary) {
        return (
            <div className="h-full flex flex-col items-center p-6 animate-[fadeIn_0.3s_ease-out] bg-gray-50 w-full">
                 <div className="w-full h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                        <div className="space-y-3">
                             {transcripts.length > 0 ? transcripts.map((t, i) => (
                                <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`p-4 rounded-xl text-base border max-w-2xl w-fit ${t.role === 'user' ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-200'}`}>
                                        <span className="font-bold text-gray-500 text-xs uppercase mb-1 block">
                                            {t.role === 'user' ? (username || 'User') : 'Assistant'}
                                        </span>
                                        <p className="text-gray-800 leading-relaxed">{t.text}</p>
                                    </div>
                                </div>
                             )) : (
                                <p className="text-gray-500 text-sm text-center mt-10">No conversation recorded.</p>
                             )}
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-3 shrink-0">
                        {/* Close Button to return to Start Screen */}
                        <button 
                            onClick={handleResetSession}
                            className="flex items-center gap-2 px-5 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors shadow-sm"
                        >
                            <RefreshIcon className="h-5 w-5" />
                            Close & Start New
                        </button>

                        <button 
                            onClick={handleDownloadSummary}
                            disabled={transcripts.length === 0 || isDownloading}
                            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <DownloadIcon className="h-5 w-5" />
                            {isDownloading ? 'Downloading...' : 'Download PDF'}
                        </button>
                    </div>
                 </div>
            </div>
        )
    }

    // Start Screen
    if (!hasStarted) {
        return (
             <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50 animate-[fadeIn_0.3s_ease-out]">
                 <div className="text-center space-y-6">
                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <HeadphonesIcon className="h-12 w-12 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">
                        {selectedKb ? `Ready to talk with ${selectedKb.name}` : 'Ready for General Chat'}
                    </h2>
                    <p className="text-gray-600 max-w-md mx-auto">
                        Start a voice conversation to interact with your knowledge base hands-free.
                    </p>
                    <button 
                        onClick={startSession}
                        className="px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-full hover:bg-blue-700 transition-transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto"
                    >
                        <MicIcon className="h-6 w-6" />
                        Start Conversation
                    </button>
                 </div>
             </div>
        );
    }

    // Active Session View
    return (
        <div className="relative h-full w-full flex flex-col items-center justify-center bg-gray-50 overflow-hidden" ref={containerRef}>
            
            {/* Visualizer Background */}
            <div className="absolute inset-0 z-0">
                 <canvas 
                    ref={canvasRef} 
                    className="w-full h-full block"
                />
            </div>

            {/* Status / Error Overlay */}
            {error && (
                <div className="absolute top-6 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg shadow-sm z-20 text-sm font-medium">
                    {error}
                </div>
            )}

            {!isConnected && !error && (
                <div className="absolute top-6 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-2 rounded-lg shadow-sm z-20 text-sm font-medium animate-pulse">
                    Connecting to server...
                </div>
            )}
            
            {/* Mute Indicator Overlay */}
            {isConnected && isMicMuted && (
                <div className="absolute top-20 bg-gray-800/80 text-white px-4 py-1.5 rounded-full shadow-sm z-20 text-xs font-medium backdrop-blur-sm flex items-center gap-2">
                    <MicOffIcon className="h-3 w-3" /> Microphone Muted
                </div>
            )}

            {/* Transcript Overlay - Opaque Bottom for Legibility */}
            <div className="absolute top-0 w-full px-6 pt-6 pb-6 h-full max-h-[70vh] overflow-y-auto no-scrollbar z-10" ref={transcriptRef}>
                <div className="space-y-4 pt-4">
                    {transcripts.map((t, i) => (
                        <div key={i} className={`flex items-start gap-3 w-full ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                             {t.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center mt-1 shrink-0 shadow-sm">
                                    <SparklesIcon className="h-4 w-4 text-blue-600" />
                                </div>
                             )}
                            <div className={`rounded-2xl px-5 py-3 shadow-sm backdrop-blur-sm max-w-2xl w-fit ${
                                t.role === 'user' 
                                    ? 'bg-blue-600/90 text-white' 
                                    : 'bg-white/95 text-gray-800 border border-gray-200'
                            }`}>
                                <StreamingText text={t.text} animate={true} />
                            </div>
                             {t.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center mt-1 shrink-0 shadow-sm">
                                    <UserIcon className="h-4 w-4 text-gray-600" />
                                </div>
                             )}
                        </div>
                    ))}
                    {transcripts.length === 0 && isConnected && (
                        <p className="text-center text-gray-400 italic">Listening... Speak now.</p>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-8 flex items-center gap-6 z-20">
                 <button
                    onClick={toggleMute}
                    className={`p-4 rounded-full transition-all shadow-lg hover:scale-105 ${
                        isMicMuted 
                            ? 'bg-gray-600 text-white hover:bg-gray-700' 
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                    title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
                 >
                    {isMicMuted ? <MicOffIcon className="h-6 w-6" /> : <MicIcon className="h-6 w-6" />}
                 </button>

                 <button 
                    onClick={handleEndCall}
                    className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all hover:scale-105 group"
                    title="End Call"
                 >
                    <PhoneXIcon className="h-6 w-6 group-hover:animate-pulse" />
                </button>
            </div>
            
            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};
