# ChocoRush Local Stack

ChocoRush now runs without Firebase. The frontend stays on React + Vite, and the backend is a local Django API backed by SQLite for easy local E2E testing.

## Stack

- React 19 + Vite
- Django 5
- SQLite for local persistence
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
3. Configure SMTP env vars in the project root `.env` if you want the backend to send real emails:
   - `DJANGO_ALLOWED_HOSTS`
   - `DJANGO_CSRF_TRUSTED_ORIGINS`
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
