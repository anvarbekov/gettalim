"use client";

export type TrackId = "off" | "calm" | "energy";

export interface TrackInfo {
  id: TrackId;
  /** i18n kaliti o'rniga to'g'ridan-to'g'ri nom — uch tilda ham bir xil yozilishi mumkin. */
  name: Record<"uz" | "ru" | "en", string>;
  description: Record<"uz" | "ru" | "en", string>;
}

export const TRACKS: TrackInfo[] = [
  {
    id: "calm",
    name: { uz: "Standart kuy", ru: "Стандартная мелодия", en: "Standard theme" },
    description: {
      uz: "Sokin, darsga xalaqit bermaydigan fon kuyi.",
      ru: "Спокойная фоновая мелодия, не мешающая уроку.",
      en: "A calm background theme that stays out of the way.",
    },
  },
  {
    id: "energy",
    name: { uz: "Energiya kuy", ru: "Энергичная мелодия", en: "Energy theme" },
    description: {
      uz: "Musobaqa kayfiyatini oshiradigan jonliroq variant.",
      ru: "Более живой вариант для соревновательного настроя.",
      en: "A livelier track for a competitive mood.",
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Kuylar — nota raqamlari (MIDI) va davomiyligi (bitlarda)           */
/* ------------------------------------------------------------------ */

interface Note {
  /** MIDI nota raqami. null — pauza. */
  n: number | null;
  /** Boshlanish vaqti (bitlarda). */
  t: number;
  /** Davomiyligi (bitlarda). */
  d: number;
  gain?: number;
}

/** Do-mayor pentatonikasi asosidagi sokin arpeggio. */
const CALM: { bpm: number; bars: number; beatsPerBar: number; melody: Note[]; bass: Note[] } = {
  bpm: 74,
  bars: 4,
  beatsPerBar: 4,
  melody: [
    { n: 69, t: 0, d: 1 },
    { n: 72, t: 1, d: 1 },
    { n: 76, t: 2, d: 1.5 },
    { n: 74, t: 3.5, d: 0.5 },
    { n: 72, t: 4, d: 1 },
    { n: 69, t: 5, d: 1 },
    { n: 67, t: 6, d: 2 },
    { n: 65, t: 8, d: 1 },
    { n: 69, t: 9, d: 1 },
    { n: 72, t: 10, d: 1.5 },
    { n: 71, t: 11.5, d: 0.5 },
    { n: 69, t: 12, d: 1.5 },
    { n: 67, t: 13.5, d: 0.5 },
    { n: 65, t: 14, d: 2 },
  ],
  bass: [
    { n: 45, t: 0, d: 2 },
    { n: 45, t: 2, d: 2 },
    { n: 41, t: 4, d: 2 },
    { n: 41, t: 6, d: 2 },
    { n: 43, t: 8, d: 2 },
    { n: 43, t: 10, d: 2 },
    { n: 40, t: 12, d: 2 },
    { n: 40, t: 14, d: 2 },
  ],
};

/** Jonliroq, doira ritmiga yaqin 6/8 hissi. */
const ENERGY: { bpm: number; bars: number; beatsPerBar: number; melody: Note[]; bass: Note[] } = {
  bpm: 116,
  bars: 4,
  beatsPerBar: 4,
  melody: [
    { n: 76, t: 0, d: 0.5 },
    { n: 79, t: 0.5, d: 0.5 },
    { n: 81, t: 1, d: 0.75 },
    { n: 79, t: 1.75, d: 0.25 },
    { n: 76, t: 2, d: 0.5 },
    { n: 74, t: 2.5, d: 0.5 },
    { n: 76, t: 3, d: 1 },
    { n: 74, t: 4, d: 0.5 },
    { n: 76, t: 4.5, d: 0.5 },
    { n: 79, t: 5, d: 0.75 },
    { n: 81, t: 5.75, d: 0.25 },
    { n: 83, t: 6, d: 1 },
    { n: 81, t: 7, d: 1 },
    { n: 79, t: 8, d: 0.5 },
    { n: 76, t: 8.5, d: 0.5 },
    { n: 74, t: 9, d: 0.75 },
    { n: 72, t: 9.75, d: 0.25 },
    { n: 74, t: 10, d: 1 },
    { n: 76, t: 11, d: 1 },
    { n: 79, t: 12, d: 0.5 },
    { n: 81, t: 12.5, d: 0.5 },
    { n: 79, t: 13, d: 1 },
    { n: 76, t: 14, d: 2 },
  ],
  bass: [
    { n: 45, t: 0, d: 1 },
    { n: 45, t: 1.5, d: 0.5 },
    { n: 52, t: 2, d: 1 },
    { n: 45, t: 3.5, d: 0.5 },
    { n: 43, t: 4, d: 1 },
    { n: 43, t: 5.5, d: 0.5 },
    { n: 50, t: 6, d: 1 },
    { n: 43, t: 7.5, d: 0.5 },
    { n: 41, t: 8, d: 1 },
    { n: 41, t: 9.5, d: 0.5 },
    { n: 48, t: 10, d: 1 },
    { n: 41, t: 11.5, d: 0.5 },
    { n: 40, t: 12, d: 1 },
    { n: 47, t: 14, d: 2 },
  ],
};

const SCORES = { calm: CALM, energy: ENERGY };

const freq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

/* ------------------------------------------------------------------ */
/*  Pleyer                                                             */
/* ------------------------------------------------------------------ */

class MusicPlayer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextBeat = 0;
  private nextTime = 0;
  private track: TrackId = "off";
  private volume = 0.35;

  get current(): TrackId {
    return this.track;
  }

  get level() {
    return this.volume;
  }

  private ensure() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  play(track: TrackId) {
    if (track === "off") return this.stop();
    const ctx = this.ensure();
    if (!ctx) return;
    this.track = track;
    this.nextBeat = 0;
    this.nextTime = ctx.currentTime + 0.12;
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.schedule(), 60);
    this.schedule();
  }

  stop() {
    this.track = "off";
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /** Sahifa yopilganda yoki pauza bo'lganda ovozni pasaytirish. */
  duck(on: boolean) {
    if (!this.master || !this.ctx) return;
    this.master.gain.setTargetAtTime(on ? this.volume * 0.28 : this.volume, this.ctx.currentTime, 0.15);
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || this.track === "off") return;
    const score = SCORES[this.track];
    const beatSec = 60 / score.bpm;
    const totalBeats = score.bars * score.beatsPerBar;

    while (this.nextTime < ctx.currentTime + 0.6) {
      const beat = this.nextBeat % totalBeats;

      for (const note of score.melody) {
        if (Math.abs(note.t - beat) < 1e-6 && note.n !== null) {
          this.voice(note.n, this.nextTime, note.d * beatSec, this.track === "calm" ? 0.16 : 0.2, "triangle");
        }
      }
      for (const note of score.bass) {
        if (Math.abs(note.t - beat) < 1e-6 && note.n !== null) {
          this.voice(note.n, this.nextTime, note.d * beatSec, this.track === "calm" ? 0.13 : 0.17, "sine");
        }
      }
      if (this.track === "energy" && Number.isInteger(beat)) {
        this.percussion(this.nextTime, beat % 2 === 0);
      }

      this.nextBeat += 0.25;
      this.nextTime += beatSec * 0.25;
    }
  }

  private voice(midi: number, at: number, dur: number, gain: number, type: OscillatorType) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2400;

    osc.type = type;
    osc.frequency.value = freq(midi);
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(gain, at + 0.03);
    env.gain.exponentialRampToValueAtTime(0.0001, at + Math.max(0.12, dur * 0.95));

    osc.connect(env).connect(filter).connect(this.master);
    osc.start(at);
    osc.stop(at + dur + 0.06);
  }

  private percussion(at: number, accent: boolean) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const noise = ctx.createBufferSource();
    const len = Math.floor(ctx.sampleRate * 0.09);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = accent ? "lowpass" : "highpass";
    filter.frequency.value = accent ? 320 : 2600;

    const env = ctx.createGain();
    env.gain.setValueAtTime(accent ? 0.16 : 0.05, at);
    env.gain.exponentialRampToValueAtTime(0.0001, at + 0.1);

    noise.connect(filter).connect(env).connect(this.master);
    noise.start(at);
  }
}

export const music = new MusicPlayer();

/* --------------------------- saqlash ------------------------------ */

const KEY = "arqon.music.v1";

export interface MusicPrefs {
  track: TrackId;
  volume: number;
}

export const DEFAULT_MUSIC: MusicPrefs = { track: "calm", volume: 0.3 };

export function getMusicPrefs(): MusicPrefs {
  if (typeof window === "undefined") return DEFAULT_MUSIC;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_MUSIC, ...(JSON.parse(raw) as Partial<MusicPrefs>) } : DEFAULT_MUSIC;
  } catch {
    return DEFAULT_MUSIC;
  }
}

export function saveMusicPrefs(prefs: MusicPrefs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(prefs));
}
