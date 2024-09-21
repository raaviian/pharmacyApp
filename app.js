require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const exphbs = require('express-handlebars');
const sequelize = require('./db');
const User = require('./models/userModel');  // Import the User model
const port = process.env.PORT || 3000;
const crypto = require('crypto'); // For generating secure random tokens
const nodemailer = require('nodemailer'); // For sending emails

// Nodemailer transporter for sending emails
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    }
});

// Middleware to serve static files
app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Set up session for login persistence
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));

// Set up Handlebars view engine
app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');

// Sync the database
sequelize.sync({ alter: true })
    .then(() => console.log('Database synced'))
    .catch(err => console.error('Error syncing database: ', err));

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/login');
}

// Middleware to check user roles
function hasRole(role) {
    return function (req, res, next) {
        User.findByPk(req.session.userId).then(user => {
            if (user && user.role === role) {
                return next();
            } else {
                res.status(403).send('Access denied');
            }
        });
    };
}

// Route for home page
app.get('/', (req, res) => {
    res.send('Hello World! Welcome to your Express Web App');
});

// Route for welcome page
app.get('/welcome', (req, res) => {
    res.render('welcome', { title: 'Welcome to My Web App' });
});

// Route for registration page
app.get('/register', (req, res) => {
    res.render('register', { title: 'Register' });
});

// Route for login page
app.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
});

// Route for forgot password page
app.get('/forgot-password', (req, res) => {
    res.render('forgot-password', { title: 'Forgot Password' });
});

// Forgot password POST route
app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).send('No user found with this email');
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        const tokenExpiration = Date.now() + 3600000; // Token expires in 1 hour

        user.resetToken = resetToken;
        user.resetTokenExpiration = tokenExpiration;
        await user.save();

        const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

        await transporter.sendMail({
            to: email,
            from: process.env.EMAIL_USER,
            subject: 'Password Reset Request',
            html: `
                <h3>You requested a password reset</h3>
                <p>Click the following link to reset your password:</p>
                <a href="${resetUrl}">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
            `
        });

        res.send('Password reset instructions have been sent to your email.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error processing password reset request');
    }
});

// Route for reset password form
app.get('/reset-password/:token', async (req, res) => {
    const { token } = req.params;

    try {
        const user = await User.findOne({
            where: {
                resetToken: token,
                resetTokenExpiration: { [sequelize.Op.gt]: Date.now() }
            }
        });

        if (!user) {
            return res.status(400).send('Invalid or expired token');
        }

        res.render('reset-password', { title: 'Reset Password', token });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error processing password reset request');
    }
});

// Route to handle password reset submission
app.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        const user = await User.findOne({
            where: {
                resetToken: token,
                resetTokenExpiration: { [sequelize.Op.gt]: Date.now() }
            }
        });

        if (!user) {
            return res.status(400).send('Invalid or expired token');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        user.password = hashedPassword;
        user.resetToken = null;
        user.resetTokenExpiration = null;
        await user.save();

        res.send('Password has been successfully reset!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error resetting password');
    }
});

app.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    
    // Check if the user already exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
        return res.status(400).send('User already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user with a specific role
    const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role: role || 'patient'  // Default to 'patient' if no role is provided
    });

    req.session.userId = newUser.id;  // Log the user in
    res.redirect('/dashboard');  // Redirect to the dashboard or appropriate page
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
        return res.status(400).send('No user found with this email');
    }

    // Compare the password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        return res.status(400).send('Incorrect password');
    }

    // Log the user in
    req.session.userId = user.id;

    // Redirect user based on their role
    if (user.role === 'admin') {
        return res.redirect('/admin-dashboard');  // Redirect to admin dashboard
    } else if (user.role === 'doctor') {
        return res.redirect('/doctor-dashboard');  // Redirect to doctor dashboard
    } else {
        return res.redirect('/patient-dashboard');  // Redirect to patient dashboard
    }
});


// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Role-based routes for admin, doctor, and patient

// Admin route
app.get('/admin', isAuthenticated, hasRole('admin'), (req, res) => {
    res.send('Admin dashboard');
});

// Doctor route
app.get('/doctor', isAuthenticated, hasRole('doctor'), (req, res) => {
    res.send('Doctor dashboard');
});

// Patient route
app.get('/patient', isAuthenticated, hasRole('patient'), (req, res) => {
    res.send('Patient dashboard');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
