import type { BarberIconName, BarberIconTone } from '../../lib/barber-icons';
import { barberIconSrc } from '../../lib/barber-icons';

type BarberIconProps = {
  icon: BarberIconName;
  tone?: BarberIconTone;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
};

const sizeClass = {
  sm: 'barber-icon-sm',
  md: 'barber-icon-md',
  lg: 'barber-icon-lg',
  xl: 'barber-icon-xl',
} as const;

export function BarberIcon({
  icon,
  tone = 'accent',
  size = 'md',
  className = '',
  label,
}: BarberIconProps) {
  return (
    <span
      className={`barber-icon barber-icon--${tone} ${sizeClass[size]} ${className}`.trim()}
      style={{ ['--icon-url' as string]: `url('${barberIconSrc(icon)}')` }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
