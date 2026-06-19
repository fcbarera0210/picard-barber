import {
  triggerAtmosphere,
  triggerHat,
  triggerKick,
  triggerPad,
  triggerPluck,
  triggerSub,
  triggerTick,
  type BeatPreset,
  type StepContext,
} from './techno-sounds';

/** A minor / hypnotic scale (Hz) */
const NOTES = {
  A3: 220,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  G3: 196,
};

const MELODY_A = [
  NOTES.A3, 0, NOTES.C4, 0, NOTES.E4, 0, NOTES.D4, 0,
  NOTES.C4, 0, NOTES.A3, NOTES.G3, 0, NOTES.B3, 0, NOTES.C4,
];

const MELODY_B = [
  NOTES.E4, 0, NOTES.D4, 0, NOTES.C4, 0, NOTES.A3, 0,
  NOTES.D4, 0, NOTES.E4, NOTES.C4, 0, 0, NOTES.A3, 0,
];

const MELODY_C = [
  NOTES.A3, 0, NOTES.A3, NOTES.C4, 0, NOTES.E4, 0, NOTES.D4,
  0, NOTES.C4, 0, NOTES.A3, 0, NOTES.G3, 0, NOTES.A3,
];

const MELODY_D = [
  NOTES.G3, 0, NOTES.A3, 0, NOTES.C4, 0, NOTES.D4, 0,
  NOTES.E4, 0, NOTES.D4, NOTES.C4, 0, NOTES.A3, 0, 0,
];

const MELODIES = [MELODY_A, MELODY_B, MELODY_C, MELODY_D];

const PAD_AM = [NOTES.A3, NOTES.C4, NOTES.E4];
const PAD_DM = [NOTES.D4, NOTES.A3, NOTES.E4];

const HAT_ROLL = [0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0];
const HAT_SPARSE = [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1];

function getSection(barIndex: number) {
  return Math.floor(barIndex / 8) % 4;
}

function isBreakdown(barIndex: number) {
  const section = getSection(barIndex);
  const phrase = barIndex % 8;
  return section === 2 && phrase >= 5;
}

function isBuild(barIndex: number) {
  const section = getSection(barIndex);
  const phrase = barIndex % 8;
  return section === 1 && phrase >= 4;
}

/**
 * Inspired by Neo — "In & Out" (hypnotic / dark minimal / melodic).
 * Reference: https://www.youtube.com/watch?v=gJ3WVA_623Y
 * Web Audio approximation — not a reproduction.
 */
export const neoInAndOutPreset: BeatPreset = {
  id: 'neo-in-and-out',
  label: 'In & Out',
  tempo: 124,
  onPhraseStart(c) {
    if (!c.masterFilter) return;

    const section = getSection(c.barIndex);
    const phrase = c.barIndex % 8;
    const cycle = Math.floor(c.barIndex / 32) % 2;

    let target = 720;
    if (section === 1) target = 950 + phrase * 35;
    if (section === 2 && phrase < 5) target = 1400 + phrase * 40;
    if (section === 2 && phrase >= 5) target = 580;
    if (section === 3) target = 820 + Math.sin(phrase * 0.9) * 180;

    c.masterFilter.frequency.cancelScheduledValues(c.time);
    c.masterFilter.frequency.setValueAtTime(c.masterFilter.frequency.value, c.time);
    c.masterFilter.frequency.linearRampToValueAtTime(target, c.time + 0.15);

    if (c.barIndex >= 4 && c.barIndex % 8 === 0) {
      const pad = cycle === 0 ? PAD_AM : PAD_DM;
      const padLevel = section === 2 && phrase >= 5 ? 0.5 : 1;
      triggerPad(c.ctx, c.time, pad, c.melodyDest, 14, padLevel);
    }

    if (section === 1 && phrase === 4) {
      triggerAtmosphere(c.ctx, c.noiseBuffer, c.time, c.melodyDest, 6, 0.9);
    }
    if (section === 3 && phrase === 0) {
      triggerAtmosphere(c.ctx, c.noiseBuffer, c.time, c.melodyDest, 4, 0.55);
    }
  },
  playStep(c) {
    const section = getSection(c.barIndex);
    const breakdown = isBreakdown(c.barIndex);
    const build = isBuild(c.barIndex);
    const drums = c.dest;

    if (!breakdown && c.step % 2 === 0) {
      triggerKick(c.ctx, c.time, drums, section === 3 ? 0.88 : 1);
    }

    const hatGrid = build || section === 3 ? HAT_ROLL : HAT_SPARSE;
    if (hatGrid[c.step] === 1) {
      triggerHat(c.ctx, c.noiseBuffer, c.time, drums, {
        open: build && (c.step === 7 || c.step === 15),
        tight: !build && section === 0,
        level: breakdown ? 0.45 : build ? 0.85 : 0.7,
      });
    }

    if (c.barIndex >= 2 && !breakdown) {
      const subPattern =
        section >= 1
          ? [0, 0, 0, 0, 55, 0, 0, 0, 0, 0, 0, 0, 55, 0, 41.2, 0]
          : [55, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 55, 0, 0, 0];
      const subNote = subPattern[c.step] ?? 0;
      if (subNote > 0) {
        triggerSub(c.ctx, c.time, subNote, drums, { duck: c.step % 2 === 0 });
      }
    }

    if (c.barIndex >= 2) {
      const melIdx = (Math.floor(c.barIndex / 2) + section) % MELODIES.length;
      const note = MELODIES[melIdx]![c.step] ?? 0;
      if (note > 0) {
        const melLevel = breakdown ? 1.15 : build ? 0.75 : 1;
        triggerPluck(c.ctx, c.time, note, c.melodyDest, melLevel);
      }
    }

    const phrase = c.barIndex % 8;
    if (c.step === 14 && phrase % 2 === 1 && section >= 2 && !breakdown) {
      triggerTick(c.ctx, c.noiseBuffer, c.time, drums, 0.7);
    }
  },
};

// ─── Preset 2: Midnight Pulse (Dm, deeper & slower) ───────────────────────

const DM = {
  D3: 146.83,
  F3: 174.61,
  A3: 220,
  Bb3: 233.08,
  C4: 261.63,
  D4: 293.66,
  F4: 349.23,
};

const MIDNIGHT_M1 = [
  DM.D4, 0, DM.F4, 0, DM.D4, 0, DM.C4, 0,
  DM.A3, 0, DM.F3, 0, DM.A3, 0, DM.D4, 0,
];

const MIDNIGHT_M2 = [
  DM.F4, 0, DM.D4, 0, DM.A3, 0, 0, DM.C4,
  0, DM.A3, 0, DM.F3, 0, DM.D4, 0, 0,
];

const MIDNIGHT_M3 = [
  DM.A3, 0, 0, DM.C4, 0, DM.D4, 0, DM.F4,
  0, DM.D4, 0, DM.A3, 0, 0, DM.F3, 0,
];

const MIDNIGHT_MELODIES = [MIDNIGHT_M1, MIDNIGHT_M2, MIDNIGHT_M3];

const PAD_DM_LOW = [DM.D3, DM.F3, DM.A3];

const HAT_PULSE = [0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1];

function midnightSection(barIndex: number) {
  return Math.floor(barIndex / 8) % 4;
}

export const midnightPulsePreset: BeatPreset = {
  id: 'midnight-pulse',
  label: 'Midnight Pulse',
  tempo: 120,
  onPhraseStart(c) {
    if (!c.masterFilter) return;
    const section = midnightSection(c.barIndex);
    const phrase = c.barIndex % 8;

    let target = 620;
    if (section === 0) target = 680 + phrase * 20;
    if (section === 1) target = 880 + phrase * 45;
    if (section === 2 && phrase < 4) target = 1100;
    if (section === 2 && phrase >= 4) target = 520;
    if (section === 3) target = 740 + Math.sin(phrase) * 120;

    c.masterFilter.frequency.cancelScheduledValues(c.time);
    c.masterFilter.frequency.setValueAtTime(c.masterFilter.frequency.value, c.time);
    c.masterFilter.frequency.linearRampToValueAtTime(target, c.time + 0.2);

    if (c.barIndex >= 6 && c.barIndex % 8 === 0) {
      triggerPad(c.ctx, c.time, PAD_DM_LOW, c.melodyDest, 16, section === 2 && phrase >= 4 ? 0.6 : 1);
    }

    if (section === 1 && phrase === 3) {
      triggerAtmosphere(c.ctx, c.noiseBuffer, c.time, c.melodyDest, 8, 0.75);
    }
  },
  playStep(c) {
    const section = midnightSection(c.barIndex);
    const phrase = c.barIndex % 8;
    const breakdown = section === 2 && phrase >= 4;
    const build = section === 1 && phrase >= 3;
    const drums = c.dest;

    if (!breakdown && c.step % 2 === 0) {
      triggerKick(c.ctx, c.time, drums, build ? 0.95 : 0.9);
    }

    if (HAT_PULSE[c.step] === 1) {
      triggerHat(c.ctx, c.noiseBuffer, c.time, drums, {
        open: build && c.step === 15,
        tight: section === 0,
        level: breakdown ? 0.4 : 0.65,
      });
    }

    if (c.barIndex >= 3 && !breakdown) {
      const sub = section >= 1 ? 41.2 : 55;
      if (c.step === 0 || c.step === 8 || (section >= 2 && c.step === 12)) {
        triggerSub(c.ctx, c.time, sub, drums, { duck: c.step % 2 === 0, decay: 0.65 });
      }
    }

    if (c.barIndex >= 4) {
      const melIdx = (Math.floor(c.barIndex / 3) + section) % MIDNIGHT_MELODIES.length;
      const note = MIDNIGHT_MELODIES[melIdx]![c.step] ?? 0;
      if (note > 0) {
        triggerPluck(c.ctx, c.time, note, c.melodyDest, breakdown ? 1.2 : 0.85);
      }
    }

    if (c.step === 4 && section >= 2 && !breakdown && phrase % 2 === 0) {
      triggerTick(c.ctx, c.noiseBuffer, c.time, drums, 0.55);
    }
  },
};

// ─── Preset 3: Ritual Depth (Gm, tribal-hypnotic) ─────────────────────────

const GM = {
  G2: 98,
  Bb2: 116.54,
  D3: 146.83,
  F3: 174.61,
  G3: 196,
  Bb3: 233.08,
  D4: 293.66,
};

const RITUAL_M1 = [
  GM.G3, 0, 0, GM.Bb3, 0, GM.D4, 0, 0,
  GM.Bb3, 0, GM.G3, 0, 0, GM.F3, 0, GM.G3,
];

const RITUAL_M2 = [
  GM.D4, 0, GM.Bb3, 0, 0, GM.G3, 0, GM.Bb3,
  0, 0, GM.G3, 0, GM.D4, 0, 0, GM.Bb3,
];

const RITUAL_M3 = [
  GM.G3, 0, GM.D4, 0, GM.Bb3, 0, 0, GM.G3,
  0, GM.F3, 0, GM.G3, 0, 0, GM.Bb3, 0,
];

const RITUAL_MELODIES = [RITUAL_M1, RITUAL_M2, RITUAL_M3];

const PAD_GM = [GM.G2, GM.Bb2, GM.D3];

const HAT_TRIBAL = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0];

function ritualSection(barIndex: number) {
  return Math.floor(barIndex / 8) % 4;
}

export const ritualDepthPreset: BeatPreset = {
  id: 'ritual-depth',
  label: 'Ritual Depth',
  tempo: 123,
  onPhraseStart(c) {
    if (!c.masterFilter) return;
    const section = ritualSection(c.barIndex);
    const phrase = c.barIndex % 8;
    const wave = Math.floor(c.barIndex / 16) % 2;

    let target = 700;
    if (section === 0) target = 750;
    if (section === 1) target = 900 + phrase * 30;
    if (section === 2) target = wave === 0 ? 1250 - phrase * 30 : 600;
    if (section === 3) target = 850 + Math.cos(phrase * 0.7) * 150;

    c.masterFilter.frequency.cancelScheduledValues(c.time);
    c.masterFilter.frequency.setValueAtTime(c.masterFilter.frequency.value, c.time);
    c.masterFilter.frequency.linearRampToValueAtTime(target, c.time + 0.18);

    if (c.barIndex >= 5 && c.barIndex % 8 === 0) {
      triggerPad(c.ctx, c.time, PAD_GM, c.melodyDest, 12, section === 2 ? 0.55 : 0.9);
    }

    if (section === 2 && phrase === 0) {
      triggerAtmosphere(c.ctx, c.noiseBuffer, c.time, c.melodyDest, 5, 1);
    }
    if (section === 3 && phrase === 6) {
      triggerAtmosphere(c.ctx, c.noiseBuffer, c.time, c.melodyDest, 3, 0.45);
    }
  },
  playStep(c) {
    const section = ritualSection(c.barIndex);
    const phrase = c.barIndex % 8;
    const breakdown = section === 2 && phrase >= 5;
    const peak = section === 3;
    const drums = c.dest;

    if (!breakdown && c.step % 2 === 0) {
      triggerKick(c.ctx, c.time, drums, peak ? 1 : 0.92);
    } else if (c.step === 6 && section >= 1 && !breakdown && phrase % 2 === 0) {
      triggerKick(c.ctx, c.time, drums, 0.2);
    }

    if (HAT_TRIBAL[c.step] === 1) {
      triggerHat(c.ctx, c.noiseBuffer, c.time, drums, {
        open: peak && (c.step === 7 || c.step === 3),
        level: breakdown ? 0.35 : peak ? 0.8 : 0.6,
      });
    }

    if (c.barIndex >= 2 && !breakdown) {
      const subs = [GM.G2, 0, 0, 0, GM.D3, 0, 0, 0, GM.G2, 0, 0, GM.Bb2, 0, 0, 0, 0];
      const subNote = subs[c.step] ?? 0;
      if (subNote > 0) {
        triggerSub(c.ctx, c.time, subNote, drums, { duck: c.step % 2 === 0, level: 0.9, decay: 0.5 });
      }
    }

    if (c.barIndex >= 3) {
      const melIdx = (Math.floor(c.barIndex / 2) + phrase) % RITUAL_MELODIES.length;
      const note = RITUAL_MELODIES[melIdx]![c.step] ?? 0;
      if (note > 0) {
        triggerPluck(c.ctx, c.time, note, c.melodyDest, breakdown ? 1.1 : peak ? 0.9 : 1);
      }
    }

    if ([2, 6, 10, 14].includes(c.step) && section >= 1 && !breakdown) {
      triggerTick(c.ctx, c.noiseBuffer, c.time, drums, 0.45);
    }
  },
};

export const darkMinimalPreset: BeatPreset = {
  id: 'dark-minimal',
  label: 'Dark minimal',
  tempo: 122,
  playStep(c) {
    if (c.step % 2 === 0) triggerKick(c.ctx, c.time, c.dest);
    if (c.step % 2 === 1) triggerHat(c.ctx, c.noiseBuffer, c.time, c.dest);
    if (c.step === 0 || c.step === 8) triggerSub(c.ctx, c.time, 55, c.dest);
  },
};

export const DEFAULT_PRESET = neoInAndOutPreset;

/** Presets that rotate randomly on each page load */
export const SESSION_PRESETS: BeatPreset[] = [
  neoInAndOutPreset,
  midnightPulsePreset,
  ritualDepthPreset,
];

export const TECHNO_PRESETS: BeatPreset[] = [
  ...SESSION_PRESETS,
  darkMinimalPreset,
];

export function pickRandomSessionPreset(): BeatPreset {
  const index = Math.floor(Math.random() * SESSION_PRESETS.length);
  return SESSION_PRESETS[index] ?? neoInAndOutPreset;
}

export function getPresetById(id: string): BeatPreset {
  return TECHNO_PRESETS.find((p) => p.id === id) ?? DEFAULT_PRESET;
}
