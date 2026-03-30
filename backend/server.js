const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http'); // 1. Import http
const { Server } = require('socket.io'); // 2. Import socket.io
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const requestLogger = require('./middleware/requestLogger');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const { app, server, io } = require("./lib/socket");

// Middleware
app.use(requestLogger);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
const allowedOrigins = [
    /^https:\/\/chat-app-.*\.vercel\.app$/, // Match any Vercel deployment for this project
    'https://chat-app-umber-seven-73.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        const isAllowed = allowedOrigins.some(allowed => {
            if (allowed instanceof RegExp) {
                return allowed.test(origin);
            }
            return allowed === origin;
        });

        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn('CORS blocked origin:', origin);
            callback(null, false);
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
}));

// Routes
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));

app.get('/', (req, res) => {
    const dbStatus = require('mongoose').connection.readyState === 1 ? "Connected" : "Disconnected";
    res.json({
        message: 'API is running...',
        database: dbStatus,
        version: "1.1.0"
    });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, console.log(`Server running on port ${PORT}`));
