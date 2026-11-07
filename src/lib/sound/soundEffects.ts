/**
 * VISROSLOT Sound & Alarm Effects Engine
 * Plays crisp, high-clarity notification chimes for customer booking confirmations
 * and business owner new-appointment alerts.
 *
 * Implements a dual-engine architecture:
 * 1. Audio element playback (/sounds/booking-chime.wav)
 * 2. Instant Web Audio API dual-tone synthesis fallback (100% offline & zero-latency)
 */

let globalAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!globalAudioCtx) {
    const AudioCtxClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      globalAudioCtx = new AudioCtxClass();
    }
  }
  if (globalAudioCtx && globalAudioCtx.state === "suspended") {
    globalAudioCtx.resume().catch(() => {});
  }
  return globalAudioCtx;
}

/**
 * Synthesizes a pleasant, uplifting 2-tone chime using Web Audio API.
 * Tone 1: 587.33 Hz (D5)
 * Tone 2: 880.00 Hz (A5)
 */
export function synthesizeChime(volume: number = 0.5): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Master Gain
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, now);
    masterGain.connect(ctx.destination);

    // Tone 1 - D5 (587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Tone 2 - A5 (880 Hz) - starts slightly after Tone 1 for melodic effect
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.4, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.7);
  } catch (err) {
    console.warn("[Web Audio Synthesizer]:", err);
  }
}

/**
 * Plays the official VISROSLOT appointment confirmation chime.
 * Triggers audio + device vibration (if supported on mobile).
 */
export async function playBookingChime(options?: {
  volume?: number;
  vibrate?: boolean;
}): Promise<boolean> {
  const volume = options?.volume ?? 0.7;
  const shouldVibrate = options?.vibrate ?? true;

  // Trigger mobile vibration if enabled
  if (shouldVibrate && typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([200, 100, 200, 100, 400]);
    } catch (e) {
      // Ignore vibration error
    }
  }

  // First try HTML5 Audio
  if (typeof window !== "undefined" && typeof Audio !== "undefined") {
    try {
      const audio = new Audio("/sounds/booking-chime.wav");
      audio.volume = Math.min(1, Math.max(0, volume));
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
        return true;
      }
    } catch (err) {
      // Autoplay or network failure: immediately fallback to Web Audio API
      synthesizeChime(volume);
      return true;
    }
  }

  // Fallback to Web Audio synthesis
  synthesizeChime(volume);
  return true;
}
