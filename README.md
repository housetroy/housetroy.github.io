# Weather Around the World

A React + Vite app that shows the current weather for 20 cities using the
[OpenWeather Current Weather API](https://openweathermap.org/current).

## Features

- Loads 20 cities on page load (`useEffect` + `Promise.allSettled`)
- Filter buttons: All, Warm, Cold, Clear, Cloudy, Rain / Snow (each shows how many cities match)
- Sort dropdown: warmest, coldest, or A–Z
- Search box: fetches any city from the API, or shows a "not found" message
- Card colors change with the weather condition
- Styled with React Bootstrap plus custom CSS

## Components

| File | Purpose |
|---|---|
| `src/components/Weather.jsx` | Main component: holds the state, loads the data, filters and sorts |
| `src/components/WeatherCard.jsx` | Displays one city |
| `src/components/SearchBar.jsx` | Controlled search input and search button |
| `src/components/FilterButtons.jsx` | Filter button row |
| `src/utils/weather.js` | API calls, city list, filter and sort helpers |

## Running it

1. Create a `.env` file in the project folder with your OpenWeather API key:
   ```
   VITE_APP_ID=your_api_key_here
   ```
2. Install and start:
   ```
   npm install
   npm run dev
   ```
