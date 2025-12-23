
// Advanced Synth Service using Web Audio API

const getAudioContext = () => {
    if (typeof window === 'undefined') return null;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    return new Ctx();
};

let audioCtx: AudioContext | null = null;

const ensureContext = () => {
    if (!audioCtx) audioCtx = getAudioContext();
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
};

// --- Helper Synthesis Functions ---

// Creates noise buffer (White, Pink-ish)
const createNoiseBuffer = (ctx: AudioContext) => {
    const bufferSize = ctx.sampleRate * 2; // 2 seconds buffer
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
};

// Generic ADSR Envelope Tone
const playTone = (
    freq: number, 
    type: OscillatorType, 
    duration: number, 
    vol: number = 0.1, 
    detune: number = 0
) => {
    const ctx = ensureContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.05); // Attack
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration); // Decay

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
};

// Noise Burst (Wind, Fire, Explosion)
const playNoiseBurst = (
    duration: number, 
    filterType: BiquadFilterType, 
    startFreq: number, 
    endFreq: number, 
    vol: number = 0.2
) => {
    const ctx = ensureContext();
    if (!ctx) return;

    const buffer = createNoiseBuffer(ctx);
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(startFreq, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
};

// Frequency Sweep (Lasers, Magic)
const playSweep = (
    startFreq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType = 'sine',
    vol: number = 0.1
) => {
    const ctx = ensureContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);

    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
};

// --- ELEMENTAL SFX DEFINITIONS ---

export const playSfx = (type: 'attack' | 'hit' | 'heal' | 'victory' | 'defeat' | 'ui' | 'revive', element: string = 'Physical') => {
    const ctx = ensureContext();
    if (!ctx) return;

    switch(type) {
        case 'attack':
            // VISUALIZE THE ELEMENT THROUGH SOUND
            switch(element) {
                case 'Physical':
                    // Swoosh / Metal scrape
                    playNoiseBurst(0.15, 'highpass', 600, 2000, 0.3);
                    playSweep(200, 50, 0.1, 'sawtooth', 0.1);
                    break;
                case 'Fire':
                    // Crackle & Roar
                    playNoiseBurst(0.6, 'lowpass', 400, 100, 0.4); // Rumble
                    playNoiseBurst(0.3, 'highpass', 1000, 3000, 0.2); // Crackle
                    break;
                case 'Water':
                    // Bubble / Splash
                    playSweep(400, 800, 0.2, 'sine', 0.2);
                    playNoiseBurst(0.4, 'lowpass', 800, 200, 0.2);
                    break;
                case 'Earth':
                    // Deep Thud / Rumble
                    playNoiseBurst(0.5, 'lowpass', 150, 50, 0.6);
                    playTone(60, 'square', 0.3, 0.2);
                    break;
                case 'Air':
                    // Wind Sweep
                    playNoiseBurst(0.5, 'bandpass', 400, 1200, 0.2);
                    break;
                case 'Lightning':
                    // Zap / Static
                    playTone(600, 'sawtooth', 0.1, 0.1);
                    playSweep(1500, 100, 0.2, 'sawtooth', 0.15);
                    break;
                case 'Ice':
                    // Chime / Shatter
                    playTone(1200, 'sine', 0.3, 0.1);
                    playTone(1800, 'triangle', 0.1, 0.1);
                    playNoiseBurst(0.2, 'highpass', 2000, 4000, 0.1);
                    break;
                case 'Light':
                    // Holy Chord / Laser
                    playTone(440, 'sine', 0.5, 0.1); // A4
                    playTone(554, 'sine', 0.5, 0.1); // C#5
                    playTone(659, 'sine', 0.5, 0.1); // E5
                    playSweep(800, 1200, 0.3, 'sine', 0.1);
                    break;
                case 'Dark':
                    // Dissonant / Void
                    playTone(100, 'sawtooth', 0.6, 0.2);
                    playTone(145, 'sawtooth', 0.6, 0.1, 10); // Detuned tritone-ish
                    playSweep(200, 50, 0.5, 'square', 0.1);
                    break;
                default:
                    playNoiseBurst(0.1, 'allpass', 1000, 1000, 0.2);
            }
            break;

        case 'hit':
            // Impact sound based on element
            if (element === 'Earth' || element === 'Physical') {
                playNoiseBurst(0.1, 'lowpass', 300, 50, 0.5); // Thud
            } else if (element === 'Lightning' || element === 'Fire') {
                playNoiseBurst(0.1, 'highpass', 500, 1000, 0.2); // Sizzle
            } else {
                playNoiseBurst(0.1, 'bandpass', 200, 800, 0.3); // Generic hit
            }
            break;

        case 'heal':
            // Rising magical chime
            playTone(400, 'sine', 0.5, 0.1);
            setTimeout(() => playTone(500, 'sine', 0.5, 0.1), 100);
            setTimeout(() => playTone(600, 'sine', 0.5, 0.1), 200);
            break;

        case 'victory':
            // Major Arpeggio
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                setTimeout(() => playTone(freq, 'triangle', 0.4, 0.2), i * 100);
            });
            break;

        case 'defeat':
            // Descending Minor
            [440, 415, 392, 349].forEach((freq, i) => {
                setTimeout(() => playTone(freq, 'sawtooth', 0.5, 0.2), i * 150);
            });
            break;

        case 'ui':
            // Click
            playTone(1200, 'sine', 0.03, 0.05);
            break;

        case 'revive':
            // Angelic rise
            playSweep(220, 880, 1.0, 'triangle', 0.2);
            playTone(440, 'sine', 1.0, 0.1);
            break;
    }
};
