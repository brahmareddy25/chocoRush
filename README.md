# ChocoRush Local Stack

ChocoRush now runs without Firebase. The frontend stays on React + Vite, and the backend is a local Django API backed by SQLite for easy local E2E testing.

## Stack

- React 19 + Vite
- Django 5
- SQLite locally, PostgreSQL-ready for deployment with `DATABASE_URL`
- Session-based user auth
- Token-based admin auth for the existing admin UI flow

## Project Layout

```text
src/                  React app
backend/              Django project and app
backend/db.sqlite3    Local database after migrations
```

## Local Run

1. Install frontend packages: `npm install`
2. Create a Python environment and install backend packages: `pip install -r backend/requirements.txt`
3. Configure env vars in the project root `.env` if you want the backend to send real emails or switch databases:
   - `DATABASE_URL`
   - `SQLITE_PATH`
   - `DJANGO_ALLOWED_HOSTS`
   - `DJANGO_CSRF_TRUSTED_ORIGINS`
   - `DJANGO_CORS_ALLOWED_ORIGINS`
   - `DJANGO_CORS_ALLOW_HEADERS`
   - `DJANGO_SESSION_COOKIE_SAMESITE`
   - `DJANGO_CSRF_COOKIE_SAMESITE`
   - `RENDER_FRONTEND_URL`
   - `DJANGO_SECURE_SSL_REDIRECT`
   - `DJANGO_SECURE_HSTS_SECONDS`
   - `EMAIL_HOST`
   - `EMAIL_PORT`
   - `EMAIL_HOST_USER`
   - `EMAIL_HOST_PASSWORD`
   - `EMAIL_USE_TLS`
   - `DEFAULT_FROM_EMAIL`
4. Run Django migrations: `npm run migrate:backend`
5. Start Django: `npm run dev:backend`
6. Start Vite in a second terminal: `npm run dev`

The Vite dev server proxies `/api/*` to `http://127.0.0.1:8000`.

## Frontend Deploy

The frontend API client reads `VITE_API_BASE_URL` from Vite env files.

- Local development: leave `VITE_API_BASE_URL` empty in `.env` so Vite can proxy `/api/*` to `http://127.0.0.1:8000`
- Production build: `.env.production` is set to `https://chocorush-backend.onrender.com`, so deployed UI builds will call that backend directly

### Frontend Deploy Steps

1. Keep the backend deployed at `https://chocorush-backend.onrender.com`
2. In your frontend hosting service, build the React app with `npm run build`
3. If your host supports env vars, set `VITE_API_BASE_URL=https://chocorush-backend.onrender.com`
4. Publish the `dist/` folder, or let the host serve the Vite build output automatically
5. If the frontend is deployed as a Render Static Site and uses React Router, add a rewrite rule so direct visits like `/login` do not 404:
   - Source: `/*`
   - Destination: `/index.html`
   - Action: `Rewrite`
6. In Render backend env vars, set `DJANGO_ALLOWED_HOSTS` to include your backend host
7. In Render backend env vars, set `RENDER_FRONTEND_URL=https://your-frontend-domain.com`
8. Optionally set `DJANGO_CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com` if you want explicit CORS control beyond the default
9. If your frontend sends custom headers such as `X-Admin-Session`, set `DJANGO_CORS_ALLOW_HEADERS=x-admin-session`
10. If your frontend submits forms or authenticated requests to Django, also set `DJANGO_CSRF_TRUSTED_ORIGINS=https://your-frontend-domain.com`
11. For a separate frontend domain using session auth, set `DJANGO_SESSION_COOKIE_SAMESITE=None` and `DJANGO_CSRF_COOKIE_SAMESITE=None`
12. Redeploy the backend after updating origins

You can also codify the frontend rewrite in [render.yaml](/e:/choco%20web%20page/render.yaml:1) if you manage the site with a Render Blueprint.

### Example

- Backend URL: `https://chocorush-backend.onrender.com`
- Frontend env: `VITE_API_BASE_URL=https://chocorush-backend.onrender.com`
- Backend frontend URL: `RENDER_FRONTEND_URL=https://your-frontend-domain.com`
- Backend CORS origin: `DJANGO_CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com`
- Backend allowed headers: `DJANGO_CORS_ALLOW_HEADERS=x-admin-session`
- Backend trusted origin: `DJANGO_CSRF_TRUSTED_ORIGINS=https://your-frontend-domain.com`
- Backend session cookie policy: `DJANGO_SESSION_COOKIE_SAMESITE=None`
- Backend CSRF cookie policy: `DJANGO_CSRF_COOKIE_SAMESITE=None`

### Local UI With Deployed Backend

- `npm run dev` expects a local Django server at `127.0.0.1:8000`
- If you only want to run the React UI locally against the deployed Render backend, use `npm run dev:render`
- `npm run dev:render` loads `.env.render`, so the UI calls `https://chocorush-backend.onrender.com` instead of the local Vite proxy
- Or create `.env.local` with `VITE_API_BASE_URL=https://chocorush-backend.onrender.com` if you want plain `npm run dev` to use Render too

The Django backend now auto-loads env vars from:

- `.env` in the project root
- `backend/.env`

## Email Events

The backend now sends customer email notifications for:

- account creation
- profile updates
- order placed
- expected delivery date updates
- delivered orders

## Product Images

- Admin product add/edit now supports browsing and uploading an image file
- Uploaded images are stored directly in the database as data URLs, so no separate media storage setup is required

## Security Notes

- Customer routes stay protected in the React app and admin routes are isolated under `/admin/*`
- The customer header and cart are hidden on admin screens so admin access stays separate from the storefront
- Django now reads allowed hosts and trusted origins from env vars for deployment
- In production mode (`DJANGO_DEBUG=0`), secure cookies, HSTS, SSL redirect, `X-Frame-Options`, and content-type sniffing protection are enabled

## Local E2E Notes

- Products are seeded by the Django migration in `backend/shop/migrations/0002_seed_products.py`
- "Pay online" is now a local test flow that saves the order directly, so no Razorpay setup is required
- Admin login defaults to:
  - Username: `admin`
  - Password: `Admin@123`
- You can override admin credentials with `CHOCORUSH_ADMIN_USERNAME` and `CHOCORUSH_ADMIN_PASSWORD`

## Why SQLite Instead Of H2

H2 is a Java database and is not a normal Django database backend. For local Django E2E testing, SQLite is the closest zero-setup replacement and works cleanly in this repo.
