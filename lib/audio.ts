"use client";

import { audioConfig } from "@/data/audio";

/**
 * Audio engine.
 *  - Original generative ambient music synthesised with the Web Audio API
 *    (soft pads, sparse piano-like plucks, gentle bass, long reverb), or an
 *    optional licensed file via data/audio.ts.
 *  - Restrained sound effects (footsteps, rotor, scooter, UI tick) that can be
 *    switched off separately.
 * Nothing starts until the visitor turns sound on (a user gesture), so browser
 * autoplay policies are respected. Everything is muted by default.
 */

type Prefs = { enabled: boolean; music: number; sfx: boolean; voice: boolean };
const KEY = "vr-audio-prefs";

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// D major / lydian flavoured progression: Dmaj9 – A/C# – Bm7 – Gmaj7
const CHORDS: number[][] = [
  [50, 57, 61, 64, 66],
  [49, 57, 61, 64],
  [47, 54, 57, 62, 66],
  [43, 50, 54, 59, 62],
];
const SCALE = [62, 64, 66, 69, 71, 74, 76, 78, 81];

class AudioEngine {
  prefs: Prefs = { enabled: false, music: audioConfig.defaultMusicVolume, sfx: true, voice: false };
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicBus!: GainNode;
  private sfxBus!: GainNode;
  private reverb!: ConvolverNode;
  private reverbSend!: GainNode;
  private noise!: AudioBuffer;
  private timer: number | null = null;
  private nextChordAt = 0;
  private chordIdx = 0;
  private nextPluckAt = 0;
  private fileEl: HTMLAudioElement | null = null;
  private rotorG: GainNode | null = null;
  private rotorOsc: OscillatorNode | null = null;
  private scooterG: GainNode | null = null;
  private scooterOsc: OscillatorNode | null = null;
  private listeners = new Set<() => void>();
  private lastLoop = { r: -1, s: -1 };
  private loaded = false;

  load() {
    if (this.loaded || typeof window === "undefined") return;
    this.loaded = true;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<Prefs>;
        this.prefs = {
          // never auto-enable sound on load; the visitor must opt in each visit
          enabled: false,
          music: typeof p.music === "number" ? p.music : this.prefs.music,
          sfx: typeof p.sfx === "boolean" ? p.sfx : true,
          voice: false,
        };
      }
    } catch {
      /* ignore */
    }
  }

  subscribe(l: () => void) {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  }
  private emit() {
    this.listeners.forEach((l) => l());
  }
  private save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.prefs));
    } catch {
      /* ignore */
    }
  }

  private ensureContext() {
    if (this.ctx) return this.ctx;
    const AC: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);
    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = this.prefs.music * 0.55;
    this.musicBus.connect(this.master);
    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = 0.5;
    this.sfxBus.connect(this.master);

    // reverb from a generated impulse response
    const len = Math.floor(ctx.sampleRate * 3.6);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = ir;
    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 0.55;
    this.reverbSend.connect(this.reverb);
    this.reverb.connect(this.musicBus);

    // noise buffer for steps
    const nb = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate);
    const nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    this.noise = nb;
    return ctx;
  }

  get enabled() {
    return this.prefs.enabled;
  }

  async setEnabled(on: boolean) {
    this.load();
    this.prefs.enabled = on;
    if (on) {
      const ctx = this.ensureContext();
      if (!ctx) {
        this.prefs.enabled = false;
        this.emit();
        return;
      }
      await ctx.resume().catch(() => undefined);
      this.master.gain.cancelScheduledValues(ctx.currentTime);
      this.master.gain.setTargetAtTime(1, ctx.currentTime, 0.6);
      this.startMusic();
      this.startLoops();
    } else if (this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.25);
      window.setTimeout(() => {
        if (!this.prefs.enabled) {
          this.stopMusic();
          this.ctx?.suspend().catch(() => undefined);
        }
      }, 900);
    }
    if (!on) this.cancelVoice();
    this.save();
    this.emit();
  }

  setMusicVolume(v: number) {
    this.prefs.music = v;
    if (this.ctx) this.musicBus.gain.setTargetAtTime(v * 0.55, this.ctx.currentTime, 0.1);
    if (this.fileEl) this.fileEl.volume = v;
    this.save();
    this.emit();
  }
  setSfx(on: boolean) {
    this.prefs.sfx = on;
    if (!on) this.setLoops(0, 0);
    this.save();
    this.emit();
  }
  setVoice(on: boolean) {
    this.prefs.voice = on;
    if (!on) this.cancelVoice();
    this.emit();
  }

  /* ------------------------------------------------------------- music */

  private startMusic() {
    const ctx = this.ctx;
    if (!ctx) return;
    if (audioConfig.musicSrc) {
      if (!this.fileEl) {
        const el = new Audio(audioConfig.musicSrc);
        el.loop = true;
        el.volume = this.prefs.music;
        this.fileEl = el;
      }
      this.fileEl.play().catch(() => undefined);
      return;
    }
    if (this.timer !== null) return;
    this.nextChordAt = ctx.currentTime + 0.2;
    this.nextPluckAt = ctx.currentTime + 2.5;
    this.timer = window.setInterval(() => this.schedule(), 400);
    this.schedule();
  }

  private stopMusic() {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    this.fileEl?.pause();
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx) return;
    const horizon = ctx.currentTime + 1.6;
    while (this.nextChordAt < horizon) {
      this.playChord(CHORDS[this.chordIdx % CHORDS.length], this.nextChordAt, 9);
      this.chordIdx++;
      this.nextChordAt += 9;
    }
    while (this.nextPluckAt < horizon) {
      const note = SCALE[Math.floor(Math.random() * SCALE.length)];
      this.pluck(note, this.nextPluckAt, 0.05 + Math.random() * 0.03);
      this.nextPluckAt += 1.8 + Math.random() * 3;
    }
  }

  private playChord(notes: number[], at: number, dur: number) {
    const ctx = this.ctx!;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(700, at);
    filter.frequency.linearRampToValueAtTime(1300, at + dur * 0.5);
    filter.frequency.linearRampToValueAtTime(700, at + dur + 3);
    filter.Q.value = 0.4;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(0.5, at + 3.2);
    env.gain.setValueAtTime(0.5, at + dur - 1);
    env.gain.linearRampToValueAtTime(0, at + dur + 3.5);
    filter.connect(env);
    env.connect(this.musicBus);
    env.connect(this.reverbSend);
    notes.forEach((n, i) => {
      const gain = ctx.createGain();
      gain.gain.value = (i === 0 ? 0.16 : 0.1) / Math.sqrt(notes.length);
      gain.connect(filter);
      [-6, 6].forEach((det) => {
        const o = ctx.createOscillator();
        o.type = i % 2 ? "triangle" : "sawtooth";
        o.frequency.value = mtof(n);
        o.detune.value = det;
        o.connect(gain);
        o.start(at);
        o.stop(at + dur + 4);
      });
    });
    // soft sub-bass on the root
    const bass = ctx.createOscillator();
    const bg = ctx.createGain();
    bass.type = "sine";
    bass.frequency.value = mtof(notes[0] - 12);
    bg.gain.setValueAtTime(0, at);
    bg.gain.linearRampToValueAtTime(0.16, at + 2.5);
    bg.gain.linearRampToValueAtTime(0, at + dur + 2);
    bass.connect(bg);
    bg.connect(this.musicBus);
    bass.start(at);
    bass.stop(at + dur + 3);
  }

  private pluck(note: number, at: number, level: number) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(level, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 3.2);
    const o1 = ctx.createOscillator();
    o1.type = "sine";
    o1.frequency.value = mtof(note);
    const o2 = ctx.createOscillator();
    o2.type = "triangle";
    o2.frequency.value = mtof(note + 12);
    const g2 = ctx.createGain();
    g2.gain.value = 0.22;
    o1.connect(g);
    o2.connect(g2);
    g2.connect(g);
    g.connect(this.musicBus);
    g.connect(this.reverbSend);
    o1.start(at);
    o2.start(at);
    o1.stop(at + 3.4);
    o2.stop(at + 3.4);
  }

  /* --------------------------------------------------------------- sfx */

  private canSfx() {
    return !!this.ctx && this.prefs.enabled && this.prefs.sfx;
  }

  step() {
    if (!this.canSfx()) return;
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 260 + Math.random() * 120;
    f.Q.value = 1.1;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxBus);
    src.start(t, 0, 0.1);
  }

  tick() {
    if (!this.canSfx()) return;
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const t = ctx.currentTime;
    o.type = "sine";
    o.frequency.setValueAtTime(880, t);
    o.frequency.exponentialRampToValueAtTime(620, t + 0.07);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.1, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g);
    g.connect(this.sfxBus);
    o.start(t);
    o.stop(t + 0.15);
  }

  private startLoops() {
    const ctx = this.ctx;
    if (!ctx || this.rotorOsc) return;
    const mk = (type: OscillatorType, freq: number, cutoff: number) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = cutoff;
      const g = ctx.createGain();
      g.gain.value = 0;
      o.connect(f);
      f.connect(g);
      g.connect(this.sfxBus);
      o.start();
      return { o, g };
    };
    const r = mk("sawtooth", 62, 520);
    this.rotorOsc = r.o;
    this.rotorG = r.g;
    const s = mk("sawtooth", 80, 380);
    this.scooterOsc = s.o;
    this.scooterG = s.g;
  }

  /** Called every frame; levels are 0..1. Cheap: only touches params on change. */
  setLoops(rotor: number, scooter: number) {
    const ctx = this.ctx;
    if (!ctx || !this.rotorG || !this.scooterG) return;
    const on = this.prefs.enabled && this.prefs.sfx;
    const r = on ? rotor : 0;
    const s = on ? scooter : 0;
    if (Math.abs(r - this.lastLoop.r) > 0.02) {
      this.lastLoop.r = r;
      this.rotorG.gain.setTargetAtTime(r * 0.05, ctx.currentTime, 0.12);
      this.rotorOsc!.frequency.setTargetAtTime(48 + r * 46, ctx.currentTime, 0.2);
    }
    if (Math.abs(s - this.lastLoop.s) > 0.02) {
      this.lastLoop.s = s;
      this.scooterG.gain.setTargetAtTime(s * 0.035, ctx.currentTime, 0.12);
      this.scooterOsc!.frequency.setTargetAtTime(70 + s * 70, ctx.currentTime, 0.2);
    }
  }

  /* ------------------------------------------------------------- voice */

  speak(text: string) {
    if (!this.prefs.voice || typeof window === "undefined" || !("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.02;
    u.pitch = 1.25;
    u.volume = 0.9;
    window.speechSynthesis.speak(u);
  }
  cancelVoice() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }
}

export const audio = new AudioEngine();
