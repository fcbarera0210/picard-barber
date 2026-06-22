import { useEffect, useState } from 'react';

type Props = {
  authError?: string | null;
};

const errorMessages: Record<string, string> = {
  MissingCSRF: 'La verificación de seguridad expiró. Intenta de nuevo.',
  CredentialsSignin: 'Usuario o contraseña incorrectos.',
};

export function AdminLoginForm({ authError }: Props) {
  const [csrfToken, setCsrfToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/csrf', { credentials: 'same-origin' })
      .then(async (res) => {
        if (!res.ok) throw new Error('csrf');
        const data = await res.json();
        setCsrfToken(data.csrfToken ?? '');
      })
      .catch(() => {
        setError('No se pudo conectar con el servidor de autenticación.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-muted">Preparando formulario...</p>;
  }

  if (error || !csrfToken) {
    return (
      <div className="card text-center">
        <p className="font-heading text-lg">No se pudo iniciar sesión</p>
        <p className="mt-2 text-sm text-muted">
          {error || 'Revisa que AUTH_SECRET esté configurado en .env'}
        </p>
      </div>
    );
  }

  const urlError = authError ? (errorMessages[authError] ?? 'Error al iniciar sesión.') : '';

  return (
    <form method="post" action="/api/auth/callback/credentials" className="card laser-scanner mx-auto max-w-md space-y-5">
      <div>
        <h1 className="font-heading text-3xl">
          <span className="text-accent">Admin</span>
        </h1>
        <p className="mt-1 text-sm text-muted">Panel de gestión del local</p>
      </div>

      {urlError && <p className="text-sm text-danger">{urlError}</p>}

      <input type="hidden" name="csrfToken" value={csrfToken} />
      <input type="hidden" name="callbackUrl" value="/admin" />

      <div>
        <label className="mb-1 block text-sm text-muted" htmlFor="username">
          Usuario
        </label>
        <input id="username" name="username" type="text" required className="input-field" />
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted" htmlFor="password">
          Contraseña
        </label>
        <input id="password" name="password" type="password" required className="input-field" />
      </div>

      <button type="submit" className="btn-primary w-full">
        Entrar
      </button>
      <a href="/" className="block text-center text-sm text-muted hover:text-ink">
        ← Volver al sitio
      </a>
    </form>
  );
}
