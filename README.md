# Simple E-Commerce Store

> Internship project: Kenneth Mart — a minimal e-commerce demo built with Express (backend) and vanilla HTML/CSS/JS (frontend).

## Features
- Product listing and product details page
- Shopping cart with quantity controls
- User registration and login (simple, JSON-based)
- Order placement with payment method selection

## Tech Stack
- Backend: Node.js, Express, CORS
- Frontend: HTML, CSS, JavaScript
- Data store: simple JSON file (`backend/db.json`)

## Project Structure

- `backend/` — Express backend and `db.json`
- `frontend/` — static client (`index.html`, `product.html`, `app.js`, `styles.css`)

## Quick start

Requirements: Node.js (16+), npm

1. Install backend deps and start server

```powershell
cd "C:\Users\Admin\Desktop\Simple E-Commerce Store\backend"
npm install
npm start
```

The backend serves the frontend statically at `http://localhost:5000` and exposes API endpoints under `/api`.

2. Open the site

- Option A — open from the backend: visit `http://localhost:5000` in your browser.
- Option B — use VS Code Live Server: open `frontend/index.html` with Go Live. (If you use Live Server, start the backend as above because the frontend fetches data from `http://localhost:5000/api`.)

## GitHub Pages

The repository now includes a root-level `index.html` and `product.html`, which is what GitHub Pages expects.

Important: GitHub Pages is static hosting, so the Express backend in `backend/server.js` will not run there. That means product loading, login/register, and checkout work locally when the backend is running, but not on GitHub Pages unless you host the backend separately and point `frontend/app.js` to that backend URL.

## Frontend API configuration

- **Auto-detection:** The frontend now resolves the API base automatically from the current site origin (i.e. `window.location.origin + '/api'`). This makes the client work when served by the backend (for example at `http://localhost:5000`) or when deployed with a backend under the same origin.

- **file:// fallback:** If you open the HTML files directly from the filesystem (protocol `file:`), the frontend falls back to `http://localhost:5000/api` so local development using the backend still works.

- **Overrides:** You can override the API base in two ways:
  - Set a global `window.API_URL` (for advanced embedding), e.g. in a script tag before `app.js`.
  - Append the `apiUrl` query parameter to the page URL, for example:

    `index.html?apiUrl=https://your-deployed-backend.example.com/api`

These changes are implemented in `frontend/app.js` so you can point the frontend at any backend URL without editing the source file.

## API Endpoints

- `GET /api/products` — list products
- `GET /api/products/:id` — product details
- `POST /api/register` — register a user (body: `name`, `email`, `password`)
- `POST /api/login` — login (body: `email`, `password`)
- `POST /api/orders` — place an order (body: `userId`, `cartItems`, `paymentMethod`)

## Test credentials

- Email: `test@user.com`
- Password: `password123`

## Notes & next steps

- This project uses a JSON file as the datastore. For production, migrate to a real database (SQLite/Postgres/MongoDB) and hash passwords.
- If you want, I can:
  - Add a VS Code task to start backend + open browser
  - Add a `package.json` script to run both frontend and backend with `concurrently`
  - Initialize a git repo and commit the files for you

---
Created for internship demonstration — Kenneth Mart
