# Lebville Boutique & Spa

Lebville is a full-stack boutique, beauty and spa commerce platform for Gaborone,
Botswana. It combines a customer storefront with secure checkout, WhatsApp order and
booking hand-off, and a self-service administration portal.

## Features

### Customer experience

- Browse clothing, cosmetics, accessories and spa services
- Search, filter and sort the catalogue
- Create an account and manage orders
- Add products to a cart and complete DPO Pay checkout
- Request spa appointments without creating an account
- Send saved orders and booking requests to Lebville on WhatsApp
- View active and scheduled promotional campaigns

### Admin Studio

The protected portal is available at `/admin`. Administrators can:

- Add, edit, hide and remove products or services
- Change prices, sale prices, stock, categories, sizes and descriptions
- Upload, replace and remove validated product images
- Create, schedule and remove specials and promotional banners
- Associate specials with catalogue products
- Review orders and update fulfilment status
- Review bookings and update their status
- Change the business WhatsApp number without a code update

All management endpoints require the `admin` role. Important changes are written to
an audit log.

## Technology

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router, Tailwind CSS, Radix UI |
| Backend | FastAPI, Pydantic, Motor |
| Database | MongoDB |
| Images | MongoDB GridFS |
| Authentication | HttpOnly JWT access and refresh cookies |
| Payments | DPO Pay |
| Messaging | WhatsApp click-to-chat with saved order/booking records |

## Repository structure

```text
backend/                 FastAPI application, routes and tests
frontend/                React source and production build
api/                     Legacy Hostinger PHP fallback endpoints
render.yaml              Render deployment Blueprint
DEPLOYMENT.md            Production environment and deployment notes
```

## Local development

### Backend

Create `backend/.env` with the required values described in `DEPLOYMENT.md`, then run:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

In another terminal:

```bash
cd frontend
npm ci --legacy-peer-deps
REACT_APP_BACKEND_URL=http://localhost:8000 npm start
```

The storefront runs at `http://localhost:3000`; the API documentation is available at
`http://localhost:8000/docs`.

## Production deployment

The repository includes a Render Blueprint for:

- `lebville-api` — FastAPI web service
- `lebville-store` — React static site

Deploy through the Render Blueprint and enter all values marked `sync: false`.
Full instructions and the environment-variable list are in [DEPLOYMENT.md](DEPLOYMENT.md).

## Security notes

- No default administrator password is stored in the repository.
- `ADMIN_PASSWORD` must contain at least 12 characters.
- Product totals are recalculated from the database; browser-supplied prices are ignored.
- DPO tokens must match the exact order before payment can be marked successful.
- Browser mutations are checked against the configured frontend origin.
- Uploaded images are restricted by type, content signature and a 5 MB size limit.

## Business contact

- Website: [lebvilleboutique.com](https://www.lebvilleboutique.com)
- Email: info@lebvilleboutique.com
- WhatsApp: [+267 73 011 600](https://wa.me/26773011600)

Built by [Ras Ali Labs](https://github.com/rasali535).
