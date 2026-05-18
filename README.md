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
