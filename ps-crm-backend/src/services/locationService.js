const reverseCache = new Map();
const forwardCache = new Map();

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

const getCached = (cache, key) => {
  const entry = cache.get(key);
  if (!entry || entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

const setCached = (cache, key, value) => {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
};

const fetchJson = async (url) => {
  if (typeof fetch !== 'function') return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'PS-CRM/1.0 location lookup',
      },
    });

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.warn('[Location lookup]', error.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const compactDisplayName = (displayName = '') => {
  const parts = displayName
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.slice(0, 4).join(', ') || displayName || 'Current location';
};

const pickWard = (address = {}) => (
  address.suburb ||
  address.neighbourhood ||
  address.quarter ||
  address.village ||
  address.town ||
  address.city_district ||
  address.county ||
  ''
);

const reverseGeocode = async (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  const cached = getCached(reverseCache, key);
  if (cached) return cached;

  const url = `${NOMINATIM_BASE_URL}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
  const data = await fetchJson(url);
  if (!data) return null;

  const result = {
    placeName: compactDisplayName(data.display_name),
    ward: pickWard(data.address),
    address: data.address || {},
  };

  setCached(reverseCache, key, result);
  return result;
};

const geocodeComplaintLocation = async (location = {}) => {
  const parts = [
    location.line1,
    location.line2,
    location.locality,
    location.ward,
    location.zone,
    'Delhi',
    'India',
  ]
    .map((part) => (part || '').trim())
    .filter(Boolean);

  if (parts.length <= 2) return null;

  const query = parts.join(', ');
  const cached = getCached(forwardCache, query.toLowerCase());
  if (cached) return cached;

  const url = `${NOMINATIM_BASE_URL}/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(query)}`;
  const data = await fetchJson(url);
  const match = Array.isArray(data) ? data[0] : null;
  if (!match) return null;

  const lat = Number(match.lat);
  const lon = Number(match.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const result = {
    type: 'Point',
    coordinates: [lon, lat],
  };

  setCached(forwardCache, query.toLowerCase(), result);
  return result;
};

module.exports = {
  reverseGeocode,
  geocodeComplaintLocation,
};
