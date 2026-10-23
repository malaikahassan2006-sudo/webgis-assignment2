// Initialize Leaflet Map centered over Islamabad / Rawalpindi region
const map = L.map('map').setView([33.6844, 73.0479], 8);

// Add OpenStreetMap Tile Layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// WeatherAPI Credentials
const API_KEY = 'e7aad7016fd3470288e100927261210';
const BASE_URL = 'https://api.weatherapi.com/v1/current.json';

// Layer Group for dynamic map markers
let markerGroup = L.layerGroup().addTo(map);
let loadedWeatherData = []; // Store retrieved data for live filtering

// DOM Elements
const citySelect = document.getElementById('city-select');
const searchInput = document.getElementById('search-input');
const fetchBtn = document.getElementById('fetch-btn');
const statusMessage = document.getElementById('status-message');
const featureDetails = document.getElementById('feature-details');

// Fetch Live Weather Data from WeatherAPI.com
async function fetchWeatherData() {
    const selectedCity = citySelect.value;
    const requestUrl = `${BASE_URL}?key=${API_KEY}&q=${encodeURIComponent(selectedCity)}&aqi=no`;

    statusMessage.textContent = `Fetching weather for ${selectedCity}...`;
    statusMessage.className = "status loading";

    try {
        const response = await fetch(requestUrl);

        if (!response.ok) {
            throw new Error(`API Error! Status: ${response.status}`);
        }

        const data = await response.json();
        
        // Add to our global data array if not already fetched
        const existingIndex = loadedWeatherData.findIndex(item => item.location.name.toLowerCase() === data.location.name.toLowerCase());
        if (existingIndex !== -1) {
            loadedWeatherData[existingIndex] = data;
        } else {
            loadedWeatherData.push(data);
        }

        statusMessage.textContent = `Successfully loaded weather for ${data.location.name}.`;
        statusMessage.className = "status success";

        renderMapMarkers(loadedWeatherData);
        
        // Pan map view to selected city coordinates
        map.flyTo([data.location.lat, data.location.lon], 11);

    } catch (error) {
        console.error("Fetch Error:", error);
        statusMessage.textContent = "Error loading weather data. Please check connection.";
        statusMessage.className = "status error";
    }
}

// Render Weather Markers on Map
function renderMapMarkers(dataList) {
    markerGroup.clearLayers();

    dataList.forEach(data => {
        const lat = data.location.lat;
        const lon = data.location.lon;
        const cityName = data.location.name;
        const region = data.location.region;
        const tempC = data.current.temp_c;
        const conditionText = data.current.condition.text;
        const iconUrl = "https:" + data.current.condition.icon;

        // Create Marker
        const marker = L.marker([lat, lon]);

        // Dynamic Popup Content
        const popupHTML = `
            <div style="text-align: center;">
                <h4>${cityName}, ${region}</h4>
                <img src="${iconUrl}" alt="${conditionText}" class="weather-icon-img" />
                <p><b>${tempC} °C</b> - ${conditionText}</p>
            </div>
        `;
        marker.bindPopup(popupHTML);

        // Sidebar panel update on marker click
        marker.on('click', () => {
            displayDetailsPanel(data);
        });

        markerGroup.addLayer(marker);
    });
}

// Update Information Panel in Sidebar
function displayDetailsPanel(data) {
    const loc = data.location;
    const cur = data.current;

    const html = `
        <p><strong>City:</strong> ${loc.name}, ${loc.country}</p>
        <p><strong>Coordinates:</strong> ${loc.lat}, ${loc.lon}</p>
        <p><strong>Temperature:</strong> ${cur.temp_c} °C (Feels like ${cur.feelslike_c} °C)</p>
        <p><strong>Condition:</strong> ${cur.condition.text}</p>
        <p><strong>Humidity:</strong> ${cur.humidity}%</p>
        <p><strong>Wind Speed:</strong> ${cur.wind_kph} km/h (${cur.wind_dir})</p>
        <p><strong>Last Updated:</strong> ${cur.last_updated}</p>
    `;

    featureDetails.innerHTML = html;
}

// Interactive Client-Side Search Filter
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
        renderMapMarkers(loadedWeatherData);
        return;
    }

    const filtered = loadedWeatherData.filter(item => 
        item.location.name.toLowerCase().includes(query) ||
        item.location.region.toLowerCase().includes(query)
    );

    renderMapMarkers(filtered);
    statusMessage.textContent = `Showing ${filtered.length} matching marker(s).`;
});

// Button Event Listener
fetchBtn.addEventListener('click', fetchWeatherData);

// Fetch default city on load
fetchWeatherData();