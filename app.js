
const DELHI = { lat: 28.6139, lon: 77.2090 };

function getWeatherInfo(code) {
  const map = {
    0:  { desc: 'Clear Sky',             emoji: '☀️'  },
    1:  { desc: 'Mostly Clear',          emoji: '🌤️' },
    2:  { desc: 'Partly Cloudy',         emoji: '⛅'  },
    3:  { desc: 'Overcast',              emoji: '☁️'  },
    45: { desc: 'Foggy',                 emoji: '🌫️' },
    48: { desc: 'Icy Fog',               emoji: '🌫️' },
    51: { desc: 'Light Drizzle',         emoji: '🌦️' },
    53: { desc: 'Moderate Drizzle',      emoji: '🌦️' },
    55: { desc: 'Heavy Drizzle',         emoji: '🌧️' },
    61: { desc: 'Slight Rain',           emoji: '🌧️' },
    63: { desc: 'Moderate Rain',         emoji: '🌧️' },
    65: { desc: 'Heavy Rain',            emoji: '🌧️' },
    71: { desc: 'Slight Snowfall',       emoji: '❄️'  },
    73: { desc: 'Moderate Snowfall',     emoji: '❄️'  },
    75: { desc: 'Heavy Snowfall',        emoji: '❄️'  },
    80: { desc: 'Slight Rain Showers',   emoji: '🌦️' },
    81: { desc: 'Moderate Rain Showers', emoji: '🌧️' },
    82: { desc: 'Violent Rain Showers',  emoji: '⛈️'  },
    95: { desc: 'Thunderstorm',          emoji: '⛈️'  },
    96: { desc: 'Thunderstorm + Hail',   emoji: '⛈️'  },
    99: { desc: 'Thunderstorm + Hail',   emoji: '⛈️'  },
  };
  return map[code] || { desc: 'Unknown', emoji: '🌡️' };
}

// ── Wind degree
function windDir(deg) {
  if (deg == null) return 'N/A';
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round((deg % 360) / 45) % 8];
}

// ── Format ISO datetime to HH:MM ──
function fmtTime(iso) {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

async function fetchWeather(lat, lon) {
  const params = [
    `latitude=${lat}`,
    `longitude=${lon}`,
    `current=temperature_2m,relative_humidity_2m,apparent_temperature,`,
    `precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,cloud_cover,visibility`,
    `&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset`,
    `&timezone=auto`,
    `&forecast_days=1`,
    `&wind_speed_unit=kmh`,
  ].join('');

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,cloud_cover,visibility` +
    `&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset` +
    `&timezone=auto&forecast_days=1&wind_speed_unit=kmh`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

// ── Reverse geocode using Nominatim (no API key!) ──
async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'en-IN' } }
    );
    const data = await res.json();
    const a = data.address;
    return a.city || a.town || a.village || a.county || a.state || 'Your Location';
  } catch {
    return 'Your Location';
  }
}

// ── Build card HTML ──
function buildCard(data, cityName, isUser, lat, lon) {
  const c    = data.current;
  const d    = data.daily;
  const info = getWeatherInfo(c.weather_code);

  const temp     = Math.round(c.temperature_2m);
  const feels    = Math.round(c.apparent_temperature);
  const humidity = Math.round(c.relative_humidity_2m);
  const pressure = Math.round(c.surface_pressure);
  const windSpd  = Math.round(c.wind_speed_10m);
  const wDir     = windDir(c.wind_direction_10m);
  const clouds   = Math.round(c.cloud_cover);
  const vis      = (c.visibility != null) ? (c.visibility / 1000).toFixed(1) + ' km' : 'N/A';
  const tempMax  = Math.round(d.temperature_2m_max[0]);
  const tempMin  = Math.round(d.temperature_2m_min[0]);
  const sunrise  = fmtTime(d.sunrise[0]);
  const sunset   = fmtTime(d.sunset[0]);
  const precip   = c.precipitation != null ? c.precipitation + ' mm' : '0 mm';

  const dotClass   = isUser ? 'badge-dot--blue' : 'badge-dot--orange';
  const badgeLabel = isUser ? '📍 My Location' : '🏙️ Delhi';

  return `
    <div class="card-badge">
      <span class="badge-dot ${dotClass}"></span>
      ${badgeLabel}
    </div>

    <div class="city-name">${cityName}</div>
    <div class="city-coords">${parseFloat(lat).toFixed(3)}° N &nbsp;&nbsp; ${parseFloat(lon).toFixed(3)}° E</div>

    <div class="temp-row">
      <div class="temp-value">${temp}</div>
      <div class="temp-unit">°C</div>
      <div class="weather-emoji">${info.emoji}</div>
    </div>

    <div class="minmax-row">
      <span>↑ <b>${tempMax}°</b></span>
      <span>↓ <b>${tempMin}°</b></span>
      <span style="margin-left:6px; font-size:0.75rem;">Feels ${feels}°C</span>
    </div>

    <div class="weather-desc">${info.desc}</div>

    <div class="stats-grid">

      <div class="stat-box">
        <span class="stat-icon">💧</span>
        <div class="stat-label">Humidity</div>
        <div class="stat-value">${humidity}%</div>
        <div class="stat-bar-bg">
          <div class="stat-bar-fill" style="width:${humidity}%"></div>
        </div>
      </div>

      <div class="stat-box">
        <span class="stat-icon">💨</span>
        <div class="stat-label">Wind Speed</div>
        <div class="stat-value">${windSpd} km/h</div>
        <div class="stat-label" style="margin-top:4px; color:var(--muted);">Direction: ${wDir}</div>
      </div>

      <div class="stat-box">
        <span class="stat-icon">👁️</span>
        <div class="stat-label">Visibility</div>
        <div class="stat-value">${vis}</div>
      </div>

      <div class="stat-box">
        <span class="stat-icon">🌡️</span>
        <div class="stat-label">Pressure</div>
        <div class="stat-value">${pressure} hPa</div>
      </div>

      <div class="stat-box">
        <span class="stat-icon">☁️</span>
        <div class="stat-label">Cloud Cover</div>
        <div class="stat-value">${clouds}%</div>
        <div class="stat-bar-bg">
          <div class="stat-bar-fill" style="width:${clouds}%"></div>
        </div>
      </div>

      <div class="stat-box">
        <span class="stat-icon">🌧️</span>
        <div class="stat-label">Precipitation</div>
        <div class="stat-value">${precip}</div>
      </div>

      <div class="stat-box">
        <span class="stat-icon">🌅</span>
        <div class="stat-label">Sunrise</div>
        <div class="stat-value">${sunrise}</div>
      </div>

      <div class="stat-box">
        <span class="stat-icon">🌇</span>
        <div class="stat-label">Sunset</div>
        <div class="stat-value">${sunset}</div>
      </div>

    </div>
  `;
}

// ── UI helpers ──
function showLoader(id) {
  document.getElementById(`loader-${id}`).classList.remove('hidden');
  document.getElementById(`content-${id}`).classList.add('hidden');
  document.getElementById(`content-${id}`).innerHTML = '';
  const prev = document.getElementById(`error-${id}`);
  if (prev) prev.remove();
}

function showContent(id, html) {
  document.getElementById(`loader-${id}`).classList.add('hidden');
  const el = document.getElementById(`content-${id}`);
  el.classList.remove('hidden');
  el.innerHTML = html;
}

function showError(id, msg) {
  document.getElementById(`loader-${id}`).classList.add('hidden');
  const card = document.getElementById(`card-${id}`);
  let el = document.getElementById(`error-${id}`);
  if (!el) {
    el = document.createElement('div');
    el.id = `error-${id}`;
    el.className = 'card-error';
    card.appendChild(el);
  }
  el.innerHTML = `<div class="error-emoji">⚠️</div><div class="error-msg">${msg}</div>`;
}

// ── Main ──
async function fetchBoth() {
  showLoader('user');
  showLoader('delhi');
  document.getElementById('updated-time').textContent = '';

  // Delhi — always works, no API key
  fetchWeather(DELHI.lat, DELHI.lon)
    .then(data => showContent('delhi', buildCard(data, 'Delhi', false, DELHI.lat, DELHI.lon)))
    .catch(err  => {
      console.error('Delhi error:', err);
      showError('delhi', 'Delhi ka data nahi aaya. Internet check karein.');
    });

  // User location
  if (!navigator.geolocation) {
    showError('user', 'Aapka browser geolocation support nahi karta.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      const { latitude: lat, longitude: lon } = coords;
      try {
        const [weatherData, cityName] = await Promise.all([
          fetchWeather(lat, lon),
          reverseGeocode(lat, lon),
        ]);
        showContent('user', buildCard(weatherData, cityName, true, lat, lon));
        const now = new Date();
        document.getElementById('updated-time').textContent =
          `Last updated: ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}  ·  ${now.toLocaleDateString('en-IN')}`;
      } catch (err) {
        console.error('User weather error:', err);
        showError('user', 'Weather data nahi mila. Internet check karein.');
      }
    },
    (err) => {
      const msgs = {
        1: 'Location permission deny ki gayi.\nBrowser settings → Allow Location karein.',
        2: 'GPS signal nahi mila. Device location ON karein.',
        3: 'Location timeout. Dobara try karein.',
      };
      showError('user', msgs[err.code] || 'Location access nahi ho saka.');
    },
    { timeout: 15000, maximumAge: 60000, enableHighAccuracy: false }
  );
}

document.getElementById('refreshBtn').addEventListener('click', fetchBoth);
fetchBoth();