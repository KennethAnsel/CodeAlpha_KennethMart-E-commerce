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
