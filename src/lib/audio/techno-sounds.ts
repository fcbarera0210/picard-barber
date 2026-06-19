/** Shared Web Audio drum/synth triggers for techno presets */

export type FxBus = {
  drumDest: GainNode;
  melodyDest: GainNode;
};

export function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const length = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export function createFxBus(ctx: AudioContext, master: GainNode, tempo: number): FxBus {
  const drumDest = master;

  const melodyDest = ctx.createGain();
  melodyDest.gain.value = 0.62;

  const delay = ctx.createDelay(2.0);
  const beatSec = 60 / tempo;
  delay.delayTime.value = beatSec * 0.375; // dotted eighth

  const feedback = ctx.createGain();
  feedback.gain.value = 0.38;

  const delayFilter = ctx.createBiquadFilter();
  delayFilter.type = 'lowpass';
  delayFilter.frequency.value = 1600;
  delayFilter.Q.value = 0.8;

  melodyDest.connect(master);
  melodyDest.connect(delay);
  delay.connect(delayFilter);
  delayFilter.connect(feedback);
  feedback.connect(delay);

  return { drumDest, melodyDest };
}

/** Club-style kick — punch + sub tail */
export function triggerKick(
  ctx: AudioContext,
  time: number,
  destination: AudioNode,
  level = 1,
) {
  const osc = ctx.createOscillator();
  const click = ctx.createOscillator();
  const gain = ctx.createGain();
  const clickGain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(120, time);
  osc.frequency.exponentialRampToValueAtTime(48, time + 0.04);
  osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.65);

  click.type = 'triangle';
  click.frequency.setValueAtTime(280, time);
  click.frequency.exponentialRampToValueAtTime(80, time + 0.025);

  const peak = 0.48 * level;
  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(peak, time + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.65);

  clickGain.gain.setValueAtTime(0.12 * level, time);
  clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

  osc.connect(gain);
  click.connect(clickGain);
  gain.connect(destination);
  clickGain.connect(destination);
  osc.start(time);
  click.start(time);
  osc.stop(time + 0.65);
  click.stop(time + 0.05);
}

export function triggerHat(
  ctx: AudioContext,
  noiseBuffer: AudioBuffer,
  time: number,
  destination: AudioNode,
  opts: { open?: boolean; level?: number; tight?: boolean } = {},
) {
  const { open = false, level = 1, tight = false } = opts;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(open ? 5200 : tight ? 9200 : 7800, time);
  filter.Q.value = open ? 0.5 : 0.85;

  const gain = ctx.createGain();
  const duration = open ? 0.14 : tight ? 0.022 : 0.04;
  const peak = (open ? 0.05 : tight ? 0.022 : 0.032) * level;
  gain.gain.setValueAtTime(peak, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  src.start(time);
  src.stop(time + duration + 0.01);
}

export function triggerSub(
  ctx: AudioContext,
  time: number,
  frequency: number,
  destination: AudioNode,
  opts: { duck?: boolean; level?: number; decay?: number } = {},
) {
  const { duck = false, level = 1, decay = 0.55 } = opts;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, time);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(140, time);

  const peak = (duck ? 0.06 : 0.13) * level;
  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(peak, time + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  osc.start(time);
  osc.stop(time + decay);
}

/** Hypnotic pluck — melodic hook */
export function triggerPluck(
  ctx: AudioContext,
  time: number,
  frequency: number,
  destination: AudioNode,
  level = 1,
) {
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(frequency, time);
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(frequency * 2, time);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2800, time);
  filter.frequency.exponentialRampToValueAtTime(320, time + 0.35);
  filter.Q.value = 2;

  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(0.07 * level, time + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.55);

  osc.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  osc.start(time);
  osc2.start(time);
  osc.stop(time + 0.55);
  osc2.stop(time + 0.55);
}

/** Pad chord — Am / Dm vibes */
export function triggerPad(
  ctx: AudioContext,
  time: number,
  frequencies: number[],
  destination: AudioNode,
  duration: number,
  level = 1,
) {
  for (const freq of frequencies) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.028 * level, time + 1.8);
    gain.gain.linearRampToValueAtTime(0.018 * level, time + duration - 2);
    gain.gain.linearRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(destination);
    osc.start(time);
    osc.stop(time + duration + 0.05);
  }
}

/** Noise swell — "the noise rushes in" */
export function triggerAtmosphere(
  ctx: AudioContext,
  noiseBuffer: AudioBuffer,
  time: number,
  destination: AudioNode,
  duration: number,
  level = 1,
) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(400, time);
  filter.frequency.linearRampToValueAtTime(1200, time + duration * 0.45);
  filter.frequency.linearRampToValueAtTime(350, time + duration);
  filter.Q.value = 1.2;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(0.055 * level, time + duration * 0.4);
  gain.gain.linearRampToValueAtTime(0.001, time + duration);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  src.start(time);
  src.stop(time + duration + 0.05);
}

export function triggerTick(
  ctx: AudioContext,
  noiseBuffer: AudioBuffer,
  time: number,
  destination: AudioNode,
  level = 1,
) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(3200, time);
  filter.Q.value = 8;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.018 * level, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  src.start(time);
  src.stop(time + 0.025);
}

export type StepContext = {
  ctx: AudioContext;
  time: number;
  step: number;
  barIndex: number;
  dest: GainNode;
  melodyDest: GainNode;
  noiseBuffer: AudioBuffer;
  masterFilter: BiquadFilterNode | null;
};

export type BeatPreset = {
  id: string;
  label: string;
  tempo: number;
  onPhraseStart?: (c: StepContext) => void;
  playStep: (c: StepContext) => void;
};
