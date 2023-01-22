const domDisplay = (aSearchResult, temperature, flag, localTime) => {
    //Generate and display the search results
    const searchResult = document.createElement('div');
    searchResult.classList.add('searchResult')

    const city = document.createElement('span').textContent = aSearchResult.city + ", ";
    searchResult.append(city)

    if (aSearchResult.state) {
        const state = document.createElement('span').textContent = aSearchResult.state + ", ";
        searchResult.append(state)
    }
    if (aSearchResult.country) {
        const country = document.createElement('span').textContent = aSearchResult.country + "";
        searchResult.append(country)
    }
    if (flag) {
        const flagIcon = document.createElement('img');
        flagIcon.crossOrigin = 'anonymous'
        flagIcon.src = flag;
        searchResult.append(flagIcon)
    }
    document.body.append(searchResult)


    searchResult.addEventListener('click', (event) => {
        //Hide all search results
        document.querySelectorAll('.searchResult').forEach(result => result.remove());

        //Store selected city in localStorage
        const myCity = { aSearchResult };
        localStorage.setItem("myCity", JSON.stringify(myCity));

        //Set background gradient colors based on temp and time
        //Cold = blue, warm = red, night = dark-blue, day = orange
        let red = (temperature + 40) / 80 * 255;
        let blue = (80 - temperature) / 80 * 255;
        let [hours] = localTime.split(':').map(Number);
        let timeColor;
        if (hours >= 6 && hours < 18) {
            timeColor = 'orange';
        } else {
            timeColor = 'rgb(0,0,50)';
        }

        const root = document.documentElement.style;
        root.setProperty("--red", red);
        root.setProperty("--blue", blue);
        root.setProperty("--color", timeColor);
        const gradient = document.querySelector('.gradient');
        gradient.classList.toggle('active');

        //Display full city name, temp, time of temp fetch and option to change city
        inputAndSearch.remove();
        const temperatureDisplay = document.createElement('div');
        const tempLabel = document.createElement('div');
        const timeDisplay = document.createElement('div');
        const changeCity = document.createElement('button')

        timeDisplay.classList.add('timeDisplay')
        tempLabel.classList.add('tempLabel')
        temperatureDisplay.classList.add('temperatureDisplay');
        changeCity.classList.add('changeCity')

        timeDisplay.textContent = "Temperature fetched: " + localTime
        tempLabel.textContent = event.target.textContent;
        temperatureDisplay.textContent = temperature + "°C";
        changeCity.textContent = "Change city"

        changeCity.addEventListener('click', () => {
            localStorage.clear();
            location.reload();
        })

        document.title = "Current Temperature in: " + event.target.textContent;
        document.body.append(changeCity, tempLabel, temperatureDisplay, timeDisplay)
        document.body.style.justifyContent = "space-around";
    });
}

//Start of data gathering
const search = async (searchTerm) => {
    try {
        const res = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${searchTerm}`
        );
        const data = await res.json();
        for (let key = 0; key < Object.keys(data.results).length; key++) {
            document.body.classList.add('disabled');
            const searchResult = {
                city: data.results[key].name,
                country: data.results[key].country,
                state: data.results[key].admin1,
                latitude: data.results[key].latitude,
                longitude: data.results[key].longitude,
                country_code: data.results[key].country_code,
                timezone: data.results[key].timezone
            }
            const temperature = await getTemperature(searchResult.latitude, searchResult.longitude);
            const flag = await getFlag(searchResult.country_code);
            const localTime = getLocalTime(searchResult.timezone);
            domDisplay(searchResult, temperature, flag, localTime)
            document.body.classList.remove('disabled');
        }

    }
    catch (error) {
        input.value = ''
        input.placeholder = 'city not found'
        console.log(error)
    }
};

const getTemperature = async (lat, long) => {
    try {
        const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&current_weather=true&`
        );
        const data = await res.json();
        return data.current_weather.temperature
    }
    catch (error) {
        return 'temperature unavailable'
    }
}

const getFlag = async (country_code) => {
    try {
        const res = await fetch(
            `https://countryflagsapi.com/svg/${country_code}`
        );
        return res.url
    }
    catch (error) {
        return 'flag unavailable'
    }
}

const getLocalTime = (timeZone) => {
    let date = new Date();
    let options = { timeZone: timeZone, hour12: false, hour: "numeric", minute: "numeric", second: "numeric" };
    return date.toLocaleString("en-US", options);
}

//If a city is stored in localStorage - get the current temperature and localTime and display as single search result
const getLocalStorage = async () => {
    const temperature = await getTemperature(myCity.aSearchResult.latitude, myCity.aSearchResult.longitude);
    const flag = await getFlag(myCity.aSearchResult.country_code);
    const localTime = getLocalTime(myCity.aSearchResult.timezone);
    domDisplay(myCity.aSearchResult, temperature, flag, localTime)
}

let myCity = JSON.parse(localStorage.getItem("myCity")) || {};
if (Object.keys(myCity).length > 0) {
    getLocalStorage()
}

//Home page
const inputAndSearch = document.createElement('div');
const input = document.createElement('input');
const searchBtn = document.createElement('button');

inputAndSearch.append(input, searchBtn);
document.body.append(inputAndSearch);
document.body.classList.add('gradient')

inputAndSearch.classList.add('inputAndSearch')
input.placeholder = 'City'
searchBtn.textContent = 'Search'

input.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
})

searchBtn.addEventListener('click', () => {
    document.querySelectorAll('.searchResult').forEach(result => result.remove());
    let cleanSearch = input.value.replace(/[^a-zåäöA-Z\s]/g, "");
    search(cleanSearch)
})
