type MobileNavProps = {
  businessName: string;
};

export function MobileNav({ businessName }: MobileNavProps) {
  return (
    <div className="sm:hidden">
      <details className="relative">
        <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg border border-border bg-surface text-ink [&::-webkit-details-marker]:hidden">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="sr-only">Menú {businessName}</span>
        </summary>
        <div className="absolute top-[calc(100%+0.5rem)] right-0 z-50 min-w-[12rem] rounded-xl border border-border bg-surface py-2 shadow-lg">
          <a href="/#servicios" className="block px-4 py-2 text-sm text-muted hover:text-ink">
            Servicios
          </a>
          <a href="/mis-reservas" className="block px-4 py-2 text-sm text-muted hover:text-ink">
            Mis reservas
          </a>
          <a href="/reservar" className="mx-2 mt-1 block rounded-lg bg-accent px-4 py-2 text-center text-sm font-semibold text-bg">
            Reservar
          </a>
        </div>
      </details>
    </div>
  );
}
