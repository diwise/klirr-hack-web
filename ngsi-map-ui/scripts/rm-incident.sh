#!/usr/bin/env bash

set -euo pipefail

BASE_URL="https://klirr.diwise.io/ngsi-ld/v1"
CONTEXT_LINK='<https://raw.githubusercontent.com/diwise/context-broker/main/assets/jsonldcontexts/default-context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"'

echo "Hämtar Incident-entiteter..."

IDS=$(curl -s -X GET "${BASE_URL}/entities?type=Incident" \
  -H 'Accept: application/ld+json' \
  -H "Link: ${CONTEXT_LINK}" \
  | jq -r '.[].id')

if [[ -z "${IDS}" ]]; then
  echo "Inga Incident-entiteter hittades."
  exit 0
fi

echo "Följande entiteter kommer att tas bort:"
echo "${IDS}"

echo
echo "Tar bort entiteter..."

for ID in ${IDS}; do
  echo "Tar bort ${ID}"
  curl -s -X DELETE "${BASE_URL}/entities/${ID}" \
    -H "Link: ${CONTEXT_LINK}"
done

echo
echo "Klar."
