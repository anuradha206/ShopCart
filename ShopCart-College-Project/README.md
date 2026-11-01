# ShopCart

ShopCart is a small online store project built with React, TypeScript, Vite, and a Python SQLite API. It is designed to be easy to run and explain in a college project demonstration.

## What it does

- Browse a sample catalog; search by product name, brand, description, or category.
- Sort products, view product details, and check stock quantities.
- Add products to a cart and wishlist. These are kept in this browser between visits.
- Place sample orders and review order status.
- Use the admin screen to demonstrate inventory and order management.
- View the API status and try the included API explorer.

## Requirements

- Node.js 20 or newer and npm
- Python 3.10 or newer

## Run locally

1. Extract the project and open a terminal in the project folder.
2. Install the frontend packages:

   ```bash
   npm install
   ```

3. Start the project:

   ```bash
   npm run dev
   ```

4. Open the local URL printed by Vite (normally `http://localhost:3000`).

Vite starts the included Python API (`backend/run_server.py`) when needed. The API uses the standard library and SQLite, and listens on port `8001`. Python must be available on your PATH. On systems where the command is not named `python`, set the `PYTHON` environment variable to the Python executable before running Vite.

The API can also be started by itself from the project root:

```bash
python backend/run_server.py
```

Then open `http://localhost:8001/api/health` for the health response. The frontend proxies `/api` requests to this service.

## Project structure

```text
src/                   React app, components, product data and API client
backend/run_server.py  SQLite-backed API used by the storefront
backend/app/           FastAPI health-check scaffold for coursework extension
backend/alembic/       Database migration scaffold
```

## Notes for a project presentation

- The bundled catalog is sample data. Order, cart, and wishlist features are intended for a local demonstration.
- The “Demo shortcuts” in the sign-in window are presentation shortcuts, not secure authentication. The project is not ready to handle real payments or real customer data.
- `backend/app/` is an additional FastAPI scaffold. The running storefront currently uses the simpler SQLite API in `backend/run_server.py`.

## Useful commands

```bash
npm run dev     # Start the storefront and local API
npm run build   # Create a production frontend build in dist/
npm run lint    # Check TypeScript types
```
