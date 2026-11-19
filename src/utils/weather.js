// Helpers for talking to the OpenWeather API.
// Kept outside the components so the list, the search, and the cards all share them.
import clear_icon from "../assets/clear.png";
import cloud_icon from "../assets/cloud.png";
import drizzle_icon from "../assets/drizzle.png";
import rain_icon from "../assets/rain.png";
import snow_icon from "../assets/snow.png";

const API_KEY = import.meta.env.VITE_APP_ID;
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

// The 20 cities loaded when the page first opens.
// A country code ("Paris,FR") makes sure the API picks the right city.
export const CITIES = [
    "Muncie,US", "Indianapolis,US", "Chicago,US", "New York,US", "Los Angeles,US",
    "Miami,US", "Anchorage,US", "Honolulu,US", "Mexico City,MX", "Rio de Janeiro,BR",
    "London,GB", "Paris,FR", "Reykjavik,IS", "Moscow,RU", "Cairo,EG",
    "Dubai,AE", "Mumbai,IN", "Singapore,SG", "Tokyo,JP", "Sydney,AU",
];

// OpenWeather icon codes -> our own images ("d" = day, "n" = night)
const allIcons = {
    "01d": clear_icon, "01n": clear_icon,     // clear sky
    "02d": cloud_icon, "02n": cloud_icon,     // few clouds
    "03d": cloud_icon, "03n": cloud_icon,     // scattered clouds
    "04d": drizzle_icon, "04n": drizzle_icon, // broken clouds
    "09d": rain_icon, "09n": rain_icon,       // shower rain
    "10d": rain_icon, "10n": rain_icon,       // rain
    "11d": rain_icon, "11n": rain_icon,       // thunderstorm
    "13d": snow_icon, "13n": snow_icon,       // snow
    "50d": cloud_icon, "50n": cloud_icon,     // mist / fog
};

// Fetch the current weather for ONE city.
// Returns a simplified object with just the fields the cards need,
// or null if the API says the city doesn't exist (404).
// Throws an Error for anything else (bad API key, no internet) so the caller can show it.
export const fetchCity = async (cityName) => {
    const url = `${BASE_URL}?q=${encodeURIComponent(cityName)}&units=imperial&appid=${API_KEY}`;
    const response = await fetch(url);

    if (response.status === 404) {
        return null;
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message);
    }

    return {
        id: data.id,
        location: data.name,
        country: data.sys.country,
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        high: Math.round(data.main.temp_max),
        low: Math.round(data.main.temp_min),
        condition: data.weather[0].main, // e.g. "Clear", "Clouds", "Rain"
        description: data.weather[0].description, // e.g. "light rain"
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed),
        icon: allIcons[data.weather[0].icon] || clear_icon,
    };
};

// Filter buttons. Each filter has a test function that decides whether a city is shown.
const WET_CONDITIONS = ["Rain", "Drizzle", "Thunderstorm", "Snow"];

export const FILTERS = [
    { id: "all", label: "All", test: () => true },
    { id: "warm", label: "Warm (70°F+)", test: (city) => city.temperature >= 70 },
    { id: "cold", label: "Cold (under 50°F)", test: (city) => city.temperature < 50 },
    { id: "clear", label: "Clear", test: (city) => city.condition === "Clear" },
    { id: "cloudy", label: "Cloudy", test: (city) => city.condition === "Clouds" },
    { id: "wet", label: "Rain / Snow", test: (city) => WET_CONDITIONS.includes(city.condition) },
];

// Sort options for the dropdown
export const SORT_OPTIONS = [
    { id: "default", label: "Default order" },
    { id: "warmest", label: "Warmest first" },
    { id: "coldest", label: "Coldest first" },
    { id: "name", label: "Name (A–Z)" },
];

// Returns a NEW sorted array. The original isn't changed, because React state shouldn't be mutated.
export const sortCities = (cities, sortBy) => {
    const sorted = [...cities];

    if (sortBy === "warmest") {
        sorted.sort((a, b) => b.temperature - a.temperature);
    } else if (sortBy === "coldest") {
        sorted.sort((a, b) => a.temperature - b.temperature);
    } else if (sortBy === "name") {
        sorted.sort((a, b) => a.location.localeCompare(b.location));
    }

    return sorted;
};
