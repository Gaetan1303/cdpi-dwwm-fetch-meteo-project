/*******************************************************
 * 0. CONFIG & UTILITAIRES
 *******************************************************/
const WEATHER_ICONS = {
  0:  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2600.png",
  1:  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/26c5.png",
  2:  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2601.png",
  3:  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2601.png",
  45: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f32b.png",
  48: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f32b.png",
  51: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4a7.png",
  53: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4a7.png",
  55: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4a7.png",
  61: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f327.png",
  63: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f327.png",
  65: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f327.png",
  71: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2744.png",
  73: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2744.png",
  75: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2744.png",
  95: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/26c8.png",
  96: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/26c8.png",
  99: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/26c8.png",
};

/*******************************************************
 * 1. GÉOLOCALISATION
 *******************************************************/
function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) reject("Géolocalisation non supportée.");
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => reject(err.message),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

/*******************************************************
 * 2. GÉOCODING + AUTOCOMPLÉTION
 *******************************************************/
let currentSuggestions = []; // tableau des objets ville en cours

async function fetchCities(fragment) {
  if (fragment.length < 2) return;
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(fragment)}&count=8&language=fr&format=json`;
  const res = await fetch(url);
  if (!res.ok) return;
  const json = await res.json();
  currentSuggestions = json.results || [];
  fillDatalist(currentSuggestions);
}

function fillDatalist(list) {
  const dataList = document.getElementById("cityList");
  dataList.innerHTML = "";
  list.forEach(c => {
    const opt = document.createElement("option");
    opt.value = `${c.name}, ${c.admin1}, ${c.country}`;
    dataList.appendChild(opt);
  });
}

/*******************************************************
 * 3. MÉTÉO
 *******************************************************/
async function getWeather({ lat, lon }) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur réseau météo");
  const json = await res.json();
  return json.current_weather;
}

/*******************************************************
 * 4. UI
 *******************************************************/
const cityNameEl  = document.getElementById("cityName");
const tempEl      = document.getElementById("temperature");
const descEl      = document.getElementById("description");
const iconEl      = document.getElementById("weatherIcon");
const weatherSec  = document.getElementById("weather");
const choiceBox   = document.getElementById("choiceBox");

function codeToText(code) {
  const map = {
    0: "Ciel dégagé", 1: "Partiellement nuageux", 2: "Nuageux", 3: "Couvert",
    45: "Brouillard", 48: "Brouillard givrant", 51: "Bruine légère",
    53: "Bruine modérée", 55: "Bruine dense", 61: "Pluie légère",
    63: "Pluie modérée", 65: "Pluie forte", 71: "Neige légère",
    73: "Neige modérée", 75: "Neige forte", 95: "Orage",
    96: "Orage avec grêle", 99: "Orage violent avec grêle",
  };
  return map[code] || "Temps indéterminé";
}

function displayWeather(data, city) {
  cityNameEl.textContent = city;
  tempEl.textContent = `${data.temperature} °C`;
  descEl.textContent = codeToText(data.weathercode);
  iconEl.src = WEATHER_ICONS[data.weathercode] || WEATHER_ICONS[3];
  weatherSec.classList.remove("hidden");
}

/*******************************************************
 * 5. CHOIX EXPLICITE (si homonymes)
 *******************************************************/
function chooseCity(list) {
  choiceBox.innerHTML = "";
  choiceBox.classList.remove("hidden");
  return new Promise(resolve => {
    list.forEach(c => {
      const line = document.createElement("div");
      line.className = "choice-line";
      line.innerHTML = `
        <span class="choice-name">${c.name}</span>
        <span class="choice-admin">${c.admin1}, ${c.country}</span>
      `;
      line.onclick = () => {
        choiceBox.classList.add("hidden");
        resolve({ lat: c.latitude, lon: c.longitude, name: `${c.name}, ${c.admin1}, ${c.country}` });
      };
      choiceBox.appendChild(line);
    });
  });
}

/*******************************************************
 * 6. THÈME JOUR / NUIT
 *******************************************************/
function applyDayNightTheme() {
  const hour = new Date().getHours();
  document.body.classList.toggle("night", hour < 6 || hour >= 20);
}

/*******************************************************
 * 7. GESTIONNAIRES D’ÉVÉNEMENTS
 *******************************************************/
const form       = document.getElementById("searchForm");
const input      = document.getElementById("cityInput");
const geoBtn     = document.getElementById("geoBtn");
const latLonForm = document.getElementById("latLonForm");
const latInput   = document.getElementById("latInput");
const lonInput   = document.getElementById("lonInput");

// Autocomplétion
input.addEventListener("input", () => fetchCities(input.value.trim()));

// Soumission ville
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const typed = input.value.trim();
  if (!typed) return;

  // On regarde si la chaîne tapée correspond à une entrée du datalist
  const chosen = currentSuggestions.find(c => `${c.name}, ${c.admin1}, ${c.country}` === typed);
  let target;

  if (chosen) {
    target = { lat: chosen.latitude, lon: chosen.longitude, name: `${chosen.name}, ${chosen.admin1}, ${chosen.country}` };
  } else {
    // Pas de match exact => on relance une recherche plus large
    await fetchCities(typed);
    if (currentSuggestions.length === 0) { alert("Aucune ville trouvée."); return; }
    if (currentSuggestions.length === 1) {
      const c = currentSuggestions[0];
      target = { lat: c.latitude, lon: c.longitude, name: `${c.name}, ${c.admin1}, ${c.country}` };
    } else {
      target = await chooseCity(currentSuggestions);
    }
  }

  try {
    const weather = await getWeather(target);
    displayWeather(weather, target.name);
  } catch (err) {
    alert(err.message);
  }
});

// Lat / Lon
latLonForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const lat = parseFloat(latInput.value);
  const lon = parseFloat(lonInput.value);
  if (Number.isNaN(lat) || Number.isNaN(lon)) { alert("Coordonnées invalides."); return; }
  try {
    const weather = await getWeather({ lat, lon });
    displayWeather(weather, `${lat.toFixed(4)}, ${lon.toFixed(4)}`);
  } catch (err) { alert(err.message); }
});

// Géoloc
geoBtn.addEventListener("click", async () => {
  try {
    const { lat, lon } = await getCurrentPosition();
    const weather = await getWeather({ lat, lon });
    displayWeather(weather, "Ma position");
  } catch (err) { alert("Géolocalisation impossible : " + err); }
});

/*******************************************************
 * 8. INIT
 *******************************************************/
applyDayNightTheme();