import type { FeatureCollection, NgsiGeoProperty, NgsiLdEntity } from "./types";

const fallbackLabel = (entity: NgsiLdEntity) => {
  const name = entity.name;
  return name?.value ?? entity.id.split(":").pop() ?? entity.id;
};

const hasPointLocation = (
  entity: NgsiLdEntity,
): entity is NgsiLdEntity & { location: NgsiGeoProperty } =>
  entity.location?.value?.type === "Point";

const isZeroCoordinate = (coordinates: [number, number]) =>
  coordinates[0] === 0 && coordinates[1] === 0;

const resolveObservedDate = (entity: NgsiLdEntity) => {
  const preferred =
    entity.type === "RoadAccident" || entity.type === "RoadAccicent"
      ? (entity.accidentDate?.value ?? entity.dateObserved?.value)
      : entity.type === "CityWork"
        ? (entity.endDate?.value ?? entity.dateObserved?.value)
        : entity.dateObserved?.value;

  if (typeof preferred === "string") {
    return preferred;
  }

  return preferred?.["@value"];
};

const asStringValue = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object") {
    const typedValue = value as { "@value"?: unknown };
    if (typeof typedValue["@value"] === "string" || typeof typedValue["@value"] === "number") {
      return String(typedValue["@value"]);
    }
  }
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => asStringValue(item))
      .filter((item): item is string => typeof item === "string" && item.length > 0);
    return parts.length > 0 ? parts.join(", ") : null;
  }
  return null;
};

const extractAttributes = (entity: NgsiLdEntity) => {
  const excludedKeys = new Set(["id", "type", "location"]);
  return Object.entries(entity)
    .filter(([key, value]) => {
      if (excludedKeys.has(key)) return false;
      if (!value || typeof value !== "object") return false;
      const typedValue = value as { type?: string; value?: unknown };
      return typedValue.type === "Property" && typedValue.value !== undefined;
    })
    .map(([key, value]) => {
      const typedValue = value as {
        value?: unknown;
        unitCode?: unknown;
      };
      const unitRaw = typedValue.unitCode;
      const unitCode =
        typeof unitRaw === "string"
          ? unitRaw
          : typeof (unitRaw as { value?: unknown })?.value === "string"
            ? (unitRaw as { value?: string }).value
            : undefined;
      return {
        key,
        value: asStringValue(typedValue.value) ?? "",
        unitCode,
      };
    })
    .filter((entry) => entry.value.length > 0);
};

export const toFeatureCollection = (entities: NgsiLdEntity[]): FeatureCollection => {
  const features = entities
    .filter(hasPointLocation)
    .filter((entity) => !isZeroCoordinate(entity.location.value.coordinates))
    .map((entity) => ({
      type: "Feature" as const,
      geometry: entity.location.value,
      properties: {
        id: entity.id,
        type: entity.type,
        label: fallbackLabel(entity),
        status: entity.status?.value,
        dateObserved: resolveObservedDate(entity),
        attributes: extractAttributes(entity),
      },
    }));

  return {
    type: "FeatureCollection",
    features,
  };
};
