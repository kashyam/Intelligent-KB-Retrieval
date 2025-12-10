

// Converts Float32 audio data (from AudioContext) to Int16 PCM
export function convertFloat32ToInt16(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
        // Clamp the value between -1 and 1
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        // Scale to 16-bit integer range
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
}

// Resamples audio to a target sample rate using linear interpolation
export function resampleAudio(audioBuffer: Float32Array, originalSampleRate: number, targetSampleRate: number): Float32Array {
    if (originalSampleRate === targetSampleRate) return audioBuffer;

    const ratio = originalSampleRate / targetSampleRate;
    const newLength = Math.round(audioBuffer.length / ratio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
        const originalIndex = i * ratio;
        const index1 = Math.floor(originalIndex);
        const index2 = Math.min(index1 + 1, audioBuffer.length - 1);
        const weight = originalIndex - index1;
        
        result[i] = audioBuffer[index1] * (1 - weight) + audioBuffer[index2] * weight;
    }
    return result;
}

// Converts Int16 PCM binary data to an AudioBuffer and plays it
// Updated to accept an optional destination node for visualization
export async function playPcm16Audio(
    int16Data: ArrayBuffer,
    ctx: AudioContext,
    sampleRate: number, // Azure usually sends 24000
    startTime: number,
    destination?: AudioNode
): Promise<{ buffer: AudioBuffer, source: AudioBufferSourceNode, nextStartTime: number }> {
    const int16Array = new Int16Array(int16Data);
    const float32Array = new Float32Array(int16Array.length);
    
    for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
    }

    const buffer = ctx.createBuffer(1, float32Array.length, sampleRate);
    buffer.copyToChannel(float32Array, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    // Connect to custom destination (analyser) if provided, otherwise default to speakers
    if (destination) {
        source.connect(destination);
    } else {
        source.connect(ctx.destination);
    }
    
    // Ensure we don't schedule in the past
    const playTime = Math.max(ctx.currentTime, startTime);
    source.start(playTime);

    return { 
        buffer, 
        source, 
        nextStartTime: playTime + buffer.duration 
    };
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}
