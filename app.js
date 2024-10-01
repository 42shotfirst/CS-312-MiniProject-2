const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();
const helmet = require('helmet'); // Optional: for security headers
const rateLimit = require('express-rate-limit'); // Optional: for limiting API calls

const app = express();

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Set up static folder for serving CSS (bootstrap and custom styles)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Optional: Middleware for security
app.use(helmet());

// Optional: Rate limiting for API calls to avoid abuse
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // Limit each IP to 100 requests per windowMs
});
app.use('/weather', limiter);

// Route: Home page with the input form
app.get('/', (req, res) => {
    res.render('index');
});

// Route: Handle form submission
app.post('/weather', async (req, res) => {
    const location = req.body.location.trim(); // Trim whitespace from input

    if (!location) {
        return res.render('index', { error: 'Please provide a location.' });
    }

    try {
        // Make request to OpenWeatherMap API
        const apiKey = process.env.OPENWEATHERMAP_API_KEY; // API key reference
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=imperial`;

        const response = await axios.get(url);
        const weatherData = response.data;

        // Check if the response contains valid weather data
        if (response.status !== 200 || !weatherData.main) {
            return res.render('index', { error: 'Could not fetch weather data. Please check the location and try again.' });
        }

        // Render the result page with weather data
        res.render('result', { weather: weatherData, location });
    } catch (error) {
        // Handle different types of errors
        if (error.response) {
            // Server responded with a status code outside of the 2xx range
            return res.render('index', { error: `Error: ${error.response.data.message}. Please check the location and try again.` });
        } else if (error.request) {
            // No response received from the API
            return res.render('index', { error: 'No response from weather service. Please try again later.' });
        } else {
            // Something else happened during the request setup
            return res.render('index', { error: 'An error occurred. Please try again.' });
        }
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
