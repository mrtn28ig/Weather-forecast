document.addEventListener('DOMContentLoaded', () => {
  const apiKey = '2535503ee6b393eef26b2ca3ec8b9ed8';

  // Clock
  function updateDateTime() {
    const now = new Date();
    document.getElementById('datetime').textContent =
      now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
  }
  updateDateTime();
  setInterval(updateDateTime, 1000);

  document.getElementById('getWeatherBtn').addEventListener('click', () => {
    const city = document.getElementById('cityInput').value.trim();
    if (city) getWeather(city);
  });

  document.getElementById('getLocationBtn').addEventListener('click', () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        await getWeatherByCoords(lat, lon);
      });
    } else {
      alert("Geolocation not supported.");
    }
  });

  async function getWeather(city) {
    const geoURL = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`;
    const geoRes = await fetch(geoURL);
    const geoData = await geoRes.json();
    if (geoData.length === 0) {
      document.getElementById('weatherResult').innerHTML = "<p>City not found</p>";
      return;
    }
    const { lat, lon, name, country } = geoData[0];
    await displayWeather(lat, lon, `${name}, ${country}`);
  }

  async function getWeatherByCoords(lat, lon) {
    await displayWeather(lat, lon, "Your Location");
  }

  async function displayWeather(lat, lon, locationName) {
    const weatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    const [weatherRes, forecastRes] = await Promise.all([
      fetch(weatherURL),
      fetch(forecastURL)
    ]);

    const weatherData = await weatherRes.json();
    const forecastData = await forecastRes.json();

    const id = weatherData.weather[0].id;
    const audio = document.getElementById('weatherAudio');

    if (id >= 200 && id < 300) {
      audio.src = 'sound/thunder.mp3';
    } else if (id >= 300 && id < 600) {
      audio.src = 'sound/rain.mp3';
    } else if (id === 800) {
      audio.src = 'sound/clear.mp3';
    } else {
      audio.src = '';
    }
    if (audio.src) {
      audio.play().catch(() => {});
    }

    const weatherHTML = `
      <h2>${locationName}</h2>
      <div class="weather-summary">
        <img src="https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png" />
        <div>
          <div class="temp">${Math.round(weatherData.main.temp)}°C</div>
          <div class="desc">${weatherData.weather[0].description}</div>
        </div>
      </div>
      <div class="weather-details">
        <div>💧 Humidity<br>${weatherData.main.humidity}%</div>
        <div>🌬️ Wind<br>${weatherData.wind.speed} m/s</div>
        <div>🌡️ Feels Like<br>${Math.round(weatherData.main.feels_like)}°C</div>
        <div>🧭 Pressure<br>${weatherData.main.pressure} hPa</div>
      </div>
    `;
    document.getElementById('weatherResult').innerHTML = weatherHTML;

    const forecastCards = forecastData.list.filter((_, i) => i % 8 === 0).slice(0, 6).map(day => {
      const date = new Date(day.dt * 1000);
      const dayName = date.toLocaleDateString(undefined, { weekday: 'short' });
      const icon = day.weather[0].icon;
      const temp = Math.round(day.main.temp);
      return `
        <div class="forecast-card">
          <h4>${dayName}</h4>
          <img src="https://openweathermap.org/img/wn/${icon}@2x.png" />
          <p>${temp}°C</p>
        </div>
      `;
    }).join('');
    document.getElementById('forecast').innerHTML = forecastCards;
  }
});
