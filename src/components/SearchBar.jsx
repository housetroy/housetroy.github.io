import React from "react";
import { Button, Form, InputGroup, Spinner } from "react-bootstrap";
import search_icon from "../assets/search.png";

// A controlled search box. The parent component owns the text (value)
// and decides what happens when the user searches (onSearch).
const SearchBar = ({ value, onChange, onSearch, searching }) => {
    // Wrapping the input in a <form> means pressing Enter also searches.
    // preventDefault stops the browser from reloading the page.
    const handleSubmit = (event) => {
        event.preventDefault();
        onSearch();
    };

    return (
        <Form onSubmit={handleSubmit} className="search-bar mx-auto">
            <InputGroup size="lg">
                <Form.Control
                    type="text"
                    placeholder="Search any city (e.g. Berlin)"
                    aria-label="City name"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                />
                <Button type="submit" variant="primary" disabled={searching}>
                    {searching ? (
                        <Spinner animation="border" size="sm" />
                    ) : (
                        <img src={search_icon} alt="" className="search-icon" />
                    )}
                    <span className="ms-2">Search</span>
                </Button>
            </InputGroup>
        </Form>
    );
};

export default SearchBar;
