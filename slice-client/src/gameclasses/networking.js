import Peer from 'peerjs';
import { startGame, stopGame, gameWorld } from './game';

let client = new Peer();
let remote = null;
let isHost = false;

client.on('open', (id) => {
    console.log('Opened PeerJS connection with ID: ' + id);
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
        startGame(conn, isHost);
    });

    conn.on('close', () => {
        console.log('Remote connection closed.');
        onCloseRemote();
    })

    conn.on('error', err => {
        console.log('Remote client error: ' + err.type);
        onCloseRemote();
    });

    conn.on('data', data => {
        console.log(data);
    })

    remote = conn;
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

window.connectToPeer = (id) => {
    setRemote(client.connect(id));
}

window.disconnectFromRemote = () => {
    disconnect();
}

export default client;