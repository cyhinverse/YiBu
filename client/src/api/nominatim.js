const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

const jsonFetch = async (url, { signal } = {}) => {
  const res = await fetch(url, {
    signal,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const err = new Error(`Request failed: ${res.status} ${res.statusText}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
};

export const searchLocation = (query, { signal } = {}) => {
  const url = `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(
    query
  )}&addressdetails=1&limit=5`;
  return jsonFetch(url, { signal });
};

export const reverseGeocode = ({ lat, lon }, { signal } = {}) => {
  const url = `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
  return jsonFetch(url, { signal });
};

