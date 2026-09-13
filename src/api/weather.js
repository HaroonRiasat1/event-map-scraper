/**
 * Open-Meteo — current conditions for the searched city.
 *
 * Free, keyless, and a genuinely useful signal when you are deciding whether
 * to go to something outdoors tonight.
 *
 * @see https://open-meteo.com/en/docs
 */

import { API, CACHE_TTL_MS } from '../constants/config.js';
import { withCache } from '../utils/cache.js';
import { buildUrl } from '../utils/url.js';
import { request } from './client.js';

/**
 * WMO weather codes, collapsed to the handful of buckets we display.
 * @see https://open-meteo.com/en/docs — "Weather variable documentation"
 */
const WMO_CODES = [
  [[0], 'Clear', '☀️'],
  [[1, 2], 'Partly cloudy', '⛅'],
  [[3], 'Overcast', '☁️'],
  [[45, 48], 'Fog', '🌫️'],
  [[51, 53, 55, 56, 57], 'Drizzle', '🌦️'],
  [[61, 63, 65, 66, 67, 80, 81, 82], 'Rain', '🌧️'],
  [[71, 73, 75, 77, 85, 86], 'Snow', '🌨️'],
  [[95, 96, 99], 'Thunderstorm', '⛈️'],
];

/**
 * @param {number} code
 * @returns {{ label: string, icon: string }}
 */
export function describeWeatherCode(code) {
  const match = WMO_CODES.find(([codes]) => codes.includes(code));
  return match ? { label: match[1], icon: match[2] } : { label: 'Unknown', icon: '🌡️' };
}

/**
 * @typedef {object} Weather
 * @property {number} temperature  °C
 * @property {number} windSpeed    km/h
 * @property {boolean} isDay
 * @property {string} label
 * @property {string} icon
 */

/**
 * @param {[number, number]} coordinates `[lat, lon]`
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<Weather | null>}
 */
export async function fetchWeather([lat, lon], { signal } = {}) {
  const url = buildUrl(API.openMeteo.baseUrl, {
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    current: 'temperature_2m,weather_code,wind_speed_10m,is_day',
    timezone: 'auto',
  });

  return withCache(
    'weather',
    `${lat.toFixed(2)},${lon.toFixed(2)}`,
    CACHE_TTL_MS.weather,
    async () => {
      const data = await request(url, { signal, source: 'open-meteo' });
      const current = data?.current;
      if (!current) return null;
      return {
        temperature: Math.round(current.temperature_2m),
        windSpeed: Math.round(current.wind_speed_10m),
        isDay: current.is_day === 1,
        ...describeWeatherCode(current.weather_code),
      };
    },
  );
}
