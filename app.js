require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const sequelize = require('./db'); // Import sequelize only once
const exphbs = require('express-handlebars');

// Middleware to serve static files (for Bootstrap CSS/JS files)
app.use(express.static('public'));

// Body parser middleware
app.use(express.urlencoded({ extended: true }));

// Set up Handlebars view engine
app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');

// Simple route for home
app.get('/', (req, res) => {
    res.send('Hello World! Welcome to your Express Web App');
});

// Example route to render a view
app.get('/welcome', (req, res) => {
    res.render('welcome', { title: 'Welcome to My Web App' });
});

// Sync the database (for Sequelize)
sequelize.sync()
    .then(() => console.log('Database synced'))
    .catch(err => console.error('Error syncing database: ', err));

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
