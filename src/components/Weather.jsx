import React, { useEffect, useState } from "react";
import { Alert, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import SearchBar from "./SearchBar";
import FilterButtons from "./FilterButtons";
import WeatherCard from "./WeatherCard";
import { CITIES, FILTERS, SORT_OPTIONS, fetchCity, sortCities } from "../utils/weather";
import "./Weather.css";

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

    // Fetch ONE city from the API using whatever is typed in the search box
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

            {/* Search box and search button */}
            <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                onSearch={searchCity}
                searching={searching}
            />

            {/* Search result, or a "not found" message */}
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

            {/* All 20 cities, with filter buttons and a sort dropdown */}
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
