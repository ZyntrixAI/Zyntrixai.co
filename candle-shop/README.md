# Serene Scents Website Backend

This project uses a simple Node.js + Express backend to serve the static candle shop site and provide API endpoints for product data and contact form submissions.

## Setup

1. Open a terminal in `c:\Users\Administrator\candle-shop`
2. Run:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the site in your browser at:
   ```
   http://localhost:3000
   ```

## API Endpoints

- `GET /api/products` - returns the candle product list from `data/products.json`
- `POST /api/contact` - accepts contact form submissions and stores them in `data/messages.json`
- `GET /api/health` - health check endpoint

## Notes

- The frontend is served as static files from the same folder.
- `script.js` loads products dynamically in `shop.html` and submits the contact form from `contact.html`.
- Use Node 18+ for best compatibility.
