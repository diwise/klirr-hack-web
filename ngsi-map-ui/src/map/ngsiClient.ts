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

const mockEntities: NgsiLdEntity[] = [
  {
    id: "urn:ngsi-ld:Station:central",
    type: "Station",
    name: { type: "Property", value: "Central" },
    status: { type: "Property", value: "active" },
    location: { type: "GeoProperty", value: { type: "Point", coordinates: [18.0649, 59.3326] } },
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

export const getEntities = async (query: EntityQuery): Promise<NgsiLdEntity[]> => {
  const baseUrl = import.meta.env.VITE_NGSI_BASE_URL as string | undefined;
  const useMock = (import.meta.env.VITE_NGSI_USE_MOCK as string | undefined) === "true";

  if (!baseUrl || useMock) {
    return Promise.resolve(mockEntities);
  }

  const params = buildQuery(query);
  const url = `${baseUrl.replace(/\/$/, "")}/ngsi-ld/v1/entities${params ? `?${params}` : ""}`;

  const headers: Record<string, string> = {
    Accept: "application/ld+json",
  };

  const contextUrl = import.meta.env.VITE_NGSI_CONTEXT as string | undefined;
  if (contextUrl) {
    headers.Link = `<${contextUrl}>; rel=\"http://www.w3.org/ns/json-ld#context\"; type=\"application/ld+json\"`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`NGSI-LD error: ${response.status}`);
  }

  return (await response.json()) as NgsiLdEntity[];
};
