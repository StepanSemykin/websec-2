const COUNTRY = "Россия"
const FIRST_TRANSPORT_TYPE = "train"
const SECOND_TRANSPORT_TYPE = "suburban"
const REQUEST_FROM = "from"
const REQUEST_TO = "to"
const REQUEST_FROM_TO = "from_to"
const COORD_SAMARA = [55.7558, 37.6173];

const PORT = 3000
const SERVER_URL = `http://localhost:${PORT}/api`
const MAP_URL = "https://api-maps.yandex.ru/2.1/?apikey=a85e14e6-2e63-4c12-903f-6182ad2c3c27&lang=ru_RU"

const PATH_SCHEDULE = "../public/schedule.html"

let stationsList = [];
let userLatitude = 0;
let userLongitude = 0;
let favoriteStations = JSON.parse(localStorage.getItem("favoriteStations")) || [];


function saveFavorite() 
{
    localStorage.setItem("favoriteStations", JSON.stringify(favoriteStations));
}

function addFavorite(station) 
{
    if (!favoriteStations.some(fav => fav.code === station.code)) 
    {
        favoriteStations.push(station);
        saveFavorite();
        renderFavorite();
    }
}

function removeFavorite(stationCode) 
{
    favoriteStations = favoriteStations.filter(station => station.code !== stationCode);
    saveFavorite();
    renderFavorite();
}

function renderFavorite() 
{
    const favoritesContainer = document.getElementsByClassName("favorites-container")[0];
    if (!favoritesContainer) return;

    favoritesContainer.innerHTML = "";
    
    if (favoriteStations.length === 0) 
    {
        favoritesContainer.innerHTML = "<p>Нет избранных станций</p>";
        return;
    }

    const list = document.createElement("ul");
    list.className = "favorites-list";

    favoriteStations.forEach(station => 
    {
        const item = document.createElement("li");
        item.className = "favorite-item";

        const stationName = document.createElement("span");
        stationName.textContent = station.title;
        stationName.className = "favorite-station-name";
        stationName.addEventListener("click", () => 
        {
            const firstInput = document.getElementById("first-input");
            const secondInput = document.getElementById("second-input");

            if (!firstInput.value) firstInput.value = station.title;
            else if (!secondInput.value) secondInput.value = station.title;
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "×";
        deleteButton.className = "favorite-delete-button";
        deleteButton.addEventListener("click", (e) => 
        {
            e.stopPropagation();
            removeFavorite(station.code);
        });

        item.appendChild(stationName);
        item.appendChild(deleteButton);
        list.appendChild(item);
    });

    favoritesContainer.appendChild(list);
}


function createFavoriteButton(buttonId, inputId) 
{
    const button = document.getElementById(buttonId);
    button.textContent = "⭐";
    button.title = "Добавить в избранное";
    
    button.addEventListener("click", () => 
    {
        const input = document.getElementById(inputId);
        const stationName = input.value;
        
        if (stationName) 
        {
            const station = stationsList.find(s => s.title.toLowerCase() === stationName.toLowerCase());
            if (station) 
            {
                addToFavorite(station);
                alert(`Станция "${stationName}" добавлена в избранное!`);
            } 
            else alert("Станция не найдена в списке");
        } 
        else alert("Введите название станции");
    });
    
    return button;
}


async function getNearestStations()
{
    if (userLatitude && userLongitude)
    {
        const params = new URLSearchParams(
        {
            lat: userLatitude,
            lng: userLongitude,
            transport_types: `${FIRST_TRANSPORT_TYPE},${SECOND_TRANSPORT_TYPE}`,
            distance: 50
        });

        try
        {
            const response = await fetch(`${SERVER_URL}/nearest_stations?${params}`);
            const data = await response.json();

            if (data) 
            {
                const nearestStationsList = data.stations.map(station => 
                ({
                    title: station.title,
                    code: station.code,
                    transport_type: station.transport_type,
                    lon: station.lng,
                    lat: station.lat
                }));
        
                return nearestStationsList;
            }
        }
        catch (error) 
        {
            alert("Ошибка загрузки ближайших станций:", error);

            return null;
        }
    }

    return null;
}


async function initMap() 
{
    const nearestStationsList = await getNearestStations();

    ymaps.ready(() => 
    {
        map = new ymaps.Map("map", 
        {
            center: userLatitude && userLongitude ? [userLatitude, userLongitude] : COORD_SAMARA,
            zoom: 10
        });

        if (nearestStationsList && nearestStationsList.length > 0) 
        {
            nearestStationsList.forEach(station => 
            {
                const placemark = new ymaps.Placemark([station.lat, station.lon], 
                {
                    hintContent: station.title
                });
    
                placemark.events.add("click", function () 
                {
                    const firstInput = document.getElementById("first-input");
                    const secondInput = document.getElementById("second-input");

                    if (!firstInput.value) firstInput.value = station.title;
                    else if (!secondInput.value) secondInput.value = station.title;
                });
    
                map.geoObjects.add(placemark);
            });
        }
    });
}


function loadMap() 
{
    const mapContainer = document.getElementsByClassName("map-container")[0];

    const script = document.createElement("script");
    script.src = MAP_URL;
    script.async = true;

    mapContainer.appendChild(script);

    script.onload = function () 
    {
        ymaps.ready(initMap);
    };

    script.onerror = function () 
    {
       alert("Ошибка загрузки карты");
    };
}


function getPosition()
{
    navigator.geolocation.getCurrentPosition(
        async (position) => 
        {
            userLatitude = position.coords.latitude;
            userLongitude = position.coords.longitude;
        },
        (error) => 
        {
            switch (error.code) 
            {
                case error.POSITION_UNAVAILABLE:
                    alert("Не удалось получить местоположение");
                    break;
                case error.TIMEOUT:
                    alert("Время запроса на геолокацию истекло");
                    break;
                default:
                    alert("Ошибка при получении геолокации");
                    break;
            }
        }
    );
}


document.addEventListener("DOMContentLoaded", async () => 
{
    const findButton = document.querySelector(".search-button");
    if (findButton) findButton.addEventListener("click", getSchedule);

    getPosition();

    try 
    {
        const response = await fetch(`${SERVER_URL}/stations_list`);
        const data = await response.json();

        const stationsRus = data.countries.find(country => country.title === COUNTRY);

        stationsRus.regions.forEach(region => 
        {
            region.settlements.forEach(settlement => 
            {
                settlement.stations
                    .filter(station => station.transport_type === FIRST_TRANSPORT_TYPE || station.transport_type === SECOND_TRANSPORT_TYPE)
                    .forEach(station => 
                    {
                        stationsList.push(
                        {
                            title: station.title,
                            code: station.codes.yandex_code,
                            transport_type: station.transport_type,
                            lon: station.longitude,
                            lat: station.latitude
                        });
                    });
            });
        }); 

        setupAutocomplete("first-input", stationsList);
        setupAutocomplete("second-input", stationsList);

        createFavoriteButton("first-favorite-button", "first-input");
        createFavoriteButton("second-favorite-button", "second-input");
        renderFavorite();

        loadMap();
    } 
    catch (error) 
    {
        console.error("Ошибка загрузки станций:", error);
    }
});


function setupAutocomplete(id, stations) 
{
    const input = document.getElementById(id);
    const dropdown = document.createElement("div");
    dropdown.classList.add("autocomplete-dropdown");
    input.parentNode.appendChild(dropdown);

    input.addEventListener("input", function () 
    {
        const query = this.value.toLowerCase();
        dropdown.innerHTML = "";

        if (!query) return;

        const filteredStations = stations.filter(station => station.title.toLowerCase().includes(query)).slice(0, 5);

        filteredStations.forEach(station => 
        {
            const item = document.createElement("div");
            item.classList.add("autocomplete-item");
            item.textContent = station.title;
            item.addEventListener("click", function () 
            {
                input.value = station.title;
                dropdown.innerHTML = "";
            });
            dropdown.appendChild(item);
        });

        updatePosition(input, dropdown);
    });

    document.addEventListener("click", function (event) 
    {
        if (!input.contains(event.target) && !dropdown.contains(event.target)) dropdown.innerHTML = "";
    });
}


function updatePosition(input, dropdown) 
{
    const position = input.getBoundingClientRect();

    dropdown.style.left = `${position.left + window.scrollX}px`;
    dropdown.style.top = `${position.bottom + window.scrollY + 10}px`; 
    dropdown.style.width = `${position.width}px`; 
}


function getInputValues() 
{
    return {
        firstStationName: document.getElementById("first-input").value,
        secondStationName: document.getElementById("second-input").value,
        date: document.getElementsByClassName("calendar-input")[0].value
    };
}


async function getSchedule()
{
    const { firstStationName, secondStationName, date } = getInputValues();

    if(date)
    {
        let requestType;

        if(firstStationName && secondStationName)
        {
            requestType = REQUEST_FROM_TO

            firstStation = stationsList.find(station => station.title.toLowerCase() === firstStationName.toLowerCase());
            secondStation = stationsList.find(station => station.title.toLowerCase() === secondStationName.toLowerCase());

            const params = new URLSearchParams(
            {
                from: firstStation.code,
                to: secondStation.code,
                date: date
            });

            try
            {
                const response = await fetch(`${SERVER_URL}/search?${params}`);
                const data = await response.json();

                localStorage.setItem("requestType", JSON.stringify(requestType));     
                localStorage.setItem("scheduleData", JSON.stringify(data));

                window.location.href = PATH_SCHEDULE;
            }
            catch (error) 
            {
                alert("Ошибка загрузки расписания между станциями:", error);
            }
        }
        else if(firstStationName && !secondStationName)
        {
            requestType = REQUEST_FROM

            firstStation = stationsList.find(station => station.title.toLowerCase() === firstStationName.toLowerCase());

            const params = new URLSearchParams(
            {
                station: firstStation.code,
                date: date,
                event: "departure"
            });

            try
            {
                const response = await fetch(`${SERVER_URL}/schedule?${params}`);
                const data = await response.json();

                localStorage.setItem("requestType", JSON.stringify(requestType));     
                localStorage.setItem("scheduleData", JSON.stringify(data));

                window.location.href = PATH_SCHEDULE;
            }
            catch (error) 
            {
                alert("Ошибка загрузки расписания по станции:", error);
            }
        }
        else if(!firstStationName && secondStationName)
        {
            requestType = REQUEST_TO

            secondStation = stationsList.find(station => station.title.toLowerCase() === secondStationName.toLowerCase());

            const params = new URLSearchParams(
            {
                station: secondStation.code,
                date: date,
                event: "arrival"
            });

            try
            {
                const response = await fetch(`${SERVER_URL}/schedule?${params}`);
                const data = await response.json();

                localStorage.setItem("requestType", JSON.stringify(requestType));     
                localStorage.setItem("scheduleData", JSON.stringify(data));

                window.location.href = PATH_SCHEDULE;
            }
            catch (error) 
            {
                alert("Ошибка загрузки расписания по станции:", error);
            }
        }
    }
    else alert("Пожалуйста, введите дату!");
}