export type GeoJsonPoint = {
  type: "Point";
  coordinates: [number, number];
};

export type GeoJsonGeometry = GeoJsonPoint;

export type NgsiGeoProperty = {
  type: "GeoProperty";
  value: GeoJsonGeometry;
};

export type NgsiLdEntity = {
  id: string;
  type: string;
  location?: NgsiGeoProperty;
  [key: string]: unknown;
};

export type FeatureProperties = {
  id: string;
  type: string;
  label: string;
  status?: string;
};

export type Feature = {
  type: "Feature";
  geometry: GeoJsonGeometry;
  properties: FeatureProperties;
};

export type FeatureCollection = {
  type: "FeatureCollection";
  features: Feature[];
};
