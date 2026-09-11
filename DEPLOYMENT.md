# Lebville admin deployment

The admin portal is available at `/admin` and uses the FastAPI service under `/api`.

## Required backend environment

Set these values in the backend hosting environment. Never commit their real values.

```text
MONGO_URL=mongodb+srv://<username>:<encoded_password>@cluster.mongodb.net/...
# Note: If your MongoDB password contains special characters (like @, #, $, %, etc.),
# you must URL-encode (percent-encode) the password (e.g. using urllib.parse.quote_plus).
DB_NAME=lebville
JWT_SECRET=<at least 32 random bytes>
ADMIN_EMAIL=<the Lebville administrator email>
ADMIN_PASSWORD=<a unique password of at least 12 characters>
FRONTEND_URL=https://lebvilleboutique.com
CORS_ORIGINS=https://lebvilleboutique.com,https://www.lebvilleboutique.com
DPO_MODE=mock
```

For live payments, change `DPO_MODE` to `live` and configure `DPO_COMPANY_TOKEN`,
`DPO_SERVICE_TYPE`, `DPO_API_URL`, and `DPO_PAYMENT_URL`.

The startup task creates the first administrator only when `ADMIN_EMAIL` and
`ADMIN_PASSWORD` are present. It also rotates that administrator's password to the
configured value on subsequent starts.

## Frontend build

When the API is hosted on a separate domain, build with:

```text
REACT_APP_BACKEND_URL=https://api.example.com npm run build
```

When the frontend host proxies `/api` to FastAPI, build normally with `npm run build`.

## WhatsApp

The destination defaults to `+267 73 011 600`. Once signed in, the administrator can
change it under **Admin Studio → Settings** without a code change.

## Render Blueprint

The root `render.yaml` provisions the FastAPI API and React storefront in Frankfurt
on Render's free plan. It connects the generated service hostnames automatically and
enables deploy-on-commit for `main`.

During Blueprint creation, enter `MONGO_URL`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
The initial deployment uses DPO mock mode so checkout can be verified safely. Change
`DPO_MODE` to `live` only after adding the real `DPO_COMPANY_TOKEN` and
`DPO_SERVICE_TYPE` in Render.
