const socketIO = require('socket.io');
let io;

const initSocketIO = (http, corsOptions) => {
    // Start socket.io
    io = socketIO(http, {
        cors: corsOptions
    });

    io.on('connection', (socket) => {
        socket.on('request-search', () => {
            console.log('Recieved search request');
        })
    })
}

module.exports = { initSocketIO }