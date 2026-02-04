import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { getEntities } from "./ngsiClient";
import { toFeatureCollection } from "./transformers";
import type { FeatureCollection } from "./types";

const defaultCenter: L.LatLngExpression = [59.3326, 18.0649];

const hashColor = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 360;
  }
  return `hsl(${hash}, 70%, 55%)`;
};

const statusColor = (status?: string) => {
  if (status === "active") return "#2dd4bf";
  if (status === "maintenance") return "#f59e0b";
  return "#60a5fa";
};

const weatherTemperatureColor = (temperature: number) => {
  if (temperature >= 20) return "#ef4444";
  if (temperature >= 10) return "#f59e0b";
  if (temperature >= -10) return "#22c55e";
  if (temperature >= -20) return "#38bdf8";
  return "#1e3a8a";
};

const styleFeature = (feature?: GeoJSON.Feature, typeColor?: string) => {
  const props = feature?.properties as { status?: unknown } | undefined;
  const status = typeof props?.status === "string" ? props.status : undefined;
  return {
    color: typeColor ?? statusColor(status),
    weight: 2,
    fillOpacity: 0.35,
  };
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const typeAbbreviation: Record<string, string> = {
  AirQualityObserved: "⛅",
  Beach: "BH",
  CityWork: "🚧",
  CombinedSewageOverflow: "CS",
  Device: "DV",
  ExerciseTrail: "ET",
  IndoorEnvironmentObserved: "IE",
  Lifebuoy: "🛟",
  RoadAccident: "⚠️",
  SewagePumpingStation: "SP",
  SportsField: "SF",
  SportsVenue: "SV",
  WasteContainer: "🚮",
  WaterQualityObserved: "💦",
  WeatherObserved: "🌦",
  Incident: "🚨",
};

const buildSvgIcon = (label: string, color: string) => `
  <svg width="34" height="34" viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg">
    <circle cx="17" cy="17" r="14" fill="${color}" />
    <circle cx="17" cy="17" r="11" fill="rgba(0,0,0,0.25)" />
    <text x="17" y="20" text-anchor="middle" font-size="10" font-weight="700" fill="#f8fafc" font-family="Inter, sans-serif">
      ${escapeHtml(label)}
    </text>
  </svg>
`;

const getIconForType = (type: string, color: string, cache: Map<string, L.DivIcon>) => {
  const key = `${type}:${color}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const label = typeAbbreviation[type] ?? type.slice(0, 2).toUpperCase();
  const icon = L.divIcon({
    className: "ngsi-type-icon",
    html: buildSvgIcon(label, color),
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -12],
  });
  cache.set(key, icon);
  return icon;
};

const getTemperatureValue = (attributes: Array<{ key?: unknown; value?: unknown }>) => {
  const entry = attributes.find((attribute) => attribute.key === "temperature");
  if (!entry) return null;
  const raw = typeof entry.value === "string" ? entry.value : String(entry.value ?? "");
  const numeric = Number.parseFloat(raw.replace(",", "."));
  return Number.isNaN(numeric) ? null : numeric;
};

type MapViewProps = {
  types: string[];
  rangeStart?: number;
  onObservedRange?: (range: { min: number; max: number }) => void;
  fitSignal?: number;
  pollingPaused?: boolean;
  refreshSignal?: number;
  onFetchMeta?: (meta: { lastFetchedAt?: number; entityCount: number }) => void;
};

export const MapView = ({
  types,
  rangeStart,
  onObservedRange,
  fitSignal,
  pollingPaused,
  refreshSignal,
  onFetchMeta,
}: MapViewProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const layerControlRef = useRef<L.Control.Layers | null>(null);
  const layerGroupsRef = useRef<Map<string, L.GeoJSON>>(new Map());
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const shouldFitOnDataRef = useRef(false);
  const didInitialFitRef = useRef(false);
  const iconCacheRef = useRef<Map<string, L.DivIcon>>(new Map());

  const { data, isLoading, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["ngsi-entities", types],
    enabled: types.length > 0,
    queryFn: async ({ signal }) => {
      const results = await Promise.all(
        types.map((type) => getEntities({ limit: 200, type }, signal)),
      );
      return results.flat();
    },
    refetchInterval: pollingPaused ? false : 15000,
  });

  const featureCollection: FeatureCollection = useMemo(() => {
    return toFeatureCollection(data ?? []);
  }, [data]);

  const filteredFeatureCollection: FeatureCollection = useMemo(() => {
    if (rangeStart === undefined) return featureCollection;
    const windowStart = rangeStart;
    const windowEnd = Date.now();
    const features = featureCollection.features.filter((feature) => {
      const dateObserved = feature.properties.dateObserved;
      if (!dateObserved) return true;
      const timestamp = Date.parse(dateObserved);
      if (Number.isNaN(timestamp)) return true;
      return timestamp >= windowStart && timestamp <= windowEnd;
    });

    return {
      type: "FeatureCollection",
      features,
    };
  }, [featureCollection, rangeStart]);

  const fitToAllEntities = useCallback((): boolean => {
    const map = mapRef.current;
    if (!map) return false;

    let bounds: L.LatLngBounds | null = null;
    for (const layer of layerGroupsRef.current.values()) {
      const layerBounds = layer.getBounds();
      if (!layerBounds.isValid()) continue;
      bounds = bounds ? bounds.extend(layerBounds) : layerBounds;
    }

    if (!bounds) return false;
    map.fitBounds(bounds.pad(0.2));
    return true;
  }, []);

  useEffect(() => {
    if (!fitSignal) return;
    fitToAllEntities();
  }, [fitSignal, fitToAllEntities]);

  useEffect(() => {
    if (!refreshSignal) return;
    refetch();
  }, [refreshSignal, refetch]);

  useEffect(() => {
    if (!onFetchMeta) return;
    onFetchMeta({
      lastFetchedAt: dataUpdatedAt > 0 ? dataUpdatedAt : undefined,
      entityCount: data?.length ?? 0,
    });
  }, [data, dataUpdatedAt, onFetchMeta]);

  useEffect(() => {
    if (!onObservedRange) return;
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const feature of featureCollection.features) {
      const dateObserved = feature.properties.dateObserved;
      if (!dateObserved) continue;
      const timestamp = Date.parse(dateObserved);
      if (Number.isNaN(timestamp)) continue;
      if (timestamp < min) min = timestamp;
      if (timestamp > max) max = timestamp;
    }
    if (Number.isFinite(min) && Number.isFinite(max)) {
      onObservedRange({ min, max });
    }
  }, [featureCollection, onObservedRange]);

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 12,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;
    layerControlRef.current = L.control
      .layers({}, {}, { position: "bottomleft", collapsed: false })
      .addTo(map);

    const cleanup = () => {
      map.remove();
      mapRef.current = null;
      layerControlRef.current = null;
      layerGroupsRef.current.clear();
      userMarkerRef.current = null;
      shouldFitOnDataRef.current = false;
      didInitialFitRef.current = false;
    };

    if (!("geolocation" in navigator)) {
      shouldFitOnDataRef.current = true;
      return cleanup;
    }

    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        const { latitude, longitude } = position.coords;
        map.setView([latitude, longitude], 12, { animate: true });
        shouldFitOnDataRef.current = false;
        if (!userMarkerRef.current) {
          userMarkerRef.current = L.circleMarker([latitude, longitude], {
            radius: 7,
            color: "#38bdf8",
            fillColor: "#38bdf8",
            fillOpacity: 0.9,
          }).addTo(map);
        } else {
          userMarkerRef.current.setLatLng([latitude, longitude]);
        }
      },
      () => {
        if (cancelled) return;
        shouldFitOnDataRef.current = true;
        if (!didInitialFitRef.current) {
          if (fitToAllEntities()) {
            didInitialFitRef.current = true;
          }
        }
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 5_000 },
    );

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [fitToAllEntities]);

  useEffect(() => {
    const map = mapRef.current;
    const layerControl = layerControlRef.current;
    if (!map || !layerControl) return;

    const layerGroups = layerGroupsRef.current;
    const typesWithData = new Set(
      filteredFeatureCollection.features.map((feature) => feature.properties.type),
    );

    for (const [type, layer] of layerGroups.entries()) {
      if (!typesWithData.has(type)) {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
        layerControl.removeLayer(layer);
        layerGroups.delete(type);
      }
    }

    for (const type of types) {
      if (!typesWithData.has(type)) continue;
      if (layerGroups.has(type)) continue;

      const typeColor = hashColor(type);
      const layer = L.geoJSON([], {
        style: (feature) => styleFeature(feature, typeColor),
        pointToLayer: (feature, latlng) => {
          const props = feature?.properties as
            | { type?: unknown; attributes?: Array<{ key?: unknown; value?: unknown }> }
            | undefined;
          const entityType = typeof props?.type === "string" ? props.type : type;
          let iconColor = typeColor;
          if (entityType === "WeatherObserved" && props?.attributes) {
            const temperature = getTemperatureValue(props.attributes);
            if (temperature !== null) {
              iconColor = weatherTemperatureColor(temperature);
            }
          }
          const icon = getIconForType(entityType, iconColor, iconCacheRef.current);
          return L.marker(latlng, { icon });
        },
        onEachFeature: (feature, leafletLayer) => {
          const props = feature.properties as
            | {
                label?: unknown;
                status?: unknown;
                type?: unknown;
                dateObserved?: unknown;
                attributes?: Array<{ key?: unknown; value?: unknown; unitCode?: unknown }>;
              }
            | undefined;
          const label = escapeHtml(typeof props?.label === "string" ? props.label : "Unknown");
          const entityType = escapeHtml(typeof props?.type === "string" ? props.type : "Entity");
          const attributes = Array.isArray(props?.attributes) ? props.attributes : [];
          const attributeLines = attributes
            .filter(
              (attribute) => typeof attribute.key === "string" && attribute.value !== undefined,
            )
            .map((attribute) => {
              const key = escapeHtml(attribute.key as string);
              const value = escapeHtml(String(attribute.value ?? ""));
              const unitCode =
                typeof attribute.unitCode === "string" ? escapeHtml(attribute.unitCode) : "";
              const suffix = unitCode ? (unitCode === "m" ? unitCode : ` ${unitCode}`) : "";
              return `<div style=\\\"font-size: 12px;\\\">${key}: ${value}${suffix}</div>`;
            })
            .join("");
          leafletLayer.bindPopup(
            `<div style=\"font-family: Inter, sans-serif;\"><div style=\"font-weight: 600; font-size: 14px;\">${label}</div><div style=\"font-size: 12px; opacity: 0.7;\">${entityType}</div>${attributeLines}</div>`,
          );
        },
      });

      layer.addTo(map);
      layerControl.addOverlay(layer, escapeHtml(type));
      layerGroups.set(type, layer);
    }
  }, [filteredFeatureCollection.features, types]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const layerGroups = layerGroupsRef.current;
    for (const layer of layerGroups.values()) {
      layer.clearLayers();
    }

    const featuresByType = filteredFeatureCollection.features.reduce<
      Record<string, FeatureCollection>
    >((acc, feature) => {
      const type = feature.properties.type;
      acc[type] ??= { type: "FeatureCollection", features: [] };
      acc[type].features.push(feature);
      return acc;
    }, {});

    for (const [type, layer] of layerGroups.entries()) {
      const features = featuresByType[type];
      if (!features) continue;
      layer.addData(features as GeoJSON.GeoJsonObject);
    }

    if (shouldFitOnDataRef.current && !didInitialFitRef.current) {
      if (fitToAllEntities()) {
        didInitialFitRef.current = true;
      }
    }
  }, [filteredFeatureCollection, fitToAllEntities]);

  return (
    <div className="map-panel relative h-full w-full rounded-2xl border border-base-300 shadow-soft">
      <div className="absolute left-6 top-6 z-[400] flex items-center gap-3">
        <div className="badge badge-primary badge-outline">Live</div>
        {isLoading && <span className="text-xs text-slate-300">Hämtar data...</span>}
        {error && <span className="text-xs text-error">API-fel</span>}
      </div>

      <div className="absolute right-6 top-6 z-[400] flex items-center gap-2">
        <button className="btn btn-sm btn-ghost" type="button">
          Filter
        </button>
        <button className="btn btn-sm btn-ghost" type="button">
          Heatmap
        </button>
        <button className="btn btn-sm btn-primary" type="button">
          Export
        </button>
      </div>

      <div ref={mapContainerRef} className="h-full w-full rounded-2xl" />
    </div>
  );
};
