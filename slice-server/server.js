// Load the enviornment variables
if (process.env.NODE_ENV !== 'production')
    require('dotenv').config({path:'./.env.' + process.env.NODE_ENV});

const express = require('express');
const cors = require('cors');
const matchmaking = require('./matchmaking')

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

// Start SocketIO in matchmaking
const io = matchmaking.initSocketIO(http, corsOptions);

// Route the frontend
if (process.env.NODE_ENV !== 'development') {
    app.use(express.static('../slice-client/build'));
    app.get('/*', function(req,res) {
        res.sendFile(path.join(__dirname, '../slice-client/build', 'index.html'));
    });
}

// Listen on port
const server = http.listen(port, () => {
    console.log(`Server started on port: ${port}`);
});
app.use(matchmaking.initPeerServer(server));