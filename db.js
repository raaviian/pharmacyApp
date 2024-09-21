const { Sequelize } = require('sequelize');
require('dotenv').config();  // Load environment variables from .env file

// Create a Sequelize instance and pass environment variables
const sequelize = new Sequelize(
    process.env.DB_NAME,   // Database name
    process.env.DB_USER,   // Database username
    process.env.DB_PASSWORD,  // Database password
    {
        host: process.env.DB_HOST,  // Database host
        dialect: 'mysql',           // We are using MySQL
        port: process.env.DB_PORT || 3306,  // Default to 3306 if not set
        logging: false,  // Disable logging for production (optional)
    }
);

// Test the database connection
sequelize.authenticate()
    .then(() => {
        console.log('Database connected successfully!');
    })
    .catch(err => {
        console.error('Error: Unable to connect to the database:', err);
    });

module.exports = sequelize;
