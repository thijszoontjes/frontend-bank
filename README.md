# Frontend Bank

Vue 3 + Vite + TypeScript starter for a banking SPA. The project is structured for mock-first development and a clean transition to a Spring Boot REST API.

## Stack

- Vue 3
- Vite
- TypeScript
- vue-router
- Pinia

## Scripts

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run type-check`

## Environment

Create a local `.env` file based on `.env.example`.

- `VITE_API_MODE=mock` uses in-memory mock services.
- `VITE_API_MODE=live` switches the service resolver to HTTP services.
- `VITE_API_BASE_URL` points to the Spring Boot API base path including `/api/v1`.
- `VITE_BASE_PATH` is `/` locally and `/frontend-bank/` when deployed to GitHub Pages.

## Deployment

### Frontend: GitHub Pages

This repository includes `.github/workflows/deploy-frontend.yml`.

1. In GitHub, go to `Settings > Pages`.
2. Set `Build and deployment > Source` to `GitHub Actions`.
3. Go to `Settings > Secrets and variables > Actions > Variables`.
4. Add repository variable `VITE_API_BASE_URL` with the Render backend API URL, for example:

```text
https://your-render-service.onrender.com/api/v1
```

Every push to `main` deploys the frontend to:

```text
https://thijszoontjes.github.io/frontend-bank/
```

### Backend: Render

Deploy the backend repository as a Render Web Service. Use the backend's normal build and start commands, then make sure CORS allows the GitHub Pages origin:

```text
https://thijszoontjes.github.io
```

If the backend uses environment variables for database credentials, JWT secrets, or CORS origins, configure those in Render's Environment settings. Do not commit those values to Git.

## Architecture

- `src/views`: route-level pages
- `src/components`: reusable UI and navigation building blocks
- `src/layouts`: auth and authenticated app shells
- `src/router`: route modules and guards
- `src/stores`: Pinia stores per domain
- `src/services`: contracts, mock implementations, HTTP implementations and resolver
- `src/mocks`: mock datasets
- `src/types`: domain models
- `src/composables`: lightweight reusable state helpers
- `src/utils`: formatting and storage helpers
