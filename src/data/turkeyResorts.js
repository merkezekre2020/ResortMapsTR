import staticResorts from './resortsData.json';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
];

// Türkiye bounding box: lat 36-42, lon 26-45
const OVERPASS_QUERY = `
[out:json][timeout:120];
(
  node["tourism"="resort"](36,26,42,45);
  way["tourism"="resort"](36,26,42,45);
  node["leisure"="resort"](36,26,42,45);
  way["leisure"="resort"](36,26,42,45);
  node["tourism"="hotel"](36,26,42,45);
  way["tourism"="hotel"](36,26,42,45);
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

function isInTurkey(lat, lon) {
  return lat >= 35.5 && lat <= 42.5 && lon >= 25.5 && lon <= 45;
}

function parseElement(element) {
  const tags = element.tags || {};
  const coords = extractCoordinates(element);
  if (!coords) return null;
  if (!isInTurkey(coords.lat, coords.lon)) return null;

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

async function fetchFromEndpoint(endpoint, signal) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(OVERPASS_QUERY.trim()),
    signal,
  });

  if (!response.ok) {
    throw new Error(`${endpoint}: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();

  // Bazı mirror'lar HTML hata döndürebilir
  if (text.startsWith('<') || text.startsWith('This')) {
    throw new Error(`${endpoint}: HTML error response`);
  }

  return JSON.parse(text);
}

export async function fetchTurkeyResorts({ signal } = {}) {
  let lastError;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const data = await fetchFromEndpoint(endpoint, signal);
      const resorts = parseOverpassResponse(data);
      if (resorts.length === 0) throw new Error('No data returned');
      return {
        resorts,
        lastUpdated: new Date().toISOString().slice(0, 10),
        source: 'live',
      };
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      lastError = err;
      console.warn(`Failed with ${endpoint}:`, err.message);
    }
  }

  throw lastError || new Error('All endpoints failed');
}

export function getStaticResorts() {
  return { ...staticResorts, source: 'static' };
}

export default fetchTurkeyResorts;
