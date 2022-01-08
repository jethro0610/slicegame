import Peer from 'peerjs';
import { startGame, stopGame, gameWorld } from './gameWorld';
import { connectToMatchmaking } from '../matchmaking';

const client = new Peer({
    host: 'localhost',
    port: 5000,
    path: '/matchmaking'
});
let remote = null;
let isHost = false;

let ping = 0;
let pingRequestTime = 0;

// Request ping every second
setInterval(() => {
    if (remote == null) 
        return;

    remote.send('request-ping');
    pingRequestTime = performance.now();
}, 1000);

client.on('open', (id) => {
    console.log('Opened PeerJS connection with ID: ' + id);
    connectToMatchmaking(id, connectToPeer); // Connect to the matchmaking server once a peer id is assigned
});

client.on('connection', (conn) => {
    console.log('Got a connection.');
    isHost = true;
    setRemote(conn);
});

const setRemote = (conn) => {
    if (conn === null)
        return;

    conn.on('open', () => {
        console.log('Remote connection opened.');
        remote = conn;
        startGame(conn, isHost);
    });

    conn.on('close', () => {
        console.log('Remote connection closed.');
        onCloseRemote();
    })

    conn.on('error', err => {
        console.log('Remote client error: ' + err);
        onCloseRemote();
    });

    conn.on('data', data => {
        if (data.frame !== undefined)
            gameWorld.onRecieveRemoteInput(data);

        if(data === 'request-ping')
            conn.send('ping');

        if(data === 'ping') {
            ping = performance.now() - pingRequestTime;
        }
    })
}

const onCloseRemote = () => {
    // Ensure the connection is closed
    if(remote !== null)
        remote.close();

    // Unset the remote connection
    remote = null;
    isHost = false;
    stopGame();
}

const disconnect = () => {
    if(remote === null)
        return;

    remote.close();
}

const connectToPeer = (id) => {
    setRemote(client.connect(id));
}

window.connectToPeer = (id) => {
    connectToPeer();
}

window.disconnectFromRemote = () => {
    disconnect();
}

export { ping, disconnect };