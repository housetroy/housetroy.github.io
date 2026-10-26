// API: PokéAPI (https://pokeapi.co)

const API_BASE = "https://pokeapi.co/api/v2";
const HOW_MANY = 50; // how many Pokémon to show (assignment needs at least 20)
const MAX_STAT = 255; // highest possible base stat, used to size the stat bars

const STAT_LABELS = {
  "hp": "HP",
  "attack": "Attack",
  "defense": "Defense",
  "special-attack": "Sp. Atk",
  "special-defense": "Sp. Def",
  "speed": "Speed",
};

// HTML Elements
const fetchBtn = document.getElementById("fetchBtn");
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const statusEl = document.getElementById("status");
const container = document.getElementById("pokemonContainer");

// Event listeners
fetchBtn.addEventListener("click", fetchPokemonList);
searchBtn.addEventListener("click", searchPokemon);

// Enter for search
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    searchPokemon();
  }
});

// Fetch Pokemon
async function fetchPokemonList() {
  clearResults();
  showStatus("Catching Pokémon...", "loading");
  setButtonsDisabled(true);

  try {
    // Step 1: the list endpoint only gives each Pokémon's name and a URL
    const listResponse = await fetch(`${API_BASE}/pokemon?limit=${HOW_MANY}`);

    if (!listResponse.ok) {
      throw new Error(`The server responded with status ${listResponse.status}.`);
    }

    const listData = await listResponse.json();

    // Step 2: fetch the full details for every Pokémon at the same time
    const detailPromises = listData.results.map(async (pokemon) => {
      const response = await fetch(pokemon.url);
      if (!response.ok) {
        throw new Error(`Could not load ${pokemon.name} (status ${response.status}).`);
      }
      return response.json();
    });

    // Promise.all waits until every detail request has finished
    const allPokemon = await Promise.all(detailPromises);

    allPokemon.forEach((pokemon) => {
      container.appendChild(createPokemonCard(pokemon));
    });

    showStatus(`Showing ${allPokemon.length} Pokémon.`, "success");
  } catch (error) {
    // Errors are displayed ON THE PAGE, not just in the console
    showStatus(`Could not load Pokémon: ${error.message}`, "error");
  } finally {
    setButtonsDisabled(false);
  }
}

// Extra credit
async function searchPokemon() {
  // PokéAPI names are lowercase, so convert what the user typed
  const query = searchInput.value.trim().toLowerCase();

  if (query === "") {
    clearResults();
    showStatus("Please type a Pokémon name or number to search.", "error");
    return;
  }

  clearResults();
  showStatus(`Searching for "${query}"...`, "loading");
  setButtonsDisabled(true);

  try {
    const response = await fetch(`${API_BASE}/pokemon/${encodeURIComponent(query)}`);

    // The API returns 404 when no Pokémon matches
    if (response.status === 404) {
      showStatus(`No Pokémon found matching "${query}".`, "error");
      return;
    }

    if (!response.ok) {
      throw new Error(`The server responded with status ${response.status}.`);
    }

    const pokemon = await response.json();
    container.appendChild(createPokemonCard(pokemon));
    showStatus(`Found ${capitalize(pokemon.name)}!`, "success");
  } catch (error) {
    showStatus(`Search failed: ${error.message}`, "error");
  } finally {
    setButtonsDisabled(false);
  }
}

// Build one card with createElement
function createPokemonCard(pokemon) {
  const card = document.createElement("article");
  card.classList.add("card");

  // Image of pokemon
  const img = document.createElement("img");
  img.src =
    pokemon.sprites.other["official-artwork"].front_default ||
    pokemon.sprites.front_default;
  img.alt = pokemon.name;
  img.loading = "lazy";
  card.appendChild(img);

  // Pokédex number
  const number = document.createElement("p");
  number.classList.add("poke-number");
  number.textContent = `#${String(pokemon.id).padStart(3, "0")}`;
  card.appendChild(number);

  // Name
  const name = document.createElement("h2");
  name.textContent = pokemon.name;
  card.appendChild(name);

  // Type badges
  const typesDiv = document.createElement("div");
  typesDiv.classList.add("types");

  pokemon.types.forEach((typeInfo) => {
    const badge = document.createElement("span");
    badge.classList.add("type", `type-${typeInfo.type.name}`);
    badge.textContent = typeInfo.type.name;
    typesDiv.appendChild(badge);
  });
  card.appendChild(typesDiv);

  // Details list
  const list = document.createElement("ul");
  list.classList.add("info-list");

  // H/W and abilities
  addInfoItem(list, "Height", `${pokemon.height / 10} m`);
  addInfoItem(list, "Weight", `${pokemon.weight / 10} kg`);
  addInfoItem(list, "Abilities", formatAbilities(pokemon.abilities));

  card.appendChild(list);

  // Base stats
  card.appendChild(createStatsSection(pokemon.stats));

  return card;
}

// Base Stats
function createStatsSection(stats) {
  const section = document.createElement("div");
  section.classList.add("stats");

  const heading = document.createElement("h3");
  heading.textContent = "Base Stats";
  section.appendChild(heading);

  let total = 0;

  stats.forEach((statInfo) => {
    total += statInfo.base_stat;
    section.appendChild(
      createStatRow(STAT_LABELS[statInfo.stat.name] || statInfo.stat.name, statInfo.base_stat)
    );
  });

  // Total base stats
  const totalRow = document.createElement("div");
  totalRow.classList.add("stat-row", "stat-total");

  const totalLabel = document.createElement("span");
  totalLabel.classList.add("stat-label");
  totalLabel.textContent = "Total";

  const totalValue = document.createElement("span");
  totalValue.classList.add("stat-value");
  totalValue.textContent = total;

  totalRow.appendChild(totalLabel);
  totalRow.appendChild(totalValue);
  section.appendChild(totalRow);

  return section;
}

// One stat row: label, number, and a bar sized to the stat
function createStatRow(label, value) {
  const row = document.createElement("div");
  row.classList.add("stat-row");

  const labelEl = document.createElement("span");
  labelEl.classList.add("stat-label");
  labelEl.textContent = label;

  const valueEl = document.createElement("span");
  valueEl.classList.add("stat-value");
  valueEl.textContent = value;

  const bar = document.createElement("div");
  bar.classList.add("stat-bar");

  const fill = document.createElement("div");
  fill.classList.add("stat-fill");
  // 255 is the highest possible base stat, so the bar is a percentage of that
  fill.style.width = `${Math.min((value / MAX_STAT) * 100, 100)}%`;
  // Low stats red, medium yellow, high green
  if (value < 60) {
    fill.classList.add("low");
  } else if (value < 100) {
    fill.classList.add("mid");
  } else {
    fill.classList.add("high");
  }

  bar.appendChild(fill);
  row.appendChild(labelEl);
  row.appendChild(valueEl);
  row.appendChild(bar);

  return row;
}

// Adds one "Label: value" line to a card's list
function addInfoItem(list, label, value) {
  const li = document.createElement("li");

  const strong = document.createElement("strong");
  strong.textContent = `${label}: `;

  li.appendChild(strong);
  li.appendChild(document.createTextNode(value));
  list.appendChild(li);
}

// ---------- Small helper functions ----------

// Turn [{ability: {name: "blaze"}}, ...] into "Blaze, Solar Power"
function formatAbilities(abilities) {
  return abilities
    .map((a) => capitalize(a.ability.name.replace("-", " ")))
    .join(", ");
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

function clearResults() {
  container.innerHTML = "";
}

function setButtonsDisabled(disabled) {
  fetchBtn.disabled = disabled;
  searchBtn.disabled = disabled;
}