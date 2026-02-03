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
        dateObserved: entity.dateObserved?.value,
      },
    }));

  return {
    type: "FeatureCollection",
    features,
  };
};
