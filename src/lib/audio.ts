// Web Audio API Synthesizer for RestoFlow Realtime Kitchen & Cashier Alerts

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private repeatIntervalId: any = null;
  private isAlarmPlaying: boolean = false;

  private initContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public enableAudio(): boolean {
    const ctx = this.initContext();
    if (ctx && ctx.state === "running") {
      // Play a short subtle test tone
      this.playTone(880, 0.1, 0.05);
      return true;
    }
    return false;
  }

  public isEnabled(): boolean {
    return !!this.ctx && this.ctx.state === "running";
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopAlarm();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playTone(freq: number, duration: number = 0.25, volume: number = 0.2) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Two-tone prominent restaurant bell chime (e.g. Ding-Dong)
  public playOrderChime() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // First harmonic bell tone: 784 Hz (G5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(783.99, now);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Second harmonic tone: 1046.5 Hz (C6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(1046.50, now + 0.2);
      gain2.gain.setValueAtTime(0.4, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.9);

      // Urgent high chime: 1318.5 Hz (E6)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(1318.51, now + 0.4);
      gain3.gain.setValueAtTime(0.3, now + 0.4);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.4);
      osc3.stop(now + 1.2);
    } catch {
      // AudioContext error handling
    }
  }

  // Repeating alarm for unacknowledged orders
  public startAlarm() {
    if (this.isAlarmPlaying || this.isMuted) return;
    this.isAlarmPlaying = true;
    this.playOrderChime();

    this.repeatIntervalId = setInterval(() => {
      if (this.isAlarmPlaying && !this.isMuted) {
        this.playOrderChime();
      } else {
        this.stopAlarm();
      }
    }, 4000);
  }

  public stopAlarm() {
    this.isAlarmPlaying = false;
    if (this.repeatIntervalId) {
      clearInterval(this.repeatIntervalId);
      this.repeatIntervalId = null;
    }
  }

  public isAlarmActive(): boolean {
    return this.isAlarmPlaying;
  }
}

export const soundEngine = new SoundEngine();
