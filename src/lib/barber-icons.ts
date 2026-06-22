export const BARBER_ICON_FILES = [
  'scissors',
  'comb',
  'razor',
  'shave',
  'dryer',
  'foam-brush',
] as const;

export type BarberIconName = (typeof BARBER_ICON_FILES)[number];

export type BarberIconTone = 'accent' | 'white' | 'muted' | 'inverse';

export function resolveBarberIcon(name: string, index = 0): BarberIconName {
  const n = name.toLowerCase();

  if (n.includes('barba') || n.includes('afeit') || n.includes('navaj')) return 'razor';
  if (n.includes('corte') || n.includes('cabello') || n.includes('fade')) return 'scissors';
  if (n.includes('pein') || n.includes('estil') || n.includes('combo')) return 'comb';
  if (n.includes('espum') || n.includes('facial') || n.includes('toalla')) return 'foam-brush';
  if (n.includes('secad') || n.includes('blow')) return 'dryer';
  if (n.includes('shave') || n.includes('clásic')) return 'shave';

  return BARBER_ICON_FILES[index % BARBER_ICON_FILES.length];
}

export function barberIconSrc(icon: BarberIconName): string {
  return `/svg/${icon}.svg`;
}
