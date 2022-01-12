const socketIO = require('socket.io');
const geoip = require('geoip-lite');
const lodash = require('lodash');
const haversine = require('haversine-distance');
const { ExpressPeerServer } = require ('peer');
let io;
let peerServer;

const searchingClients = [];
const socketIds = new Set();

const generateID = () => {
    return Math.random().toString(36);
};

const initSocketIO = (http, corsOptions) => {
    // Start socket.io
    io = socketIO(http, {
        cors: corsOptions
    });

    io.on('connection', (socket) => {
        socket.on('request-search', () => {
            if (!searchingClients.includes(socket)) {
                searchingClients.push(socket);
                socket.searches = 0;
            }
        });

        socket.on('client-id', (id) => {
            if (!socketIds.has(id)) {
                // Assign the peer id to the associated socket
                socket.peerId = id;
                socketIds.add(id)
            }
        });

        socket.on('disconnect', () => {
            // Remove the disconnecting id
            socketIds.delete(socket.peerId);
            lodash.remove(searchingClients, (client) => {
                return client === socket;
            });
        });

        const socketIP = socket.request.headers['x-forwarded-for'];
        if (socketIP != undefined) {
            const geoipInfo = geoip.lookup(socketIP);
            if (geoipInfo != undefined) {
                socket.location = geoipInfo.ll;
            }
        }

        console.log('Client connected at: ' + socket.location);
    })

    return io;
}

const getDistance = (socket1, socket2) => {
    if (socket1.location == undefined || socket2.location == undefined)
        return Infinity;

    return haversine(socket1.location, socket2.location);
}

const initPeerServer = (server) => {
    peerServer = ExpressPeerServer(server, {path: '/matchmaking', generateClientId: generateID});
    return peerServer;
}

const assignMatch = (clientToAssign) => {
    clientToAssign.searches += 1;

    // Pick a random client to potentially match with
    const foundClient = searchingClients[Math.floor(Math.random()*searchingClients.length)];
    if (foundClient === clientToAssign)
        return;

    // Don't match if the distance is too far and the search hasn't been long
    const distance = getDistance(clientToAssign, foundClient);
     // Only do distance check if both clients have a distance, otherwise both will match
    if (clientToAssign.location !== undefined && foundClient.location !== undefined) {
        if (distance > 804672 && clientToAssign.searches < 20)
            return;
    }

    // Send the found match and remove both clients from the search
    clientToAssign.emit('match-found', foundClient.peerId);
    lodash.remove(searchingClients, client => client == clientToAssign);
    lodash.remove(searchingClients, client => client == foundClient);
    console.log(getDistance(clientToAssign, foundClient));
}

const assignMatches = () => {
    for (let i = 0; i < searchingClients.length; i++) {
        assignMatch(searchingClients[i]);
    }
}

setInterval(assignMatches, 16);

module.exports = { initSocketIO, initPeerServer }