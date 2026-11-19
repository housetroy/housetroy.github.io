import React from "react";
import { Card } from "react-bootstrap";
import humidity_icon from "../assets/humidity.png";
import wind_icon from "../assets/wind.png";

// Displays ONE city's weather. The city object is passed in as a prop.
// The card's background color changes with the weather (see the .condition-* classes in Weather.css).
const WeatherCard = ({ city }) => {
    return (
        <Card className={`weather-card h-100 condition-${city.condition.toLowerCase()}`}>
            <Card.Body className="d-flex flex-column align-items-center text-center">
                <img src={city.icon} alt={city.description} className="weather-icon" />
                <p className="temperature">{city.temperature}°F</p>
                <Card.Title as="h3" className="location">
                    {city.location}, {city.country}
                </Card.Title>
                <p className="description">{city.description}</p>
                <p className="details">
                    Feels like {city.feelsLike}°F · H {city.high}° / L {city.low}°
                </p>

                <div className="weather-data mt-auto">
                    <div className="stat">
                        <img src={humidity_icon} alt="humidity icon" />
                        <div>
                            <p>{city.humidity}%</p>
                            <span>Humidity</span>
                        </div>
                    </div>
                    <div className="stat">
                        <img src={wind_icon} alt="wind icon" />
                        <div>
                            <p>{city.windSpeed} mph</p>
                            <span>Wind Speed</span>
                        </div>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

export default WeatherCard;
