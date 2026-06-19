import { useEffect, useRef, useState } from 'react';

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/agenda', label: 'Agenda' },
  { href: '/admin/servicios', label: 'Servicios' },
  { href: '/admin/disponibilidad', label: 'Disponibilidad' },
  { href: '/admin/clientes', label: 'Clientes' },
  { href: '/admin/configuracion', label: 'Config' },
  { href: '/', label: 'Sitio público', muted: true },
];

function isActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin';
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

type AdminMobileNavProps = {
  pathname: string;
};

export function AdminMobileNav({ pathname }: AdminMobileNavProps) {
  const [open, setOpen] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/csrf', { credentials: 'same-origin' })
      .then((res) => res.json())
      .then((data) => setCsrfToken(data.csrfToken ?? ''))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative sm:hidden">
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface-light"
        aria-expanded={open}
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? '✕' : '☰'}
      </button>
      {open && (
        <div className="absolute top-[calc(100%+0.5rem)] right-0 z-50 min-w-[12rem] rounded-xl border border-border bg-surface py-2 shadow-lg">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={
                isActive(pathname, link.href)
                  ? 'admin-nav-link admin-nav-link-active block'
                  : link.muted
                    ? 'admin-nav-link block text-muted'
                    : 'admin-nav-link block'
              }
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <form method="post" action="/api/auth/signout" className="border-t border-border px-1 pt-1">
            {csrfToken && <input type="hidden" name="csrfToken" value={csrfToken} />}
            <input type="hidden" name="callbackUrl" value="/admin/login" />
            <button
              type="submit"
              disabled={!csrfToken}
              className="admin-nav-link block w-full text-left text-danger disabled:opacity-50"
            >
              Salir
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
