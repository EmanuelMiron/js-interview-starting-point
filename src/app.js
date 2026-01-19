/**
 * Fetch with retry logic. Retries 5xx errors.
 * @param {string} url
 * @param {Object} options
 * @param {number} retries
 * @returns {any}
 */
async function fetchWithRetry(url, options, retries = 3) {
  try {
    const res = await fetch(url, options);

    if (!res.ok) {
      const isServerError = res.status >= 500;
      const err = new Error(isServerError ? `Server Error: ${res.status}` : `HTTP Error: ${res.status}`);
      err.status = res.status;
      err.isServerError = isServerError;
      throw err;
    }

    return await res.json();
  } catch (err) {
    if (err.isServerError && retries > 0) {
      console.warn(`Retrying... attempts left: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, 500));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw err;
  }
}

/**
 * Calculate Euclidean distance on a flat plane
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number}
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const dx = lat2 - lat1;
  const dy = lng2 - lng1;
  return Math.sqrt(dx ** 2 + dy ** 2);
}

/**
 * Create request options object with default headers
 * @param {string} method
 * @param {Object} additionalHeaders
 * @returns {Object}
 */
function createRequestOptions(method = 'GET', additionalHeaders = {}) {
  return {
    method,
    headers: {
      'Accept': 'application/json',
      ...additionalHeaders
    }
  };
}

/**
 * Fetch authentication token from API
 * @returns {string} - Authentication token
 */
async function fetchAuthToken() {
  const url = 'https://api-challenge.agilefreaks.com/v1/tokens';
  const data = await fetchWithRetry(url, createRequestOptions('POST'));
  if (!data.token) {
    throw new Error('No token in response');
  }
  return data.token;
}

/**
 * Fetch coffee shops from API
 * @param {string} token
 * @returns {Array}
 */
async function fetchCoffeeShops(token) {
  const url = `https://api-challenge.agilefreaks.com/v1/coffee_shops?token=${token}`;
  return fetchWithRetry(url, createRequestOptions());
}

/**
 * Get nearest coffee shops sorted by distance from given position
 * @param {Object} position
 * @param {Number} position.lat
 * @param {Number} position.lng
 *
 * @returns {Array}
 */
export async function getNearestShops(position) {
  if (position?.lat === undefined || position?.lng === undefined) {
    throw new Error('Invalid position: lat and long coordinates required');
  }

  const token = await fetchAuthToken();
  const shops = await fetchCoffeeShops(token);

  const shopsWithDistances = shops.map(shop => {
    const shopLat = parseFloat(shop.x);
    const shopLng = parseFloat(shop.y);
    const distance = calculateDistance(
      position.lat,
      position.lng,
      shopLat,
      shopLng
    );

    return {
      ...shop,
      lat: shopLat,
      lng: shopLng,
      distance
    };
  });

  return shopsWithDistances.sort((a, b) => a.distance - b.distance).slice(0, 3);
}

export {
  calculateDistance,
  fetchWithRetry,
  fetchAuthToken,
  fetchCoffeeShops
};
