# Optimus Vintage API

Backend API server for the Optimus Vintage mobile app. Connects to PostgreSQL database hosted on Railway.

## Setup

1. Install dependencies:
```bash
cd api
npm install
```

2. Create `.env` file (optional, defaults are set for Railway):
```bash
PGHOST=turntable.proxy.rlwy.net
PGPORT=51538
PGUSER=postgres
PGPASSWORD=LNBzmjBhfsKQViWmdMwCpDNADYCkNiNM
PGDATABASE=railway
PORT=3001
```

3. Run development server:
```bash
npm run dev
```

## API Endpoints

### Lots
- `GET /api/lots` - Get all lots
- `GET /api/lots/:id` - Get lot by ID
- `POST /api/lots` - Create lot
- `PUT /api/lots/:id` - Update lot
- `DELETE /api/lots/:id` - Delete lot

### Items
- `GET /api/items` - Get all items (optional: `?lotId=X` or `?status=STOCK`)
- `GET /api/items/:id` - Get item by ID
- `POST /api/items` - Create item
- `POST /api/items/batch` - Create multiple items
- `PUT /api/items/:id` - Update item
- `PATCH /api/items/:id/status` - Update item status
- `DELETE /api/items/:id` - Delete item

### Sales
- `GET /api/sales` - Get all sales (optional: `?lotId=X`)
- `GET /api/sales/:id` - Get sale by ID
- `GET /api/sales/revenue` - Get total revenue (optional: `?lotId=X`)
- `POST /api/sales` - Create sale
- `DELETE /api/sales/:id` - Delete sale

### Health
- `GET /api/health` - Check API and database status

## Deployment

For Railway deployment, the API will automatically use environment variables.

For other platforms (Vercel, Render, etc.), configure the PostgreSQL environment variables accordingly.
