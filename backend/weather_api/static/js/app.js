let activeUnit = localStorage.getItem('tempUnit') || 'C';
let currentWeatherData = null;

document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    updateToggleButtons();

    const cityInput = document.getElementById('cityInput');
    if (cityInput) {
        cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchWeather();
            }
        });
    }
});

// CSRF helper for Django POST/DELETE requests
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function updateToggleButtons() {
    const toggleC = document.getElementById('toggleC');
    const toggleF = document.getElementById('toggleF');
    if (!toggleC || !toggleF) return;

    if (activeUnit === 'C') {
        toggleC.className = "px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 bg-blue-500 text-white shadow-md";
        toggleF.className = "px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 text-gray-300 hover:text-white";
    } else {
        toggleF.className = "px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 bg-blue-500 text-white shadow-md";
        toggleC.className = "px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 text-gray-300 hover:text-white";
    }
}

function setUnit(unit) {
    if (activeUnit === unit) return;
    activeUnit = unit;
    localStorage.setItem('tempUnit', unit);
    updateToggleButtons();
    if (currentWeatherData) {
        updateWeatherUI(currentWeatherData);
    }
}

function updateBackground(icon) {
    const body = document.getElementById('appBody');
    if (!body || !icon) return;

    // Extract prefix (e.g. "01", "02")
    const code = icon.substring(0, 2);
    const isNight = icon.endsWith('n');

    let newGradient = "from-blue-900 to-purple-900"; // default

    switch (code) {
        case '01': // Clear sky
            newGradient = isNight 
                ? "from-slate-950 via-indigo-950 to-blue-900" 
                : "from-amber-400 via-orange-400 to-indigo-900";
            break;
        case '02': // Few clouds
        case '03': // Scattered clouds
        case '04': // Broken/Overcast clouds
            newGradient = "from-slate-600 via-blue-800 to-indigo-950";
            break;
        case '09': // Shower rain
        case '10': // Rain
            newGradient = "from-slate-800 via-sky-950 to-indigo-950";
            break;
        case '11': // Thunderstorm
            newGradient = "from-zinc-900 via-purple-950 to-slate-950";
            break;
        case '13': // Snow
            newGradient = "from-sky-200 via-sky-600 to-indigo-950";
            break;
        case '50': // Mist/Fog
            newGradient = "from-teal-950 via-slate-800 to-gray-900";
            break;
    }

    body.className = "min-h-screen text-white flex items-center justify-center p-4 transition-all duration-1000 bg-gradient-to-br " + newGradient;
}

async function searchWeather(city = null) {
    const input = document.getElementById('cityInput');
    const query = city || input.value.trim();

    if (!query) return;

    // Reset error UI
    document.getElementById('errorMessage').classList.add('hidden');

    try {
        const response = await fetch(`/api/weather/${query}/`);
        const data = await response.json();

        if (response.ok) {
            updateWeatherUI(data);
            loadHistory(); // Refresh history
            input.value = ''; // Clear input
        } else {
            showError(data.error || data.message || 'City not found');
        }
    } catch (error) {
        showError('Something went wrong. Please try again.');
        console.error(error);
    }
}

function updateWeatherUI(data) {
    currentWeatherData = data;
    
    const current = data.current;
    const forecast = data.forecast || [];
    
    document.getElementById('cityName').textContent = current.city;
    document.getElementById('weatherDesc').textContent = current.description;

    // Convert temperature
    let displayTemp = current.temp;
    if (activeUnit === 'F') {
        displayTemp = (current.temp * 9/5) + 32;
    }

    document.getElementById('temperature').textContent = `${Math.round(displayTemp)}°${activeUnit}`;
    document.getElementById('humidity').textContent = `${current.humidity}%`;
    document.getElementById('windSpeed').textContent = `${current.wind_speed} m/s`;

    // Make sure we use https for OpenWeatherMap icons
    const iconUrl = `https://openweathermap.org/img/wn/${current.icon}@2x.png`;
    document.getElementById('weatherIcon').src = iconUrl;

    const weatherCard = document.getElementById('weatherCard');
    weatherCard.classList.remove('hidden');

    // Update dynamic background
    updateBackground(current.icon);

    // Render Forecast
    const forecastContainer = document.getElementById('forecastContainer');
    forecastContainer.innerHTML = '';

    forecast.forEach(item => {
        let itemTemp = item.temp;
        if (activeUnit === 'F') {
            itemTemp = (item.temp * 9/5) + 32;
        }

        const column = document.createElement('div');
        column.className = 'flex flex-col items-center py-2 px-1 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm';

        const dayLabel = document.createElement('span');
        dayLabel.className = 'text-xs text-gray-300 font-semibold mb-1';
        dayLabel.textContent = item.day;

        const iconImg = document.createElement('img');
        iconImg.src = `https://openweathermap.org/img/wn/${item.icon}@2x.png`;
        iconImg.alt = item.description;
        iconImg.title = item.description;
        iconImg.className = 'w-10 h-10 drop-shadow-sm';

        const tempLabel = document.createElement('span');
        tempLabel.className = 'text-sm font-bold mt-1';
        tempLabel.textContent = `${Math.round(itemTemp)}°`;

        column.appendChild(dayLabel);
        column.appendChild(iconImg);
        column.appendChild(tempLabel);

        forecastContainer.appendChild(column);
    });
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

async function loadHistory() {
    try {
        const response = await fetch('/api/history/');
        const data = await response.json();

        const historyList = document.getElementById('historyList');
        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        
        historyList.innerHTML = '';

        if (data.length > 0) {
            clearHistoryBtn.classList.remove('hidden');
        } else {
            clearHistoryBtn.classList.add('hidden');
        }

        data.forEach(item => {
            // Container for badge
            const container = document.createElement('div');
            container.className = 'flex items-center space-x-1 pl-3 pr-2 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-sm transition backdrop-blur-sm border border-white/10 group';

            // City name button
            const cityBtn = document.createElement('button');
            cityBtn.className = 'cursor-pointer hover:text-blue-300 transition-colors font-medium';
            cityBtn.textContent = item.city_name;
            cityBtn.onclick = () => searchWeather(item.city_name);

            // Delete cross button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn text-gray-400 hover:text-red-400 text-xs font-bold pl-1.5 focus:outline-none cursor-pointer';
            deleteBtn.innerHTML = '&#x2715;'; // Unicode multiplication sign (×)
            deleteBtn.title = `Delete ${item.city_name}`;
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                deleteHistoryItem(item.id);
            };

            container.appendChild(cityBtn);
            container.appendChild(deleteBtn);
            historyList.appendChild(container);
        });
    } catch (error) {
        console.error('Failed to load history:', error);
    }
}

async function deleteHistoryItem(itemId) {
    try {
        const response = await fetch(`/api/history/${itemId}/`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            }
        });
        if (response.ok) {
            loadHistory();
        } else {
            console.error('Failed to delete history item');
        }
    } catch (error) {
        console.error('Error deleting history item:', error);
    }
}

async function clearAllHistory() {
    try {
        const response = await fetch('/api/history/clear/', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            }
        });
        if (response.ok) {
            loadHistory();
        } else {
            console.error('Failed to clear history');
        }
    } catch (error) {
        console.error('Error clearing history:', error);
    }
}
