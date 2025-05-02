// API Configuration
const API_KEY = '4f5aea147f808ead2e4b448ee646240e'; // Replace with your OpenWeatherMap API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const elements = {
    cityInput: document.getElementById('city-input'),
    searchBtn: document.getElementById('search-btn'),
    locationBtn: document.getElementById('location-btn'),
    cityName: document.getElementById('city-name'),
    currentDate: document.getElementById('current-date'),
    weatherIcon: document.getElementById('weather-icon'),
    currentTemp: document.getElementById('current-temp'),
    weatherDesc: document.getElementById('weather-desc'),
    humidity: document.getElementById('humidity'),
    windSpeed: document.getElementById('wind-speed'),
    feelsLike: document.getElementById('feels-like'),
    forecastContainer: document.getElementById('forecast-container'),
    hourlyContainer: document.getElementById('hourly-container'),
    themeToggle: document.getElementById('theme-toggle'),
    loading: document.getElementById('loading')
};

// Initialize the app
function init() {
    // Set current date
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    elements.currentDate.textContent = today.toLocaleDateString('en-US', options);
    
    // Load default city or from localStorage
    const lastCity = localStorage.getItem('lastCity') || 'London';
    elements.cityInput.value = lastCity;
    fetchWeatherData(lastCity);
    
    // Set up event listeners
    setupEventListeners();
    
    // Check for preferred color scheme
    checkPreferredTheme();
}

// Set up event listeners
function setupEventListeners() {
    elements.searchBtn.addEventListener('click', () => {
        const city = elements.cityInput.value.trim();
        if (city) {
            fetchWeatherData(city);
        }
    });
    
    elements.locationBtn.addEventListener('click', getWeatherByLocation);
    
    elements.cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const city = elements.cityInput.value.trim();
            if (city) {
                fetchWeatherData(city);
            }
        }
    });
    
    elements.themeToggle.addEventListener('click', toggleTheme);
}

// Fetch weather data from API
async function fetchWeatherData(city) {
    showLoading(true);
    
    try {
        // Fetch current weather and forecast in parallel
        const [currentResponse, forecastResponse] = await Promise.all([
            fetch(`${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`),
            fetch(`${BASE_URL}/forecast?q=${city}&units=metric&appid=${API_KEY}`)
        ]);
        
        if (!currentResponse.ok || !forecastResponse.ok) {
            throw new Error('City not found');
        }
        
        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();
        
        // Save city to localStorage
        localStorage.setItem('lastCity', city);
        
        // Update UI
        updateCurrentWeather(currentData);
        updateForecast(forecastData);
        updateHourlyForecast(forecastData);
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert('Error fetching weather data. Please check the city name and try again.');
    } finally {
        showLoading(false);
    }
}

// Get weather by current location
async function getWeatherByLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }
    
    showLoading(true);
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
                const [currentResponse, forecastResponse] = await Promise.all([
                    fetch(`${BASE_URL}/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`),
                    fetch(`${BASE_URL}/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`)
                ]);
                
                if (!currentResponse.ok || !forecastResponse.ok) {
                    throw new Error('Location not found');
                }
                
                const currentData = await currentResponse.json();
                const forecastData = await forecastResponse.json();
                
                // Update UI and input field
                elements.cityInput.value = currentData.name;
                localStorage.setItem('lastCity', currentData.name);
                
                updateCurrentWeather(currentData);
                updateForecast(forecastData);
                updateHourlyForecast(forecastData);
                
            } catch (error) {
                console.error('Error fetching weather data:', error);
                alert('Error fetching weather data for your location. Please try again.');
            } finally {
                showLoading(false);
            }
        },
        (error) => {
            console.error('Error getting location:', error);
            alert('Unable to retrieve your location. Please enable location services.');
            showLoading(false);
        }
    );
}

// Update current weather UI
function updateCurrentWeather(data) {
    elements.cityName.textContent = `${data.name}, ${data.sys.country}`;
    elements.currentTemp.textContent = Math.round(data.main.temp);
    elements.weatherDesc.textContent = data.weather[0].description;
    elements.humidity.textContent = data.main.humidity;
    elements.windSpeed.textContent = Math.round(data.wind.speed * 3.6); // Convert m/s to km/h
    elements.feelsLike.textContent = Math.round(data.main.feels_like);
    elements.weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    elements.weatherIcon.alt = data.weather[0].description;
}

// Update 5-day forecast UI
function updateForecast(data) {
    elements.forecastContainer.innerHTML = '';
    
    // Get daily forecast (every 24 hours)
    const dailyForecast = data.list.filter((item, index) => index % 8 === 0).slice(0, 5);
    
    dailyForecast.forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';
        forecastCard.innerHTML = `
            <p class="day">${dayName}</p>
            <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="${day.weather[0].description}">
            <p class="temp">${Math.round(day.main.temp)}°C</p>
            <p class="desc">${day.weather[0].description}</p>
        `;
        
        elements.forecastContainer.appendChild(forecastCard);
    });
}

// Update hourly forecast UI
function updateHourlyForecast(data) {
    elements.hourlyContainer.innerHTML = '';
    
    // Get next 12 hours of forecast
    const hourlyForecast = data.list.slice(0, 12);
    
    hourlyForecast.forEach(hour => {
        const date = new Date(hour.dt * 1000);
        const time = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
        
        const hourlyItem = document.createElement('div');
        hourlyItem.className = 'hourly-item';
        hourlyItem.innerHTML = `
            <p class="time">${time}</p>
            <img src="https://openweathermap.org/img/wn/${hour.weather[0].icon}.png" alt="${hour.weather[0].description}">
            <p class="temp">${Math.round(hour.main.temp)}°C</p>
        `;
        
        elements.hourlyContainer.appendChild(hourlyItem);
    });
}

// Toggle between light and dark theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    
    if (currentTheme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        elements.themeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
    }
}

// Check for preferred color scheme
function checkPreferredTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
    }
}

// Show/hide loading indicator
function showLoading(show) {
    elements.loading.style.display = show ? 'flex' : 'none';
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);