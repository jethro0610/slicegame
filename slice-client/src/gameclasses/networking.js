import Peer from 'peerjs';
import { startGame, stopGame } from './game';

let client = new Peer();
let remote = null;

client.on('open', (id) => {
    console.log('Opened PeerJS connection with ID: ' + id);
});

client.on('connection', (conn) => {
    console.log('Got a connection.');
    setRemote(conn);
});

const setRemote = (conn) => {
    if (conn === null)
        return;

    conn.on('open', () => {
        console.log('Remote connection opened.');
        startGame();
    });

    conn.on('close', () => {
        console.log('Remote connection closed.');
        onCloseRemote();
    })

    conn.on('error', err => {
        console.log('Remote client error: ' + err.type);
        onCloseRemote();
    });

    remote = conn;
}

const onCloseRemote = () => {
    // Ensure the connection is closed
    if(remote !== null)
        remote.close();

    // Unset the remote connection
    remote = null;
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