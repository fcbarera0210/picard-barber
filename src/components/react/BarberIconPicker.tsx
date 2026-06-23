import { BARBER_ICON_FILES, BARBER_ICON_LABELS, type BarberIconName } from '../../lib/barber-icons';
import { BarberIcon } from './BarberIcon';

type BarberIconPickerProps = {
  value: BarberIconName;
  onChange: (icon: BarberIconName) => void;
  name?: string;
  disabled?: boolean;
};

export function BarberIconPicker({ value, onChange, name = 'icon', disabled }: BarberIconPickerProps) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="mb-2 block text-sm text-muted">Icono del servicio</legend>
      <div className="flex flex-wrap gap-2">
        {BARBER_ICON_FILES.map((icon) => {
          const selected = value === icon;
          return (
            <label
              key={icon}
              className={`flex cursor-pointer flex-col items-center gap-1 rounded border px-2 py-2 transition-colors ${
                selected
                  ? 'border-accent bg-accent/10 neon-shadow-acid'
                  : 'border-white/10 bg-surface hover:border-accent/40'
              } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <input
                type="radio"
                name={name}
                value={icon}
                checked={selected}
                onChange={() => onChange(icon)}
                className="sr-only"
              />
              <BarberIcon icon={icon} tone={selected ? 'accent' : 'muted'} size="md" />
              <span className="font-mono text-[9px] uppercase tracking-wide text-muted">
                {BARBER_ICON_LABELS[icon]}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
