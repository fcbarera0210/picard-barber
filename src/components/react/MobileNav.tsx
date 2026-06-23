import { TechnoSynth } from './TechnoSynth';

export function MobileNav() {
  return (
    <div className="lg:hidden">
      <details className="relative">
        <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg border border-white/10 bg-surface text-accent [&::-webkit-details-marker]:hidden">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="sr-only">Menú</span>
        </summary>
        <div className="absolute top-[calc(100%+0.5rem)] right-0 z-50 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-white/10 bg-surface/95 py-2 shadow-lg backdrop-blur-md">
          <a href="/#servicios" className="block px-4 py-2.5 text-sm text-muted hover:text-accent">
            Servicios
          </a>
          <a href="/#horarios" className="block px-4 py-2.5 text-sm text-muted hover:text-accent">
            Horarios y ubicación
          </a>
          <a href="/mis-reservas" className="block px-4 py-2.5 text-sm text-muted hover:text-accent">
            Mis reservas
          </a>

          <div className="mt-2 border-t border-white/10 px-3 py-3">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">// Audio</p>
            <TechnoSynth variant="menu" />
          </div>

          <a
            href="/reservar"
            className="mx-2 mt-1 block rounded-lg bg-accent px-4 py-2.5 text-center text-sm font-bold text-bg"
          >
            Reservar
          </a>
        </div>
      </details>
    </div>
  );
}
