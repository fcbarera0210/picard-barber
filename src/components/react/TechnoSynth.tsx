import { useEffect, useRef, useState } from 'react';
import { getTechnoBeatEngine, subscribeTechnoPlaying } from '../../lib/audio/techno-beat';

type TechnoSynthProps = {
  variant?: 'header' | 'compact';
};

export function TechnoSynth({ variant = 'header' }: TechnoSynthProps) {
  const [playing, setPlaying] = useState(false);
  const [disabled, setDisabled] = useState(false);
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

  if (disabled) return null;

  const isCompact = variant === 'compact';

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center gap-2 rounded-lg border border-white/10 bg-surface/80 transition-all hover:border-accent/40 ${
        isCompact ? 'px-3 py-2 text-xs' : 'px-3 py-1.5 text-xs'
      }`}
      aria-pressed={playing}
      aria-label={playing ? 'Detener música' : 'Activar música'}
    >
      <span
        className={`h-2 w-2 rounded-full ${playing ? 'bg-success animate-pulse' : 'bg-danger'}`}
        aria-hidden="true"
      />
      <span className="font-mono uppercase tracking-wider text-muted">
        {playing ? 'Detener' : 'Música'}
      </span>
      {playing && (
        <span className="flex items-end gap-0.5" aria-hidden="true">
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
  );
}
