import React from "react";
import { Badge, Button } from "react-bootstrap";

// A row of buttons that filter the cities already on the page (no new fetch).
// The selected button is filled in, and each button shows how many cities match.
const FilterButtons = ({ filters, counts, active, onSelect }) => {
    return (
        <div className="filter-buttons">
            {filters.map((filter) => {
                const isActive = filter.id === active;
                return (
                    <Button
                        key={filter.id}
                        variant={isActive ? "primary" : "outline-primary"}
                        onClick={() => onSelect(filter.id)}
                    >
                        {filter.label}{" "}
                        <Badge pill bg={isActive ? "light" : "primary"} text={isActive ? "primary" : "light"}>
                            {counts[filter.id]}
                        </Badge>
                    </Button>
                );
            })}
        </div>
    );
};

export default FilterButtons;
