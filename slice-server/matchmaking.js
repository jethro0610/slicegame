const socketIO = require('socket.io');
const geoip = require('geoip-lite');
const { ExpressPeerServer } = require ('peer');
let io;
let peerServer;
const idSocket = new Map();
const searchingClients = new Set();

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
            searchingClients.add(socket);
        });

        socket.on('client-id', (id) => {
            if (!idSocket.has(id)) {
                // Assign the peer id to the associated socket
                socket.peerId = id;
                idSocket.set(id, socket);
            }
        });

        socket.on('disconnect', () => {
            // Remove the disconnecting id
            idSocket.delete(socket.peerId);
            searchingClients.delete(socket);
        });
        console.log(socket.request.client._peername);
    })

    return io;
}

const initPeerServer = (server) => {
    peerServer = ExpressPeerServer(server, {path: '/matchmaking', generateClientId: generateID});
    return peerServer;
}

const assignMatch = () => {
    const [clientToAssign] = searchingClients; // Assign a match to the first client that searched
    let foundClient = undefined;
    
    // Connect to the next client that's also searching
    for (var it = searchingClients.values(), client = null; client=it.next().value; ){
        if (client !== clientToAssign) {
            foundClient = client;
            clientToAssign.emit('match-found', foundClient.peerId);
            break;
        }
    }

    // Remove the clients from the search if a match was found
    if (foundClient !== undefined) {
        searchingClients.delete(clientToAssign);
        searchingClients.delete(foundClient);
    }
}

setInterval(assignMatch, 500);

module.exports = { initSocketIO, initPeerServer }