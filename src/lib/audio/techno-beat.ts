import {
  createFxBus,
  createNoiseBuffer,
  type BeatPreset,
  type FxBus,
  type StepContext,
} from './techno-sounds';
import { DEFAULT_PRESET, pickRandomSessionPreset, SESSION_PRESETS, TECHNO_PRESETS } from './techno-presets';

type AudioContextCtor = typeof AudioContext;
type PlayingListener = (playing: boolean) => void;

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & { webkitAudioContext?: AudioContextCtor };
  return window.AudioContext ?? w.webkitAudioContext ?? null;
}

export class TechnoBeatEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterFilter: BiquadFilterNode | null = null;
  private fxBus: FxBus | null = null;
  private analyser: AnalyserNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private preset: BeatPreset;
  private running = false;
  private beatStep = 0;
  private barIndex = 0;
  private nextNoteTime = 0;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private readonly stepsPerBeat = 2;
  private readonly stepsPerPhrase = 16;
  private readonly scheduleAhead = 0.14;
  private readonly lookahead = 25;

  constructor(preset: BeatPreset) {
    this.preset = preset;
  }

  get isPlaying() {
    return this.running;
  }

  getPreset(): BeatPreset {
    return this.preset;
  }

  setPreset(preset: BeatPreset): void {
    this.preset = preset;
    if (this.ctx && this.masterGain) {
      this.fxBus = createFxBus(this.ctx, this.masterGain, preset.tempo);
    }
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  async resume(): Promise<void> {
    const Ctor = getAudioContextCtor();
    if (!Ctor) return;

    if (!this.ctx) {
      this.ctx = new Ctor();
      this.noiseBuffer = createNoiseBuffer(this.ctx);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.4;

      this.masterFilter = this.ctx.createBiquadFilter();
      this.masterFilter.type = 'lowpass';
      this.masterFilter.frequency.value = 780;
      this.masterFilter.Q.value = 0.6;

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;

      this.fxBus = createFxBus(this.ctx, this.masterGain, this.preset.tempo);

      this.masterGain.connect(this.masterFilter);
      this.masterFilter.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  async start(): Promise<void> {
    await this.resume();
    if (!this.ctx || !this.masterGain || !this.noiseBuffer || !this.fxBus || this.running) return;

    this.running = true;
    this.beatStep = 0;
    this.barIndex = 0;
    this.nextNoteTime = this.ctx.currentTime;
    this.scheduler();
    notifyPlaying(true);
  }

  stop(): void {
    this.running = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    notifyPlaying(false);
  }

  private get stepDuration(): number {
    return 60 / this.preset.tempo / this.stepsPerBeat;
  }

  private stepContext(): StepContext | null {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer || !this.fxBus) return null;
    return {
      ctx: this.ctx,
      time: this.nextNoteTime,
      step: this.beatStep,
      barIndex: this.barIndex,
      dest: this.fxBus.drumDest,
      melodyDest: this.fxBus.melodyDest,
      noiseBuffer: this.noiseBuffer,
      masterFilter: this.masterFilter,
    };
  }

  private scheduler(): void {
    if (!this.running || !this.ctx || !this.masterGain) return;

    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAhead) {
      const ctx = this.stepContext();
      if (ctx) {
        if (this.beatStep === 0 && this.preset.onPhraseStart) {
          this.preset.onPhraseStart(ctx);
        }
        this.preset.playStep(ctx);
      }

      this.beatStep += 1;
      if (this.beatStep >= this.stepsPerPhrase) {
        this.beatStep = 0;
        this.barIndex += 1;
      }

      this.nextNoteTime += this.stepDuration;
    }

    this.timerId = setTimeout(() => this.scheduler(), this.lookahead);
  }
}

let sharedEngine: TechnoBeatEngine | null = null;
const playingListeners = new Set<PlayingListener>();

function notifyPlaying(playing: boolean) {
  playingListeners.forEach((fn) => fn(playing));
}

export function resetTechnoBeatEngine(): void {
  sharedEngine?.stop();
  sharedEngine = null;
}

export function getTechnoBeatEngine(): TechnoBeatEngine {
  if (!sharedEngine) {
    sharedEngine = new TechnoBeatEngine(pickRandomSessionPreset());
  }
  return sharedEngine;
}

export function subscribeTechnoPlaying(listener: PlayingListener): () => void {
  playingListeners.add(listener);
  listener(getTechnoBeatEngine().isPlaying);
  return () => playingListeners.delete(listener);
}

export { DEFAULT_PRESET, pickRandomSessionPreset, SESSION_PRESETS, TECHNO_PRESETS } from './techno-presets';
