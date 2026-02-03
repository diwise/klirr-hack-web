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

const statusColor = (status?: string) => {
  if (status === "active") return "#2dd4bf";
  if (status === "maintenance") return "#f59e0b";
  return "#60a5fa";
};

const styleFeature = (feature?: GeoJSON.Feature) => {
  const props = feature?.properties as { status?: unknown } | undefined;
  const status = typeof props?.status === "string" ? props.status : undefined;
  return {
    color: statusColor(status),
    weight: 2,
    fillOpacity: 0.35,
  };
};

export const MapView = () => {
  const mapRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["ngsi-entities"],
    queryFn: () => getEntities({ limit: 200 }),
    refetchInterval: 15000,
  });

  const featureCollection: FeatureCollection = useMemo(() => {
    return toFeatureCollection(data ?? []);
  }, [data]);

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

    const layer = L.geoJSON([], {
      style: styleFeature,
      pointToLayer: (feature, latlng) => {
        const props = feature?.properties as { status?: unknown } | undefined;
        const status = typeof props?.status === "string" ? props.status : undefined;
        return L.circleMarker(latlng, {
          radius: 8,
          color: statusColor(status),
          fillColor: statusColor(status),
          fillOpacity: 0.6,
        });
      },
      onEachFeature: (feature, leafletLayer) => {
        const props = feature.properties as
          | { label?: unknown; status?: unknown; type?: unknown }
          | undefined;
        const label = typeof props?.label === "string" ? props.label : "Unknown";
        const type = typeof props?.type === "string" ? props.type : "Entity";
        const status = typeof props?.status === "string" ? props.status : "ok";
        leafletLayer.bindPopup(
          `<div style=\"font-family: Inter, sans-serif;\"><div style=\"font-weight: 600; font-size: 14px;\">${label}</div><div style=\"font-size: 12px; opacity: 0.7;\">${type}</div><div style=\"margin-top: 6px; font-size: 12px;\">Status: ${status}</div></div>`,
        );
      },
    }).addTo(map);

    mapRef.current = map;
    geoJsonLayerRef.current = layer;
  }, []);

  useEffect(() => {
    const layer = geoJsonLayerRef.current;
    if (!layer) return;

    layer.clearLayers();
    layer.addData(featureCollection as GeoJSON.GeoJsonObject);

    if (featureCollection.features.length > 0 && mapRef.current) {
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds.pad(0.2));
      }
    }
  }, [featureCollection]);

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
