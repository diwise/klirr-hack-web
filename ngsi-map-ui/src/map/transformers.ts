import type { FeatureCollection, NgsiGeoProperty, NgsiLdEntity } from "./types";

const fallbackLabel = (entity: NgsiLdEntity) => {
  const name = entity.name as { value?: string } | undefined;
  return name?.value ?? entity.id.split(":").pop() ?? entity.id;
};

const hasPointLocation = (
  entity: NgsiLdEntity,
): entity is NgsiLdEntity & { location: NgsiGeoProperty } =>
  entity.location?.value?.type === "Point";

export const toFeatureCollection = (entities: NgsiLdEntity[]): FeatureCollection => {
  const features = entities.filter(hasPointLocation).map((entity) => ({
    type: "Feature" as const,
    geometry: entity.location.value,
    properties: {
      id: entity.id,
      type: entity.type,
      label: fallbackLabel(entity),
      status: (entity.status as { value?: string } | undefined)?.value,
    },
  }));

  return {
    type: "FeatureCollection",
    features,
  };
};
