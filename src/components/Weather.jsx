import React, { useEffect, useState } from "react";
import { Alert, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import SearchBar from "./SearchBar";
import FilterButtons from "./FilterButtons";
import WeatherCard from "./WeatherCard";
import "./Weather.css";

import clear_icon from "../assets/clear.png";
import cloud_icon from "../assets/cloud.png";
import drizzle_icon from "../assets/drizzle.png";
import rain_icon from "../assets/rain.png";
import snow_icon from "../assets/snow.png";

const API_KEY = import.meta.env.VITE_APP_ID;
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

// The 20 cities loaded when the page first opens.
// A country code ("Paris,FR") makes sure the API picks the right city.
const CITIES = [
    "Muncie,US", "Indianapolis,US", "Chicago,US", "New York,US", "Los Angeles,US",
    "Miami,US", "Anchorage,US", "Honolulu,US", "Mexico City,MX", "Rio de Janeiro,BR",
    "London,GB", "Paris,FR", "Reykjavik,IS", "Moscow,RU", "Cairo,EG",
    "Dubai,AE", "Mumbai,IN", "Singapore,SG", "Tokyo,JP", "Sydney,AU",
];

// OpenWeather icon codes
const allIcons = {
    "01d": clear_icon, "01n": clear_icon,     
    "02d": cloud_icon, "02n": cloud_icon,     
    "03d": cloud_icon, "03n": cloud_icon,     
    "04d": drizzle_icon, "04n": drizzle_icon, 
    "09d": rain_icon, "09n": rain_icon,       
    "10d": rain_icon, "10n": rain_icon,       
    "11d": rain_icon, "11n": rain_icon,       
    "13d": snow_icon, "13n": snow_icon,       
    "50d": cloud_icon, "50n": cloud_icon,     
};

// Fetch the current weather for ONE city.
// Returns an object with the fields the cards need, or null if the API says the city doesn't exist (404).
// Throws an error for anything else (bad API key, no internet) so the caller can show it.
const fetchCity = async (cityName) => {
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

const FILTERS = [
    { id: "all", label: "All", test: () => true },
    { id: "warm", label: "Warm (70°F+)", test: (city) => city.temperature >= 70 },
    { id: "cold", label: "Cold (under 50°F)", test: (city) => city.temperature < 50 },
    { id: "clear", label: "Clear", test: (city) => city.condition === "Clear" },
    { id: "cloudy", label: "Cloudy", test: (city) => city.condition === "Clouds" },
    { id: "wet", label: "Rain / Snow", test: (city) => WET_CONDITIONS.includes(city.condition) },
];

// Sort options for the dropdown
const SORT_OPTIONS = [
    { id: "default", label: "Default order" },
    { id: "warmest", label: "Warmest first" },
    { id: "coldest", label: "Coldest first" },
    { id: "name", label: "Name (A–Z)" },
];

// Returns a new sorted array. The original isn't changed, because React state shouldn't be mutated.
const sortCities = (cities, sortBy) => {
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

// The main component. It holds all the state and passes data down to the
// SearchBar, FilterButtons and WeatherCard components as props.
const Weather = () => {
    // The 20 cities loaded when the page opens
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    // Which filter button is selected, and how the list is sorted
    const [filter, setFilter] = useState("all");
    const [sortBy, setSortBy] = useState("default");

    // The search box text, the city found by the search, and a message to show the user
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResult, setSearchResult] = useState(null);
    const [message, setMessage] = useState(null); // { text, variant } or null
    const [searching, setSearching] = useState(false);

    // Load all 20 cities once, when the component first appears on the page
    useEffect(() => {
        // In development React's StrictMode runs effects twice. "ignore" stops
        // the first (cancelled) run from setting state after it is cleaned up.
        let ignore = false;

        const loadCities = async () => {
            // Promise.allSettled runs all 20 requests at the same time and waits for
            // every one to finish, even if some of them fail
            const results = await Promise.allSettled(CITIES.map((city) => fetchCity(city)));
            if (ignore) return;

            const loaded = results
                .filter((result) => result.status === "fulfilled" && result.value)
                .map((result) => result.value);

            setCities(loaded);

            if (loaded.length === 0) {
                const failed = results.find((result) => result.status === "rejected");
                setLoadError(failed ? failed.reason.message : "No cities could be loaded.");
            }
            setLoading(false);
        };

        loadCities();

        return () => {
            ignore = true;
        };
    }, []);

    // Fetch one city from the API using whatever is typed in the search box
    const searchCity = async () => {
        const term = searchTerm.trim();

        if (term === "") {
            setSearchResult(null);
            setMessage({ text: "Please type a city name to search for.", variant: "warning" });
            return;
        }

        setSearching(true);
        setMessage(null);

        try {
            const result = await fetchCity(term);
            setSearchResult(result);

            if (!result) {
                setMessage({ text: `No city found named "${term}".`, variant: "warning" });
            }
        } catch (error) {
            setSearchResult(null);
            setMessage({ text: `Something went wrong: ${error.message}`, variant: "danger" });
        } finally {
            setSearching(false);
        }
    };

    // How many cities match each filter (shown on the filter buttons)
    const counts = {};
    FILTERS.forEach((f) => {
        counts[f.id] = cities.filter(f.test).length;
    });

    // The cities to display: apply the selected filter, then the selected sort
    const activeFilter = FILTERS.find((f) => f.id === filter);
    const visibleCities = sortCities(cities.filter(activeFilter.test), sortBy);

    return (
        <Container className="weather py-5">
            <header className="text-center mb-4">
                <h1 className="app-title">Weather Around the World</h1>
                <p className="subtitle">Current conditions in 20 cities. Search below for any other city.</p>
            </header>

            /* Search box and search button */
            <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                onSearch={searchCity}
                searching={searching}
            />

            /* Search result, or a "not found" message */
            {message && (
                <Alert variant={message.variant} className="search-message mx-auto mt-3">
                    {message.text}
                </Alert>
            )}

            {searchResult && (
                <section className="mt-4">
                    <h2 className="section-title">Search Result</h2>
                    <Row>
                        <Col xs={12} sm={6} md={4} lg={3}>
                            <WeatherCard city={searchResult} />
                        </Col>
                    </Row>
                </section>
            )}

            /* All 20 cities, with filter buttons and a sort dropdown */
            <section className="mt-5">
                <div className="list-header">
                    <h2 className="section-title mb-0">
                        All Cities ({visibleCities.length} of {cities.length})
                    </h2>
                    <Form.Select
                        aria-label="Sort cities"
                        className="sort-select"
                        value={sortBy}
                        onChange={(event) => setSortBy(event.target.value)}
                    >
                        {SORT_OPTIONS.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.label}
                            </option>
                        ))}
                    </Form.Select>
                </div>

                <FilterButtons filters={FILTERS} counts={counts} active={filter} onSelect={setFilter} />

                {loading ? (
                    <div className="text-center my-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2">Loading weather for {CITIES.length} cities...</p>
                    </div>
                ) : loadError ? (
                    <Alert variant="danger">Could not load the weather: {loadError}</Alert>
                ) : visibleCities.length === 0 ? (
                    <p className="text-center my-4">No cities match this filter right now.</p>
                ) : (
                    <Row xs={1} sm={2} md={3} lg={4} className="g-4">
                        {visibleCities.map((city) => (
                            <Col key={city.id}>
                                <WeatherCard city={city} />
                            </Col>
                        ))}
                    </Row>
                )}
            </section>
        </Container>
    );
};

export default Weather;
