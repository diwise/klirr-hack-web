import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useEffect, useMemo, useRef } from "react";
import { getEntities } from "./ngsiClient";
import { toFeatureCollection } from "./transformers";
import type { FeatureCollection } from "./types";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

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
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

type MapViewProps = {
  types: string[];
  selectedType: string;
  fromHoursBack: number;
  toHoursBack: number;
};

export const MapView = ({ types, selectedType, fromHoursBack, toHoursBack }: MapViewProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const layerControlRef = useRef<L.Control.Layers | null>(null);
  const layerGroupsRef = useRef<Map<string, L.GeoJSON>>(new Map());

  const { data, isLoading, error } = useQuery({
    queryKey: ["ngsi-entities", types],
    queryFn: async () => {
      if (types.length === 0) return [];
      const results = await Promise.all(types.map((type) => getEntities({ limit: 200, type })));
      return results.flat();
    },
    refetchInterval: 15000,
  });

  const featureCollection: FeatureCollection = useMemo(() => {
    return toFeatureCollection(data ?? []);
  }, [data]);

  const filteredFeatureCollection: FeatureCollection = useMemo(() => {
    const minHours = Math.min(fromHoursBack, toHoursBack);
    const maxHours = Math.max(fromHoursBack, toHoursBack);
    const windowStart = Date.now() - maxHours * 60 * 60 * 1000;
    const windowEnd = Date.now() - minHours * 60 * 60 * 1000;
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
  }, [featureCollection, fromHoursBack, toHoursBack]);

  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map("map", {
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
  }, []);

  const activeTypes = useMemo(() => {
    if (selectedType === "__all__") return types;
    return types.includes(selectedType) ? [selectedType] : [];
  }, [selectedType, types]);

  useEffect(() => {
    const map = mapRef.current;
    const layerControl = layerControlRef.current;
    if (!map || !layerControl) return;

    const activeSet = new Set(activeTypes);
    const layerGroups = layerGroupsRef.current;

    for (const type of types) {
      if (layerGroups.has(type)) continue;

      const typeColor = hashColor(type);
      const layer = L.geoJSON([], {
        style: (feature) => styleFeature(feature, typeColor),
        pointToLayer: (feature, latlng) => {
          const props = feature?.properties as { status?: unknown } | undefined;
          const status = typeof props?.status === "string" ? props.status : undefined;
          return L.circleMarker(latlng, {
            radius: 8,
            color: typeColor,
            fillColor: status ? statusColor(status) : typeColor,
            fillOpacity: 0.6,
          });
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
          const status = escapeHtml(typeof props?.status === "string" ? props.status : "ok");
          const dateObserved =
            typeof props?.dateObserved === "string" ? escapeHtml(props.dateObserved) : "";
          const dateLine = dateObserved
            ? `<div style=\\\"margin-top: 6px; font-size: 12px;\\\">Obs: ${dateObserved}</div>`
            : "";
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
            `<div style=\"font-family: Inter, sans-serif;\"><div style=\"font-weight: 600; font-size: 14px;\">${label}</div><div style=\"font-size: 12px; opacity: 0.7;\">${entityType}</div><div style=\"margin-top: 6px; font-size: 12px;\">Status: ${status}</div>${dateLine}${attributeLines}</div>`,
          );
        },
      });

      layer.addTo(map);
      layerControl.addOverlay(layer, type);
      layerGroups.set(type, layer);
    }

    for (const [type, layer] of layerGroups.entries()) {
      if (activeSet.has(type)) {
        if (!map.hasLayer(layer)) {
          layer.addTo(map);
        }
      } else if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    }
  }, [activeTypes, types]);

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
  }, [filteredFeatureCollection]);

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

      <div id="map" className="h-full w-full rounded-2xl" />
    </div>
  );
};
