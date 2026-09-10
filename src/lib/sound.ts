/**
 * Kichik WebAudio sintezatori — audio fayllarsiz.
 * Birinchi bosishda kontekst ochiladi (brauzer talabi).
 */
class SoundKit {
  private ctx: AudioContext | null = null;
  enabled = true;

  private ensure(): AudioContext | null {
    if (!this.enabled || typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private tone(freq: number, start: number, duration: number, gain = 0.14, type: OscillatorType = "triangle") {
    const ctx = this.ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
    vol.gain.setValueAtTime(0.0001, ctx.currentTime + start);
    vol.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + start + 0.015);
    vol.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
    osc.connect(vol).connect(ctx.destination);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + duration + 0.02);
  }

  unlock() {
    this.ensure();
  }

  key() {
    this.tone(520, 0, 0.05, 0.05, "square");
  }

  correct() {
    this.tone(660, 0, 0.12, 0.12);
    this.tone(880, 0.09, 0.16, 0.12);
    this.tone(1180, 0.18, 0.2, 0.09);
  }

  wrong() {
    this.tone(190, 0, 0.18, 0.14, "sawtooth");
    this.tone(140, 0.14, 0.24, 0.12, "sawtooth");
  }

  tick() {
    this.tone(880, 0, 0.05, 0.06, "sine");
  }

  win() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, i * 0.11, 0.3, 0.13));
    this.tone(1318, 0.46, 0.5, 0.1);
  }
}

export const sfx = new SoundKit();
