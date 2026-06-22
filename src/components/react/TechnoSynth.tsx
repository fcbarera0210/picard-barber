import { useEffect, useRef, useState } from 'react';
import { getTechnoBeatEngine, subscribeTechnoPlaying } from '../../lib/audio/techno-beat';

type TechnoSynthProps = {
  variant?: 'header' | 'compact';
};

function volumeToPercent(volume: number): number {
  return Math.round(volume * 100);
}

function percentToVolume(percent: number): number {
  return Math.min(1, Math.max(0, percent / 100));
}

export function TechnoSynth({ variant = 'header' }: TechnoSynthProps) {
  const [playing, setPlaying] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [volume, setVolume] = useState(() => volumeToPercent(getTechnoBeatEngine().getVolume()));
  const [barHeights, setBarHeights] = useState([4, 4, 4, 4, 4]);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setDisabled(true);
      return;
    }

    return subscribeTechnoPlaying(setPlaying);
  }, []);

  useEffect(() => {
    if (!playing) {
      setBarHeights([4, 4, 4, 4, 4]);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    const engine = getTechnoBeatEngine();
    const data = new Uint8Array(16);

    function animate() {
      const analyser = engine.getAnalyser();
      if (analyser) {
        analyser.getByteFrequencyData(data);
        setBarHeights([
          4 + (data[2] / 255) * 16,
          4 + (data[4] / 255) * 20,
          4 + (data[6] / 255) * 24,
          4 + (data[8] / 255) * 18,
          4 + (data[10] / 255) * 14,
        ]);
      }
      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [playing]);

  async function toggle() {
    const engine = getTechnoBeatEngine();

    if (playing) {
      engine.stop();
    } else {
      await engine.start();
    }
  }

  async function handleVolumeChange(nextPercent: number) {
    setVolume(nextPercent);
    const engine = getTechnoBeatEngine();
    engine.setVolume(percentToVolume(nextPercent));
    if (nextPercent > 0) {
      await engine.resume();
    }
  }

  if (disabled) return null;

  const isCompact = variant === 'compact';

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border border-white/10 bg-surface/80 ${
        isCompact ? 'px-2 py-2' : 'px-2 py-1.5'
      }`}
    >
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-2 transition-colors hover:text-accent"
        aria-pressed={playing}
        aria-label={playing ? 'Detener música' : 'Activar música'}
      >
        <span
          className={`h-2 w-2 rounded-full ${playing ? 'bg-success animate-pulse' : 'bg-danger'}`}
          aria-hidden="true"
        />
        <span className="font-mono text-xs uppercase tracking-wider text-muted">
          {playing ? 'Detener' : 'Música'}
        </span>
        {playing && (
          <span className="hidden items-end gap-0.5 sm:flex" aria-hidden="true">
            {barHeights.map((h, i) => (
              <span
                key={i}
                className="w-0.5 rounded-full bg-accent transition-all duration-75"
                style={{ height: `${h}px` }}
              />
            ))}
          </span>
        )}
      </button>

      <label className="flex items-center gap-1.5 border-l border-white/10 pl-2">
        <span className="sr-only">Volumen de música</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          className="shrink-0 text-muted"
          aria-hidden="true"
        >
          <path
            d="M5 9v6h4l5 5V4L9 9H5z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {volume > 0 && (
            <path
              d="M16 8a5 5 0 010 8M18.5 5.5a8.5 8.5 0 010 13"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          )}
        </svg>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={volume}
          onChange={(e) => void handleVolumeChange(Number(e.target.value))}
          className="audio-volume-slider w-14 sm:w-20"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={volume}
          aria-label="Volumen de música"
        />
        <span className="hidden min-w-[2rem] font-mono text-[10px] text-muted sm:inline">
          {volume}%
        </span>
      </label>
    </div>
  );
}
