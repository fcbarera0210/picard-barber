# Pato Barber

Web de barbería con reservas online, historial por email y panel de administración.

## Stack

- **Astro 6** + React (islas)
- **Tailwind CSS 4**
- **Neon PostgreSQL** + Drizzle ORM
- **Auth.js** (solo admin)
- **Vercel** (deploy)

## Requisitos

- Node.js >= 22.12
- Cuenta [Neon](https://neon.tech) con base PostgreSQL

## Configuración local

```bash
cd pato-barber
npm install
cp .env.example .env
# Editar DATABASE_URL, AUTH_SECRET, ADMIN_SEED_*
npm run db:push
npm run db:seed
npm run dev
```

Abre [http://localhost:4321](http://localhost:4321).

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Connection string de Neon |
| `AUTH_SECRET` | Secret para JWT (`openssl rand -base64 32`) |
| `ADMIN_SEED_USERNAME` | Usuario admin inicial |
| `ADMIN_SEED_PASSWORD` | Contraseña admin inicial |
| `PUBLIC_BUSINESS_SLUG` | Slug del negocio (default: `pato-barber`) |

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Landing pública |
| `/reservar` | Flujo de reserva |
| `/mis-reservas` | Historial por email |
| `/admin` | Panel admin (requiere login) |
| `/admin/login` | Inicio de sesión |

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run db:push` | Sincroniza schema con Neon |
| `npm run db:seed` | Crea negocio, servicios y admin |
| `npm test` | Tests del motor de slots |

## Despliegue en Vercel

1. Importa el repositorio en Vercel.
2. Configura las variables de entorno.
3. Ejecuta `npm run db:push` y `npm run db:seed` contra la BD de producción.
4. Deploy automático en cada push.

## Funcionalidades MVP

- Landing con servicios y horarios desde BD
- Reserva: servicio → fecha → hora → datos (nombre, email, teléfono)
- Historial de citas ingresando solo el email
- Admin: servicios, disponibilidad semanal, bloqueadores de emergencia
- Agenda día/semana con cancelación y WhatsApp al cliente
- Lista de clientes con métricas básicas
- Configuración del local y días máximos para reservar

## Post-MVP (no incluido)

- Galería con upload optimizado de imágenes
- Confirmaciones por email
- Métricas avanzadas
