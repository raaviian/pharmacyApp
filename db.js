const { Sequelize } = require('sequelize');
require('dotenv').config(); // Load environment variables from .env file

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    logging: false, // Disable logging in production
});

// Test the connection
sequelize.authenticate()
    .then(() => console.log('Connected to the JawsDB MySQL database!'))
    .catch(err => console.error('Unable to connect to the database:', err));

module.exports = sequelize;
