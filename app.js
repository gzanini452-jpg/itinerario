let currentFilter = "all";
let allPlaces = [];
let selectedPlace;
let currentPage = 1;
let activeSearchId = 0;
let activeRequestController;
const DEMO_MODE = true;
const placesPerPage = 10;
const status = document.querySelector("#status");
const placesEl = document.querySelector("#places");

function setStatus(message) {
  status.textContent = message;
}
function beginSearch() {
  activeSearchId += 1;
  activeRequestController?.abort();
  activeRequestController = undefined;
  allPlaces = [];
  selectedPlace = undefined;
  currentPage = 1;
  placesEl.innerHTML = '<div class="empty-state loading-state"><div>⌖</div><h3>Buscando novos lugares</h3><p>Os resultados da pesquisa anterior foram removidos.</p></div>';
  return activeSearchId;
}
function fetchWithTimeout(url, options = {}, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Tempo de consulta esgotado")), timeout);
    fetch(url, options).then(
      (response) => { clearTimeout(timer); resolve(response); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });
}
function escapeHtml(value = "") {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}
function typeFor(tags) {
  return /^(kindergarten|school|college|university|language_school|music_school)$/.test(
    tags.amenity || "",
  )
    ? "school"
    : "ngo";
}
function typeLabel(type) {
  return type === "school" ? "Escola / instituição" : "ONG / apoio comunitário";
}
function categoryLabel(tags) {
  if (
    /^(kindergarten|school|college|university|language_school|music_school)$/.test(
      tags.amenity || "",
    )
  )
    return "Instituição de ensino";
  if (
    /^(clinic|hospital|doctors)$/.test(tags.amenity || "") ||
    /^(clinic|doctor|hospital)$/.test(tags.healthcare || "")
  )
    return "Posto ou unidade de saúde";
  if (tags.amenity === "community_centre") return "Centro comunitário";
  if (tags.amenity === "social_facility") return "Instituição de acolhimento";
  return "ONG / apoio comunitário";
}
function filteredPlaces() {
  return currentFilter === "all"
    ? allPlaces
    : allPlaces.filter((place) => place.type === currentFilter);
}
function distanceInKm(lat1, lon1, lat2, lon2) {
  const radius = 6371;
  const toRadians = (value) => (value * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function distanceLabel(distance) {
  return distance < 1
    ? `${Math.round(distance * 1000)} m de você`
    : `${distance.toFixed(1).replace(".", ",")} km de você`;
}
function demoLocation(value) {
  const cep = value.replace(/\D/g, "");
  const hash = [...value].reduce((total, character) => total + character.charCodeAt(0), 0);
  const offset = ((hash % 17) - 8) * 0.004;
  if (cep.length === 8) {
    const prefix = Number(cep.slice(0, 3));
    if (prefix >= 20 && prefix < 30) return { coordinates: [-23.485 + offset, -46.620 - offset], area: "Zona Norte" };
    if (prefix >= 30 && prefix < 40) return { coordinates: [-23.545 + offset, -46.535 - offset], area: "Zona Leste" };
    if (prefix >= 40 && prefix < 50) return { coordinates: [-23.615 + offset, -46.665 - offset], area: "Zona Sul" };
    if (prefix >= 50 && prefix < 60) return { coordinates: [-23.550 + offset, -46.705 - offset], area: "Zona Oeste" };
  }
  const points = [[-23.504, -46.625], [-23.585, -46.642], [-23.538, -46.572], [-23.558, -46.694], [-23.548, -46.635]];
  return { coordinates: points[hash % points.length], area: "Região pesquisada" };
}
function createDemoPlaces(lat, lon, area, searchKey) {
  const northExamples = [
    ['Escola Municipal Cantareira', 'Instituição de ensino', 'school', 'Rua da Serra, 120'], ['Centro Comunitário Norte Ativo', 'Centro comunitário', 'ngo', 'Avenida Nova, 245'], ['UBS Vila Aurora', 'Posto ou unidade de saúde', 'ngo', 'Rua da Saúde, 78'], ['Instituto Caminhos do Norte', 'ONG / apoio comunitário', 'ngo', 'Rua da Cidadania, 310'], ['Faculdade Paulista do Norte', 'Instituição de ensino', 'school', 'Avenida Universitária, 560'], ['Lar Acolher Norte', 'Instituição de acolhimento', 'ngo', 'Rua do Amparo, 42']
  ];
  const eastExamples = [
    ['Escola Municipal Parque do Carmo', 'Instituição de ensino', 'school', 'Rua das Palmeiras, 144'], ['Centro Comunitário Leste Unido', 'Centro comunitário', 'ngo', 'Avenida do Encontro, 81'], ['UBS Jardim da Conquista', 'Posto ou unidade de saúde', 'ngo', 'Rua da Esperança, 390'], ['Instituto Ação Leste', 'ONG / apoio comunitário', 'ngo', 'Rua da União, 26'], ['Faculdade Cidade do Leste', 'Instituição de ensino', 'school', 'Avenida das Ideias, 570'], ['Lar Vida Nova Leste', 'Instituição de acolhimento', 'ngo', 'Rua do Cuidado, 63']
  ];
  const southExamples = [
    ['Escola Municipal Interlagos', 'Instituição de ensino', 'school', 'Rua das Águas, 210'], ['Centro Comunitário Sul em Rede', 'Centro comunitário', 'ngo', 'Avenida do Lago, 112'], ['UBS Jardim Primavera', 'Posto ou unidade de saúde', 'ngo', 'Rua da Saúde, 460'], ['Instituto Pontes do Sul', 'ONG / apoio comunitário', 'ngo', 'Rua da Integração, 77'], ['Faculdade Campo Belo', 'Instituição de ensino', 'school', 'Avenida do Futuro, 680'], ['Lar Acolher Sul', 'Instituição de acolhimento', 'ngo', 'Rua da Paz, 31']
  ];
  const westExamples = [
    ['Escola Municipal Butantã', 'Instituição de ensino', 'school', 'Rua do Bosque, 98'], ['Centro Comunitário Oeste Vivo', 'Centro comunitário', 'ngo', 'Avenida das Artes, 270'], ['UBS Vila Sônia', 'Posto ou unidade de saúde', 'ngo', 'Rua do Bem-Estar, 55'], ['Instituto Conexão Oeste', 'ONG / apoio comunitário', 'ngo', 'Rua das Pontes, 184'], ['Faculdade Vila Leopoldina', 'Instituição de ensino', 'school', 'Avenida da Pesquisa, 720'], ['Lar de Apoio Oeste', 'Instituição de acolhimento', 'ngo', 'Rua da Solidariedade, 40']
  ];
  const standardExamples = [
    ['Escola Municipal Horizonte', 'Instituição de ensino', 'school', 'Rua das Flores, 120'],
    ['Centro Comunitário Viver Bem', 'Centro comunitário', 'ngo', 'Avenida Principal, 245'],
    ['UBS Jardim Esperança', 'Posto ou unidade de saúde', 'ngo', 'Rua da Saúde, 78'],
    ['Instituto Caminhos Abertos', 'ONG / apoio comunitário', 'ngo', 'Rua da Cidadania, 310'],
    ['Faculdade Nova Geração', 'Instituição de ensino', 'school', 'Avenida Universitária, 560'],
    ['Lar Acolher', 'Instituição de acolhimento', 'ngo', 'Rua do Amparo, 42'],
    ['Creche Pequenos Passos', 'Instituição de ensino', 'school', 'Rua das Crianças, 89'],
    ['Centro de Saúde da Família', 'Posto ou unidade de saúde', 'ngo', 'Avenida da Família, 155'],
    ['ONG Mãos que Ajudam', 'ONG / apoio comunitário', 'ngo', 'Rua Solidária, 201'],
    ['Colégio Aprender', 'Instituição de ensino', 'school', 'Rua do Saber, 340'],
    ['Casa da Juventude', 'Centro comunitário', 'ngo', 'Praça da Comunidade, 15'],
    ['Universidade Comunitária', 'Instituição de ensino', 'school', 'Avenida do Conhecimento, 900'],
  ];
  const examplesByArea = { 'Zona Norte': northExamples, 'Zona Leste': eastExamples, 'Zona Sul': southExamples, 'Zona Oeste': westExamples };
  const examples = examplesByArea[area] || standardExamples;
  const cepReference = searchKey.replace(/\D/g, '').length === 8 ? ` — CEP ${searchKey.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2')}` : '';
  return examples.map((example, index) => {
    const angle = index * 2.4;
    const distance = 0.15 + index * 0.18;
    return { name: example[0], category: example[1], type: example[2], address: `${example[3]}, ${area}, São Paulo${cepReference}`, distance, lat: lat + Math.cos(angle) * distance / 111, lon: lon + Math.sin(angle) * distance / (111 * Math.cos(lat * Math.PI / 180)) };
  });
}
function normalizedPlaceName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b\d{1,2}:\d{2}\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
function removeNearbyDuplicates(places) {
  return places.reduce((unique, place) => {
    const samePlace = unique.find(
      (other) =>
        normalizedPlaceName(other.name) === normalizedPlaceName(place.name) &&
        distanceInKm(other.lat, other.lon, place.lat, place.lon) <= 0.15,
    );
    if (!samePlace) {
      unique.push(place);
    } else if (place.distance < samePlace.distance) {
      unique[unique.indexOf(samePlace)] = place;
    }
    return unique;
  }, []);
}
function mapImage(place) {
  const zoom = 15;
  const tiles = 2 ** zoom;
  const latitude = (place.lat * Math.PI) / 180;
  const x = Math.floor(((place.lon + 180) / 360) * tiles);
  const y = Math.floor(
    ((1 - Math.asinh(Math.tan(latitude)) / Math.PI) / 2) * tiles,
  );
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}
function googleMapsLocationUrl(place) {
  return `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`;
}
function googleMapsUrl(place) {
  if (!place.address) return googleMapsLocationUrl(place);
  const query = [place.name, place.address].join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
function selectPlace(place, card) {
  selectedPlace = place;
  document
    .querySelectorAll(".place")
    .forEach((item) => item.classList.remove("selected"));
  card?.classList.add("selected");
  card?.scrollIntoView({ block: "nearest", behavior: "smooth" });
}
function renderPlaces() {
  const places = filteredPlaces();
  if (!places.length) {
    placesEl.innerHTML =
      '<div class="empty-state"><div>⌕</div><h3>Nenhum lugar encontrado</h3><p>Tente ampliar a pesquisa ou escolher outro tipo de lugar.</p></div>';
    return;
  }
  const totalPages = Math.ceil(places.length / placesPerPage);
  currentPage = Math.min(currentPage, totalPages);
  const pagePlaces = places.slice(
    (currentPage - 1) * placesPerPage,
    currentPage * placesPerPage,
  );
  const cards = pagePlaces
    .map((place, index) => {
      const hasAddress = Boolean(place.address);
      return `<article class="place place-card ${place === selectedPlace ? "selected" : ""}" data-index="${index}" tabindex="0"><div class="map-preview-wrap"><img class="map-preview" src="${mapImage(place)}" alt="Mapa da localização de ${escapeHtml(place.name)}"><span class="map-pin" aria-hidden="true">●</span></div><div class="place-info"><div class="place-topline"><span class="place-type">${place.category || typeLabel(place.type)}</span><strong class="distance">${distanceLabel(place.distance)}</strong></div><h3>${escapeHtml(place.name)}</h3><p>${escapeHtml(place.address || "Endereço indisponível: será aberta a localização exata.")}</p><a href="${googleMapsUrl(place)}" target="_blank" rel="noreferrer">${hasAddress ? "Buscar no Google Maps ↗" : "Abrir localização no Google Maps ↗"}</a>${hasAddress ? `<a class="exact-location" href="${googleMapsLocationUrl(place)}" target="_blank" rel="noreferrer">Localização exata ↗</a>` : ""}</div></article>`;
    })
    .join("");
  const firstVisiblePage = Math.floor((currentPage - 1) / 10) * 10 + 1;
  const lastVisiblePage = Math.min(firstVisiblePage + 9, totalPages);
  const pages = Array.from(
    { length: lastVisiblePage - firstVisiblePage + 1 },
    (_, index) => {
      const page = firstVisiblePage + index;
      return `<button class="page-button ${page === currentPage ? "active" : ""}" data-page="${page}" aria-label="Página ${page}" aria-current="${page === currentPage ? "page" : "false"}">${page}</button>`;
    },
  ).join("");
  const moreButton =
    lastVisiblePage < totalPages
      ? `<button class="page-button page-more" data-page="${lastVisiblePage + 1}">Mais <span>›</span></button>`
      : "";
  placesEl.innerHTML =
    cards +
    (totalPages > 1
      ? `<nav class="pagination" aria-label="Paginação"><button class="page-button page-previous" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""}>← Anterior</button><div class="page-numbers">${pages}</div>${moreButton}</nav>`
      : "");
  document
    .querySelectorAll(".place-card")
    .forEach((card) =>
      card.addEventListener("click", () =>
        selectPlace(pagePlaces[Number(card.dataset.index)], card),
      ),
    );
  document.querySelectorAll(".page-button[data-page]").forEach((button) =>
    button.addEventListener("click", () => {
      currentPage = Number(button.dataset.page);
      renderPlaces();
      document
        .querySelector(".places-panel")
        .scrollTo({ top: 0, behavior: "smooth" });
    }),
  );
}
async function loadPlaces(lat, lon, label, searchId) {
  if (searchId !== activeSearchId) return;
  setStatus("Procurando iniciativas perto de " + label + "…");
  if (DEMO_MODE) {
    await new Promise(resolve => setTimeout(resolve, 450));
    if (searchId !== activeSearchId) return;
    allPlaces = createDemoPlaces(Number(lat), Number(lon), label.split(' — ')[0], label);
    selectedPlace = undefined;
    currentPage = 1;
    renderPlaces();
    setStatus(`${allPlaces.length} lugares demonstrativos perto de ${label}.`);
    return;
  }
  const controller = new AbortController();
  activeRequestController = controller;
  try {
    const response = await fetchWithTimeout(`/api/places?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`, { signal: controller.signal }, 35000);
    if (!response.ok) throw new Error(`Falha na consulta (${response.status})`);
    const data = await response.json();
    if (searchId !== activeSearchId) return;
    const seen = new Set();
    const foundPlaces = data.elements
      .map((item) => {
        const coords = item.type === "node" ? item : item.center;
        const tags = item.tags || {};
        return {
          lat: coords?.lat,
          lon: coords?.lon,
          name: tags.name || tags["name:pt"] || "",
          address: [
            tags["addr:street"] || tags["addr:place"] || tags["addr:full"],
            tags["addr:housenumber"],
            tags["addr:city"] || tags["addr:municipality"] || tags["addr:state"],
          ]
            .filter(Boolean)
            .join(", "),
          type: typeFor(tags),
          category: categoryLabel(tags),
          distance: distanceInKm(lat, lon, coords?.lat, coords?.lon),
        };
      })
      .filter(
        (place) =>
          place.name &&
          place.address &&
          place.lat &&
          place.lon &&
          !seen.has(place.name + place.lat),
      )
      .filter((place) => {
        seen.add(place.name + place.lat);
        return true;
      });
    allPlaces = removeNearbyDuplicates(foundPlaces).sort(
      (a, b) => a.distance - b.distance,
    );
    selectedPlace = undefined;
    currentPage = 1;
    renderPlaces();
    setStatus(
      `${allPlaces.length} lugares encontrados perto de ${label}, ordenados do mais próximo ao mais distante.`,
    );
  } catch (error) {
    if (error.name === "AbortError" || searchId !== activeSearchId) return;
    console.error(error);
    setStatus(
      "Não foi possível consultar os dados agora. Verifique sua conexão e tente novamente.",
    );
  }
}
async function searchAddress() {
  const address = document.querySelector("#address").value.trim();
  if (!address) {
    setStatus("Digite uma cidade, bairro ou CEP para pesquisar.");
    return;
  }
  const searchId = beginSearch();
  setStatus("Localizando " + address + "…");
  try {
    const cep = address.replace(/\D/g, "");
    if (DEMO_MODE) {
      const demo = demoLocation(address);
      const [lat, lon] = demo.coordinates;
      const label = cep.length === 8 ? `${demo.area} — CEP ${cep.slice(0, 5)}-${cep.slice(5)}` : `${demo.area} — ${address}`;
      await loadPlaces(lat, lon, label, searchId);
      return;
    }
    if (cep.length === 8) {
      const brasilApiRequest = fetchWithTimeout(
        "https://brasilapi.com.br/api/cep/v2/" + cep,
      );
      const awesomeApiRequest = fetchWithTimeout(
        "https://cep.awesomeapi.com.br/json/" + cep,
      ).catch(() => null);
      const response = await brasilApiRequest;
      if (!response.ok) throw new Error("CEP não encontrado");
      const result = await response.json();
      const label = [
        result.street,
        result.neighborhood,
        result.city,
        result.state,
      ]
        .filter(Boolean)
        .join(", ");
      let coordinates;
      try {
        const cepCoordinatesResponse = await awesomeApiRequest;
        if (cepCoordinatesResponse?.ok) {
          const cepCoordinates = await cepCoordinatesResponse.json();
          if (cepCoordinates.lat && cepCoordinates.lng) {
            coordinates = { latitude: cepCoordinates.lat, longitude: cepCoordinates.lng };
          }
        }
      } catch { /* Tenta a próxima fonte de coordenadas abaixo. */ }
      if (!coordinates) {
        try {
          const geocodeResponse = await fetchWithTimeout(
            "https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=br&postalcode=" +
              cep + "&street=" + encodeURIComponent(result.street || "") +
              "&city=" + encodeURIComponent(result.city || "") +
              "&state=" + encodeURIComponent(result.state || ""), {}, 6000,
          );
          const geocodedAddress = geocodeResponse.ok ? await geocodeResponse.json() : [];
          const exactAddress = geocodedAddress.find(item => item.address?.postcode?.replace(/\D/g, "").startsWith(cep));
          if (exactAddress) coordinates = { latitude: exactAddress.lat, longitude: exactAddress.lon };
        } catch { /* Usa a coordenada de reserva abaixo. */ }
      }
      if (searchId !== activeSearchId) return;
      coordinates ||= result.location?.coordinates;
      if (!coordinates) throw new Error("CEP sem coordenadas");
      await loadPlaces(
        coordinates.latitude,
        coordinates.longitude,
        label,
        searchId,
      );
      return;
    }
    const response = await fetchWithTimeout(
      "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=" +
        encodeURIComponent(address),
      {},
      6000,
    );
    const result = await response.json();
    if (!result.length) throw new Error("Local não encontrado");
    if (searchId !== activeSearchId) return;
    await loadPlaces(
      result[0].lat,
      result[0].lon,
      result[0].display_name.split(",").slice(0, 2).join(","),
      searchId,
    );
  } catch {
    if (searchId !== activeSearchId) return;
    setStatus(
      "Não encontramos essa localização. Confira o CEP (8 números) ou tente informar cidade e estado.",
    );
  }
}
document
  .querySelector("#searchButton")
  .addEventListener("click", searchAddress);
document.querySelector("#address").addEventListener("keydown", (event) => {
  if (event.key === "Enter") searchAddress();
});
document.querySelector("#locationButton").addEventListener("click", () => {
  if (!navigator.geolocation) {
    setStatus("Seu navegador não oferece suporte à localização.");
    return;
  }
  const searchId = beginSearch();
  setStatus("Solicitando sua localização…");
  navigator.geolocation.getCurrentPosition(
    (position) =>
      loadPlaces(
        position.coords.latitude,
        position.coords.longitude,
        "sua localização",
        searchId,
      ),
    () =>
      { if (searchId === activeSearchId) setStatus("Não foi possível acessar sua localização. Pesquise por endereço."); },
    { enableHighAccuracy: true, timeout: 10000 },
  );
});
document.querySelectorAll(".filter").forEach((button) =>
  button.addEventListener("click", () => {
    document.querySelector(".filter.active").classList.remove("active");
    button.classList.add("active");
    currentFilter = button.dataset.filter;
    currentPage = 1;
    renderPlaces();
  }),
);
