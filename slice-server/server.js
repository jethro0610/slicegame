const express = require('express');
const cors = require('cors');
const socketIO = require('socket.io');

// Set CORS options
const corsOptions = {
    origin: process.env.FRONTEND_ORIGIN,
    credentials: true
};

// Setup express app
const app = express();
const port = process.env.PORT || 5000;
app.use(cors(corsOptions));
app.use(express.json());
const http = require('http').createServer(app);

// Start socket.io
const io = socketIO(http, {
    cors: corsOptions
});

// Listen on port
http.listen(port, () => {
    console.log(`Server started on port: ${port}`);
});