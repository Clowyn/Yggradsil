// ============================================================
// Organic Dark Fantasy Audio Synthesizer (Web Audio API)
// Zero-dependency ambient sound effects & multi-layered procedural
// atmosphere soundscape synthesizer for Grimdark Arcane OS
// ============================================================

let audioCtx: AudioContext | null = null;
let isMuted = false;

// Check localStorage for user preference
try {
  if (typeof localStorage !== 'undefined') {
    isMuted = localStorage.getItem('yggdrasil_sound_muted') === 'true';
  }
} catch {
  // Ignore localStorage errors
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export type SoundType =
  | 'paper_flip'
  | 'lock_click'
  | 'stone_tap'
  | 'tome_open'
  | 'click'
  | 'Button_click_sound'
  | 'blip'
  | 'ping'
  | 'scan'
  | 'unlock'
  | 'skill_unlock'
  | 'powerup'
  | 'alert'
  | 'error'
  | 'fire_blast'
  | 'dice_roll'
  | 'sword_hit'
  | 'potion_drink';

export type CanonicalAmbientPreset =
  | 'abyss_winds'
  | 'dungeon_drip'
  | 'tavern_bustle'
  | 'storm_ruins'
  | 'celestial_choir'
  | 'crypt_silence'
  | 'mystic_forest'
  | 'combat_tension';

export interface AmbientPresetProfile {
  key: CanonicalAmbientPreset;
  name_en: string;
  name_tr: string;
  droneFrequencies: number[];
  droneWaveform: OscillatorType;
  noiseFilterType: BiquadFilterType;
  noiseFilterFreq: number;
  noiseFilterQ: number;
  lfoRateHz: number;
  lfoDepthHz: number;
  pulseIntervalMs: number;
  pulseType: 'cavern' | 'drip' | 'hearth' | 'thunder' | 'chime' | 'heartbeat' | 'bird' | 'wardrum';
}

export const AMBIENT_PRESET_PROFILES: Record<CanonicalAmbientPreset, AmbientPresetProfile> = {
  abyss_winds: {
    key: 'abyss_winds',
    name_en: 'Abyssal Winds',
    name_tr: 'Uçurum Rüzgarları',
    droneFrequencies: [55, 82.41],
    droneWaveform: 'sawtooth',
    noiseFilterType: 'bandpass',
    noiseFilterFreq: 240,
    noiseFilterQ: 2.8,
    lfoRateHz: 0.14,
    lfoDepthHz: 130,
    pulseIntervalMs: 4200,
    pulseType: 'cavern',
  },
  dungeon_drip: {
    key: 'dungeon_drip',
    name_en: 'Dank Catacomb',
    name_tr: 'Nemli Mahzen',
    droneFrequencies: [65.41, 98.0],
    droneWaveform: 'sine',
    noiseFilterType: 'lowpass',
    noiseFilterFreq: 310,
    noiseFilterQ: 1.2,
    lfoRateHz: 0.09,
    lfoDepthHz: 60,
    pulseIntervalMs: 2400,
    pulseType: 'drip',
  },
  tavern_bustle: {
    key: 'tavern_bustle',
    name_en: 'Lively Tavern Hearth',
    name_tr: 'Han & Şömine Ateşi',
    droneFrequencies: [146.83, 220.0],
    droneWaveform: 'triangle',
    noiseFilterType: 'lowpass',
    noiseFilterFreq: 420,
    noiseFilterQ: 0.9,
    lfoRateHz: 0.25,
    lfoDepthHz: 90,
    pulseIntervalMs: 1800,
    pulseType: 'hearth',
  },
  storm_ruins: {
    key: 'storm_ruins',
    name_en: 'Thunderous Ruins',
    name_tr: 'Fırtınalı Harabeler',
    droneFrequencies: [61.74, 92.5],
    droneWaveform: 'sawtooth',
    noiseFilterType: 'bandpass',
    noiseFilterFreq: 880,
    noiseFilterQ: 0.75,
    lfoRateHz: 0.22,
    lfoDepthHz: 320,
    pulseIntervalMs: 3800,
    pulseType: 'thunder',
  },
  celestial_choir: {
    key: 'celestial_choir',
    name_en: 'Celestial Choir',
    name_tr: 'Semavi Koro',
    droneFrequencies: [261.63, 329.63, 392.0, 523.25],
    droneWaveform: 'sine',
    noiseFilterType: 'highpass',
    noiseFilterFreq: 1600,
    noiseFilterQ: 1.5,
    lfoRateHz: 0.18,
    lfoDepthHz: 45,
    pulseIntervalMs: 3200,
    pulseType: 'chime',
  },
  crypt_silence: {
    key: 'crypt_silence',
    name_en: 'Crypt Whispers',
    name_tr: 'Mezar Fısıltıları',
    droneFrequencies: [41.2, 43.65],
    droneWaveform: 'sine',
    noiseFilterType: 'bandpass',
    noiseFilterFreq: 1450,
    noiseFilterQ: 4.5,
    lfoRateHz: 0.11,
    lfoDepthHz: 280,
    pulseIntervalMs: 2600,
    pulseType: 'heartbeat',
  },
  mystic_forest: {
    key: 'mystic_forest',
    name_en: 'Mystic Yggdrasil Grove',
    name_tr: 'Mistik Yggdrasil Korusu',
    droneFrequencies: [196.0, 293.66],
    droneWaveform: 'triangle',
    noiseFilterType: 'bandpass',
    noiseFilterFreq: 680,
    noiseFilterQ: 1.8,
    lfoRateHz: 0.16,
    lfoDepthHz: 190,
    pulseIntervalMs: 2900,
    pulseType: 'bird',
  },
  combat_tension: {
    key: 'combat_tension',
    name_en: 'Combat Tension & War Drums',
    name_tr: 'Savaş Gerilimi & Savaş Davulları',
    droneFrequencies: [73.42, 110.0],
    droneWaveform: 'sawtooth',
    noiseFilterType: 'lowpass',
    noiseFilterFreq: 260,
    noiseFilterQ: 2.2,
    lfoRateHz: 0.45,
    lfoDepthHz: 110,
    pulseIntervalMs: 1250,
    pulseType: 'wardrum',
  },
};

const PRESET_ALIASES: Record<string, CanonicalAmbientPreset> = {
  dungeon_drone: 'abyss_winds',
  rain_storm: 'storm_ruins',
  tavern_hearth: 'tavern_bustle',
  crypt_whispers: 'crypt_silence',
};

export function resolveAmbientPreset(preset: string): AmbientPresetProfile {
  const normalized = (preset || '').trim().toLowerCase();
  const canonical =
    (AMBIENT_PRESET_PROFILES[normalized as CanonicalAmbientPreset]
      ? (normalized as CanonicalAmbientPreset)
      : PRESET_ALIASES[normalized]) || 'abyss_winds';
  return AMBIENT_PRESET_PROFILES[canonical];
}

export interface AmbientEngineState {
  isPlaying: boolean;
  activePreset: CanonicalAmbientPreset | null;
  volume: number; // 0..100
  profile: AmbientPresetProfile | null;
}

type AmbientListener = (state: AmbientEngineState) => void;

let ambientState: AmbientEngineState = {
  isPlaying: false,
  activePreset: null,
  volume: 70,
  profile: null,
};

const ambientListeners = new Set<AmbientListener>();

interface ActiveAmbientGraph {
  masterGain: GainNode;
  oscillators: OscillatorNode[];
  noiseSource: AudioBufferSourceNode | null;
  intervalId: ReturnType<typeof setInterval> | null;
}

let activeGraph: ActiveAmbientGraph | null = null;

function notifyAmbientListeners() {
  const snapshot: AmbientEngineState = { ...ambientState };
  ambientListeners.forEach((listener) => listener(snapshot));
}

export function subscribeToAmbientEngine(listener: AmbientListener): () => void {
  ambientListeners.add(listener);
  listener({ ...ambientState });
  return () => {
    ambientListeners.delete(listener);
  };
}

export function getAmbientEngineState(): AmbientEngineState {
  return { ...ambientState };
}

function computeMasterGainValue(volumePercent: number): number {
  if (isMuted) return 0;
  const clamped = Math.max(0, Math.min(100, volumePercent));
  // Max ambient gain is kept comfortable (0.18) so UI SFX and voice remain clear
  return (clamped / 100) * 0.18;
}

function triggerAmbientPulse(ctx: AudioContext, dest: AudioNode, pulseType: AmbientPresetProfile['pulseType']) {
  if (isMuted) return;
  const now = ctx.currentTime;

  try {
    switch (pulseType) {
      case 'drip': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startFreq = 1100 + Math.random() * 500;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 1.65, now + 0.065);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 0.09);
        break;
      }
      case 'hearth': {
        // Warm lute pluck / ember pop
        const notes = [293.66, 329.63, 392.0, 440.0, 523.25];
        const freq = notes[Math.floor(Math.random() * notes.length)];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 0.48);
        break;
      }
      case 'thunder': {
        // Low rolling thunder rumble
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(95, now);
        osc.frequency.exponentialRampToValueAtTime(36, now + 0.9);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 1.0);
        break;
      }
      case 'chime':
      case 'bird': {
        const base = pulseType === 'chime' ? 880 : 1046.5;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(base, now);
        osc.frequency.exponentialRampToValueAtTime(base * 1.25, now + 0.35);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 0.42);
        break;
      }
      case 'heartbeat':
      case 'wardrum':
      case 'cavern': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const peak = pulseType === 'wardrum' ? 92 : 68;
        osc.frequency.setValueAtTime(peak, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.25);
        gain.gain.setValueAtTime(pulseType === 'wardrum' ? 0.28 : 0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }
    }
  } catch {
    // Ignore transient Web Audio errors
  }
}

function teardownActiveGraph() {
  if (!activeGraph) return;
  const graph = activeGraph;
  activeGraph = null;

  if (graph.intervalId) {
    clearInterval(graph.intervalId);
  }
  for (const osc of graph.oscillators) {
    try {
      osc.stop();
      osc.disconnect();
    } catch {
      // Ignore already stopped
    }
  }
  if (graph.noiseSource) {
    try {
      graph.noiseSource.stop();
      graph.noiseSource.disconnect();
    } catch {
      // Ignore
    }
  }
  try {
    graph.masterGain.disconnect();
  } catch {
    // Ignore
  }
}

export function startAmbientSoundscape(preset: string, volumePercent?: number): AmbientEngineState {
  const profile = resolveAmbientPreset(preset);
  const nextVolume =
    typeof volumePercent === 'number'
      ? Math.max(0, Math.min(100, volumePercent))
      : ambientState.volume;

  // Tear down any existing soundscape first
  teardownActiveGraph();

  ambientState = {
    isPlaying: true,
    activePreset: profile.key,
    volume: nextVolume,
    profile,
  };

  const ctx = getAudioContext();
  if (ctx) {
    try {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(computeMasterGainValue(nextVolume), now);
      masterGain.connect(ctx.destination);

      const oscillators: OscillatorNode[] = [];

      // 1. Multi-oscillator harmonic/sub-bass drone layer
      const droneFilter = ctx.createBiquadFilter();
      droneFilter.type = 'lowpass';
      droneFilter.frequency.setValueAtTime(profile.key === 'celestial_choir' ? 1200 : 280, now);

      const droneGain = ctx.createGain();
      droneGain.gain.setValueAtTime(0.35 / Math.max(1, profile.droneFrequencies.length), now);
      droneFilter.connect(droneGain);
      droneGain.connect(masterGain);

      profile.droneFrequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = profile.droneWaveform;
        // Slight organic detune
        osc.frequency.setValueAtTime(freq + (idx % 2 === 0 ? 0.35 : -0.35), now);
        osc.connect(droneFilter);
        osc.start(now);
        oscillators.push(osc);
      });

      // 2. Looping procedural pink/brown noise texture layer with LFO filter sweep
      const bufferDuration = 3.0;
      const bufferSize = Math.floor(ctx.sampleRate * bufferDuration);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.04 * white) / 1.04;
        lastOut = output[i];
        output[i] *= 2.2;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = profile.noiseFilterType;
      noiseFilter.frequency.setValueAtTime(profile.noiseFilterFreq, now);
      noiseFilter.Q.setValueAtTime(profile.noiseFilterQ, now);

      // LFO modulating noise filter cutoff
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(profile.lfoRateHz, now);
      lfoGain.gain.setValueAtTime(profile.lfoDepthHz, now);
      lfo.connect(lfoGain);
      lfoGain.connect(noiseFilter.frequency);
      lfo.start(now);
      oscillators.push(lfo);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.45, now);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noiseSource.start(now);

      // 3. Periodic procedural acoustic events (drips, thunder, lute notes, war drums)
      const intervalId = setInterval(() => {
        triggerAmbientPulse(ctx, masterGain, profile.pulseType);
      }, profile.pulseIntervalMs);

      activeGraph = {
        masterGain,
        oscillators,
        noiseSource,
        intervalId,
      };
    } catch {
      // Degrade gracefully if browser blocks un-interacted AudioContext
    }
  }

  notifyAmbientListeners();
  return { ...ambientState };
}

export function stopAmbientSoundscape(): AmbientEngineState {
  teardownActiveGraph();
  ambientState = {
    ...ambientState,
    isPlaying: false,
  };
  notifyAmbientListeners();
  return { ...ambientState };
}

export function setAmbientVolume(volumePercent: number): AmbientEngineState {
  const clamped = Math.max(0, Math.min(100, volumePercent));
  ambientState = {
    ...ambientState,
    volume: clamped,
  };
  if (activeGraph && audioCtx) {
    try {
      activeGraph.masterGain.gain.setValueAtTime(
        computeMasterGainValue(clamped),
        audioCtx.currentTime
      );
    } catch {
      // Ignore
    }
  }
  notifyAmbientListeners();
  return { ...ambientState };
}

export function playSound(type: SoundType) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  try {
    switch (type) {
      // 1. Parchment rustle / paper flip (Bandpassed pink/white noise envelope)
      case 'paper_flip': {
        const duration = 0.12;
        const bufferSize = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.Q.setValueAtTime(1.5, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        whiteNoise.start(now);
        break;
      }

      // 2. Antique lock / brass latch click (High-Q resonant metallic snap)
      case 'lock_click':
      case 'click':
      case 'Button_click_sound': {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1850, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.035);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2200, now);
        filter.Q.setValueAtTime(6.0, now);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.04);
        break;
      }

      // 3. Heavy stone / carved wood tap (Low-frequency solid impact)
      case 'stone_tap':
      case 'blip': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.07);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }

      // 4. Arcane Tome open / leather binding rustle
      case 'tome_open': {
        const duration = 0.22;
        const bufferSize = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, now);
        filter.frequency.linearRampToValueAtTime(1800, now + 0.15);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
        break;
      }

      // 5. Crystal resonance / chime (ping)
      case 'ping': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1318.51, now); // E6
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.35); // E5

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.36);
        break;
      }

      // 6. Arcane pulse / aura sweep (scan)
      case 'scan': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(440, now + 0.2);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.23);
        break;
      }

      // 7. Ancient Seal Unlocked (Harmonic sacred chord)
      case 'unlock':
      case 'skill_unlock':
      case 'powerup': {
        [440, 523.25, 659.25, 880].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteTime = now + idx * 0.05;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteTime);

          gain.gain.setValueAtTime(0.035, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(noteTime);
          osc.stop(noteTime + 0.26);
        });
        break;
      }

      // 8. Ominous warning bell / ward trigger (alert)
      case 'alert':
      case 'error': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(370, now); // F#4
        osc.frequency.exponentialRampToValueAtTime(185, now + 0.2);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.21);
        break;
      }

      // 9. Fire blast / roaring flames (Explosion roar with noise rumble)
      case 'fire_blast': {
        const duration = 1.2;
        const bufferSize = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, now);
        filter.frequency.linearRampToValueAtTime(120, now + duration);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
        break;
      }

      // 10. Dice Roll / Tumbling click rattle
      case 'dice_roll': {
        const clicks = 5;
        for (let i = 0; i < clicks; i++) {
          const clickTime = now + i * 0.06;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1200 + Math.random() * 600, clickTime);
          osc.frequency.exponentialRampToValueAtTime(200, clickTime + 0.03);

          gain.gain.setValueAtTime(0.04, clickTime);
          gain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.03);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(clickTime);
          osc.stop(clickTime + 0.035);
        }
        break;
      }

      // 11. Sword Hit / Metallic clash
      case 'sword_hit': {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.18);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.Q.setValueAtTime(4.0, now);

        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }

      // 12. Potion Drink / Liquid chime bubble
      case 'potion_drink': {
        [400, 560, 720].forEach((freq, idx) => {
          const t = now + idx * 0.08;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          osc.frequency.linearRampToValueAtTime(freq + 100, t + 0.07);

          gain.gain.setValueAtTime(0.04, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(t);
          osc.stop(t + 0.085);
        });
        break;
      }
    }
  } catch {
    // Non-critical audio error, degrade silently
  }
}

export function isAudioMuted(): boolean {
  return isMuted;
}

export function setAudioMuted(muted: boolean) {
  isMuted = muted;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('yggdrasil_sound_muted', String(muted));
    }
  } catch {
    // Ignore
  }
  if (activeGraph && audioCtx) {
    try {
      activeGraph.masterGain.gain.setValueAtTime(
        computeMasterGainValue(ambientState.volume),
        audioCtx.currentTime
      );
    } catch {
      // Ignore
    }
  }
}
