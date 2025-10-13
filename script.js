/*******************************************************
 * 0. CONFIG & UTILITAIRES
 *******************************************************/
// Images météo (liens directement utilisables, pas besoin de fichiers locaux)
const WEATHER_ICONS = {
  0:  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2600.png",         // soleil
  1:  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/26c5.png",         // soleil nuage
  2:  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2601.png",         // nuage
  3:  "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2601.png",         // couvert
  45: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f32b.png",         // brouillard
  48: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f32b.png",         // brouillard givrant
  51: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4a7.png",         // bruine
  53: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4a7.png",         // bruine
  55: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4a7.png",         // bruine
  61: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f327.png",         // pluie
  63: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f327.png",         // pluie
  65: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f327.png",         // pluie
  71: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2744.png",          // neige
  73: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2744.png",          // neige
  75: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2744.png",          // neige
  95: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/26c8.png",          // orage
  96: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/26c8.png",          // orage grêle
  99: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/26c8.png",          // orage violent
};

/*******************************************************
 * 1. GÉOLOCALISATION (API native navigateur)
 *******************************************************/
/**
 * Récupère la position GPS de l'utilisateur via l'API native.
 * Retourne une Promise qui résout avec {lat, lon}.
 * Rejette si l'API n'est pas dispo ou si l'utilisateur refuse.
 */
function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject("Géolocalisation non supportée par ce navigateur.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => reject(err.message),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

/*******************************************************
 * 2. GÉOCODING (ville → coordonnées)
 *******************************************************/
/**
 * Convertit un nom de ville en coordonnées {lat, lon, name}
 * via l'API Open-Meteo Geocoding.
 */
async function getCoords(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=fr&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur réseau géocoding");
  const json = await res.json();
  if (!json.results || !json.results.length) throw new Error("Ville introuvable");
  const { latitude, longitude, name } = json.results[0];
  return { lat: latitude, lon: longitude, name };
}

/*******************************************************
 * 3. MÉTÉO (coord → données météo)
 *******************************************************/
/**
 * Récupère les données météo actuelles via Open-Meteo Forecast API.
 * Retourne l'objet `current_weather`.
 */
async function getWeather({ lat, lon }) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur réseau météo");
  const json = await res.json();
  return json.current_weather;
}

/*******************************************************
 * 4. UI – AFFICHAGE
 *******************************************************/
// Références DOM (on les récupère une seule fois)
const cityNameEl  = document.getElementById("cityName");
const tempEl      = document.getElementById("temperature");
const descEl      = document.getElementById("description");
const iconEl      = document.getElementById("weatherIcon");
const weatherSec  = document.getElementById("weather");

/**
 * Convertit le code météo Open-Meteo en texte lisible.
 */
function codeToText(code) {
  const map = {
    0: "Ciel dégagé",
    1: "Partiellement nuageux",
    2: "Nuageux",
    3: "Couvert",
    45: "Brouillard",
    48: "Brouillard givrant",
    51: "Bruine légère",
    53: "Bruine modérée",
    55: "Bruine dense",
    61: "Pluie légère",
    63: "Pluie modérée",
    65: "Pluie forte",
    71: "Neige légère",
    73: "Neige modérée",
    75: "Neige forte",
    95: "Orage",
    96: "Orage avec grêle",
    99: "Orage violent avec grêle",
  };
  return map[code] || "Temps indéterminé";
}

/**
 * Affiche les données météo dans le DOM.
 * @param {Object} data – objet current_weather
 * @param {string} city – nom de la ville
 */
function displayWeather(data, city) {
  cityNameEl.textContent = city;
  tempEl.textContent = `${data.temperature} °C`;
  descEl.textContent = codeToText(data.weathercode);
  iconEl.src = WEATHER_ICONS[data.weathercode] || WEATHER_ICONS[3];
  weatherSec.classList.remove("hidden");
}

/*******************************************************
 * 5. THÈME JOUR / NUIT (bonus)
 *******************************************************/
/**
 * Applique une classe .night sur <body> si on est entre 20 h et 6 h.
 */
function applyDayNightTheme() {
  const hour = new Date().getHours();
  document.body.classList.toggle("night", hour < 6 || hour >= 20);
}

/*******************************************************
 * 6. GESTIONNAIRES D’ÉVÉNEMENTS
 *******************************************************/
// Références
const form   = document.getElementById("searchForm");
const input  = document.getElementById("cityInput");
const geoBtn = document.getElementById("geoBtn");

// 1) Soumission du formulaire (recherche par ville)
form.addEventListener("submit", async (e) => {
  e.preventDefault();                       // Empêche le rechargement
  const city = input.value.trim();          // Récupère la ville
  if (!city) return;                        // Sécurité
  try {
    const { lat, lon, name } = await getCoords(city); // ville → coords
    const weather = await getWeather({ lat, lon });   // coords → météo
    displayWeather(weather, name);                    // affichage
  } catch (err) {
    alert(err.message);                     // Simple feedback utilisateur
  }
});

// 2) Clic sur le bouton « Ma position »
geoBtn.addEventListener("click", async () => {
  try {
    const { lat, lon } = await getCurrentPosition(); // GPS
    const weather = await getWeather({ lat, lon });  // météo
    displayWeather(weather, "Ma position");          // affichage
  } catch (err) {
    alert("Géolocalisation impossible : " + err);
  }
});

/*******************************************************
 * 7. INITIALISATION
 *******************************************************/
// Applique le thème jour/nuit dès le chargement
applyDayNightTheme();