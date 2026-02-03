# Klirr – NGSI-LD Map UI (Plan B)

Det här repot innehåller en TypeScript-baserad SPA som visualiserar NGSI-LD data på en karta (Leaflet) och erbjuder ett enkelt “admin dashboard”-gränssnitt för att övervaka och filtrera händelser/enheter.

Koden ligger i `ngsi-map-ui/`.

## Teknikstack

- React + TypeScript (Vite)
- Leaflet (kartvy)
- TanStack React Query (datahämtning/caching)
- Tailwind CSS + DaisyUI (UI)
- Biome (lint/format) och Vitest + Testing Library (tester)

## Systemets förmågor

- Visualiserar NGSI-LD entiteter som markörer på en Leaflet-karta.
- Hämtar tillgängliga entitetstyper från NGSI-LD `/ngsi-ld/v1/types` och skapar ett lager per typ (toggle i Leaflet layer control).
- Hämtar entiteter per typ från `/ngsi-ld/v1/entities` och uppdaterar automatiskt (polling var 15:e sekund).
- Tidsfilter: filtrerar markörer baserat på `dateObserved` (och vissa typ-specifika fält som `accidentDate`/`endDate`).
- Popup per entitet med typ, label och utvalda attribut (NGSI-LD `Property`-fält).
- Geolocation: försöker centrera kartan kring användarens position; om det misslyckas kan kartan “fit:as” till alla entiteter.
- Mock-läge för utveckling/demos (inbyggda exempelentiteter).

## Arkitektur

**Översikt**

```
NGSI-LD API
  ├─ /ngsi-ld/v1/types   → type-lista
  └─ /ngsi-ld/v1/entities → entiteter
            ↓
src/map/ngsiClient.ts (fetch + typning)
            ↓
src/map/transformers.ts (NGSI-LD → GeoJSON FeatureCollection)
            ↓
src/map/MapView.tsx (Leaflet: lager, ikoner, popups, fit bounds)
            ↓
src/App.tsx + src/ui/* (layout, tidsfilter, UI-state)
```

**Viktiga moduler**

- `ngsi-map-ui/src/map/ngsiClient.ts`: NGSI-LD-klient (`getTypes`, `getEntities`), stöd för mock data, samt `Link`-header för JSON-LD context.
- `ngsi-map-ui/src/map/transformers.ts`: Transform till GeoJSON, filtrerar bort ogiltiga positioner och extraherar attribut för popups.
- `ngsi-map-ui/src/map/MapView.tsx`: Karta (Leaflet), lager per typ, ikon-/färglogik och polling.
- `ngsi-map-ui/src/ui/Sidebar.tsx`: Sidebar med tidsfilter och statiska “dashboard”-sektioner.

## Inställningar (konfiguration)

Konfiguration sker via Vite env-variabler (måste börja med `VITE_`). Se `ngsi-map-ui/.env.example`.

### Env-variabler

- `VITE_NGSI_BASE_URL`
  - Bas-URL till NGSI-LD-broker (utan avslutande `/`), t.ex. `https://broker.example.com`.
  - Används främst i produktion (i dev används Vite-proxy, se nedan).
- `VITE_NGSI_CONTEXT` (valfri)
  - URL till JSON-LD context som skickas via `Link`-header vid API-anrop.
- `VITE_NGSI_USE_MOCK`
  - Sätt `true` för att använda inbyggd mock-data istället för att anropa broker.

### Lokal utveckling (CORS/proxy)

`ngsi-map-ui/vite.config.ts` proxar `/ngsi-ld` till en broker. I dev bygger klienten URL:er som `/ngsi-ld/v1/...` för att nyttja proxyn.

Om du vill byta broker i utveckling: ändra `target` i `ngsi-map-ui/vite.config.ts`.

### Docker-bygg (build args)

`ngsi-map-ui/Dockerfile` tar följande build args (som sedan blir `ENV` i build-steget):

- `VITE_NGSI_BASE_URL`
- `VITE_NGSI_CONTEXT`
- `VITE_NGSI_USE_MOCK`

## Kom igång

Förutsättningar: Node.js 20+ och npm.

### Köra lokalt

```bash
cd ngsi-map-ui
npm install
npm run dev
```

### Bygga/preview

```bash
cd ngsi-map-ui
npm run build
npm run preview
```

### Kvalitetskommandon

```bash
cd ngsi-map-ui
npm run lint
npm run format
npm run typecheck
npm run test
```

## API-krav (NGSI-LD)

Appen förväntar sig en NGSI-LD-broker med:

- `GET /ngsi-ld/v1/types` (returnerar lista av typer)
- `GET /ngsi-ld/v1/entities?type=...&limit=...`

Anrop görs med `Accept: application/ld+json`. Om `VITE_NGSI_CONTEXT` är satt skickas även `Link`-header för context.

## Begränsningar och antaganden

- Endast entiteter med `location` som `GeoProperty` av typen `Point` visualiseras.
- Koordinater `[0, 0]` filtreras bort.
- Entiteter hämtas per typ med en fast `limit` (idag 200).
