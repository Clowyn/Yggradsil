// ============================================================
// Organic Dark Fantasy Audio Synthesizer (Web Audio API)
// Zero-dependency ambient sound effects: parchment rustles,
// antique lock clicks, and stone/relic taps for Grimdark Arcane OS
// ============================================================

let audioCtx: AudioContext | null = null;
let isMuted = false;

// Check localStorage for user preference
try {
  isMuted = localStorage.getItem('yggdrasil_sound_muted') === 'true';
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
  | 'blip'
  | 'ping'
  | 'scan'
  | 'unlock'
  | 'powerup'
  | 'alert';

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
      case 'click': {
        // Metallic snap
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
      case 'powerup': {
        // A minor harmonic chord: A4, C5, E5, A5
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
      case 'alert': {
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
    localStorage.setItem('yggdrasil_sound_muted', String(muted));
  } catch {
    // Ignore
  }
}
