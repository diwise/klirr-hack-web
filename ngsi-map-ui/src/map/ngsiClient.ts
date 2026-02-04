import type { NgsiLdEntity } from "./types";

export type EntityQuery = {
  type?: string;
  q?: string;
  limit?: number;
  georel?: string;
  geometry?: string;
  coordinates?: string;
  geoproperty?: string;
};

export type NgsiTypeResponse = {
  type?: string;
};

export type NgsiTypesPayload = {
  typesList?: NgsiTypeResponse[] | string[];
  typeList?: {
    value?: string[] | NgsiTypeResponse[];
  };
};

const mockEntities: NgsiLdEntity[] = [
  {
    id: "urn:ngsi-ld:Station:central",
    type: "Station",
    name: { type: "Property", value: "Central" },
    status: { type: "Property", value: "active" },
    location: { type: "GeoProperty", value: { type: "Point", coordinates: [18.0649, 59.3326] } },
  },
  {
    id: "urn:ngsi-ld:Route:blue-line",
    type: "Route",
    name: { type: "Property", value: "Blue line" },
    status: { type: "Property", value: "active" },
    location: {
      type: "GeoProperty",
      value: {
        type: "LineString",
        coordinates: [
          [18.035, 59.357],
          [18.0649, 59.3326],
          [18.09, 59.318],
        ],
      },
    },
  },
  {
    id: "urn:ngsi-ld:Route:loop",
    type: "Route",
    name: { type: "Property", value: "Loop" },
    status: { type: "Property", value: "active" },
    location: {
      type: "GeoProperty",
      value: {
        type: "LineString",
        coordinates: [
          [18.055, 59.34],
          [18.07, 59.35],
          [18.085, 59.34],
          [18.055, 59.34],
        ],
      },
    },
  },
  {
    id: "urn:ngsi-ld:Station:north",
    type: "Station",
    name: { type: "Property", value: "North" },
    status: { type: "Property", value: "maintenance" },
    location: { type: "GeoProperty", value: { type: "Point", coordinates: [18.035, 59.357] } },
  },
  {
    id: "urn:ngsi-ld:Sensor:beta",
    type: "Sensor",
    name: { type: "Property", value: "Beta" },
    status: { type: "Property", value: "active" },
    location: { type: "GeoProperty", value: { type: "Point", coordinates: [18.09, 59.318] } },
  },
];

const buildQuery = (query: EntityQuery) => {
  const params = new URLSearchParams();
  if (query.type) params.set("type", query.type);
  if (query.q) params.set("q", query.q);
  if (query.limit) params.set("limit", String(query.limit));
  if (query.georel) params.set("georel", query.georel);
  if (query.geometry) params.set("geometry", query.geometry);
  if (query.coordinates) params.set("coordinates", query.coordinates);
  if (query.geoproperty) params.set("geoproperty", query.geoproperty);
  return params.toString();
};

export const getEntities = async (
  query: EntityQuery,
  signal?: AbortSignal,
): Promise<NgsiLdEntity[]> => {
  const baseUrl = import.meta.env.VITE_NGSI_BASE_URL as string | undefined;
  const useMock = (import.meta.env.VITE_NGSI_USE_MOCK as string | undefined) === "true";

  if ((!baseUrl && !import.meta.env.DEV) || useMock) {
    const filtered = query.type
      ? mockEntities.filter((entity) => entity.type === query.type)
      : mockEntities;
    const limited = query.limit ? filtered.slice(0, query.limit) : filtered;
    return Promise.resolve(limited);
  }

  const params = buildQuery(query);
  const normalizedBase = baseUrl?.replace(/\/$/, "") ?? "";
  const proxyBase = import.meta.env.DEV ? "" : normalizedBase;
  const url = `${proxyBase}/ngsi-ld/v1/entities${params ? `?${params}` : ""}`;

  const headers: { Accept: string; Link?: string } = {
    Accept: "application/ld+json",
  };

  const contextUrl = import.meta.env.VITE_NGSI_CONTEXT as string | undefined;
  if (contextUrl) {
    headers.Link = `<${contextUrl}>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"`;
  }

  const response = await fetch(url, { headers, signal });
  if (!response.ok) {
    throw new Error(`NGSI-LD error: ${response.status}`);
  }

  return (await response.json()) as NgsiLdEntity[];
};

export const getTypes = async (signal?: AbortSignal): Promise<string[]> => {
  const baseUrl = import.meta.env.VITE_NGSI_BASE_URL as string | undefined;
  const useMock = (import.meta.env.VITE_NGSI_USE_MOCK as string | undefined) === "true";

  if ((!baseUrl && !import.meta.env.DEV) || useMock) {
    return Promise.resolve(["Route", "Sensor", "Station"]);
  }

  const normalizedBase = baseUrl?.replace(/\/$/, "") ?? "";
  const proxyBase = import.meta.env.DEV ? "" : normalizedBase;
  const url = `${proxyBase}/ngsi-ld/v1/types`;

  const headers: Record<string, string> = {
    Accept: "application/ld+json",
  };

  const response = await fetch(url, { headers, signal });
  if (!response.ok) {
    throw new Error(`NGSI-LD error: ${response.status}`);
  }

  const payload = (await response.json()) as NgsiTypesPayload | NgsiTypeResponse[];
  const typesList = Array.isArray(payload)
    ? payload
    : (payload.typesList ?? payload.typeList?.value ?? []);

  return typesList
    .map((item) => (typeof item === "string" ? item : item.type))
    .filter((type): type is string => typeof type === "string" && type.length > 0)
    .sort();
};
