import staticResorts from './resortsData.json';

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

const OVERPASS_QUERY = `
[out:json][timeout:90];
area["ISO3166-1"="TR"]->.turkey;
(
  node["tourism"="resort"](area.turkey);
  way["tourism"="resort"](area.turkey);
  node["leisure"="resort"](area.turkey);
  way["leisure"="resort"](area.turkey);
  node["tourism"="hotel"](area.turkey);
  way["tourism"="hotel"](area.turkey);
);
out center;
`;

const PREFERRED_TAGS = [
  'tourism', 'leisure', 'stars', 'addr:city', 'addr:province',
  'addr:street', 'website', 'phone', 'email', 'description',
];

function resolveType(tags) {
  if (tags.tourism === 'resort' || tags.leisure === 'resort') return 'resort';
  if (tags.tourism === 'hotel') return 'hotel';
  if (tags.tourism === 'guest_house') return 'guest_house';
  return tags.tourism || tags.leisure || 'unknown';
}

function extractCoordinates(element) {
  if (element.type === 'node') {
    return { lat: element.lat, lon: element.lon };
  }
  if (element.center) {
    return { lat: element.center.lat, lon: element.center.lon };
  }
  return null;
}

function parseElement(element) {
  const tags = element.tags || {};
  const coords = extractCoordinates(element);
  if (!coords) return null;

  const filteredTags = {};
  for (const key of PREFERRED_TAGS) {
    if (tags[key]) filteredTags[key] = tags[key];
  }

  return {
    id: `${element.type}/${element.id}`,
    name: tags.name || '',
    lat: Math.round(coords.lat * 1e6) / 1e6,
    lon: Math.round(coords.lon * 1e6) / 1e6,
    type: resolveType(tags),
    tags: filteredTags,
    city: tags['addr:city'] || tags['addr:province'] || '',
  };
}

function parseOverpassResponse(data) {
  const elements = data.elements || [];
  return elements
    .map(parseElement)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

export async function fetchTurkeyResorts({ signal } = {}) {
  const params = new URLSearchParams({ data: OVERPASS_QUERY });

  const response = await fetch(`${OVERPASS_ENDPOINT}?${params}`, {
    method: 'GET',
    signal,
  });

  if (!response.ok) {
    throw new Error(`Overpass API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const resorts = parseOverpassResponse(data);

  return {
    resorts,
    lastUpdated: new Date().toISOString().slice(0, 10),
  };
}

export function getStaticResorts() {
  return staticResorts;
}

export default fetchTurkeyResorts;
