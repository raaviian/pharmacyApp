const { DataTypes } = require('sequelize');
const sequelize = require('../db');  // Import the Sequelize instance

// Define the User model
const User = sequelize.define('User', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    resetToken: {
        type: DataTypes.STRING, // Token to reset password
        allowNull: true,
    },
    resetTokenExpiration: {
        type: DataTypes.DATE, // Expiration time for the reset token
        allowNull: true,
    },
    role: {
        type: DataTypes.ENUM('admin', 'patient', 'doctor'),  // Role can be 'admin', 'patient', or 'doctor'
        allowNull: false,
        defaultValue: 'patient'  // Default to 'patient' for general users
    }
}, {
    tableName: 'users'  // Optional: specify a custom table name
});

module.exports = User;
