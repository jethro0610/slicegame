import Peer from 'peerjs';

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
    });

    conn.on('close', () => {
        console.log('Remote connection closed.');
        onCloseConnection();
    })

    conn.on('error', err => {
        console.log('Remote client error: ' + err.type);
        onCloseConnection();
    });

    remote = conn;
}

const disconnect = () => {
    if(remote === null)
        return;

    remote.close();
}

const onCloseConnection = () => {
    if(remote !== null)
        remote.close();

    remote = null;
}

window.connectToPeer = (id) => {
    setRemote(client.connect(id));
}

window.disconnectFromRemote = () => {
    disconnect();
}

export default client;