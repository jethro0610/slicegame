import io from 'socket.io-client'
let socket;

const connectToMatchmaking = (id, onConnectionFound) => {
    socket = io.connect(process.env.REACT_APP_BACKEND_ORIGIN, {
        withCredentials: true
    });

    socket.on('connect', () => {
        console.log('Got connection to matchmaking server');
    });

    socket.on('match-found', (opponentId) => {
        onConnectionFound(opponentId);
    })

    socket.emit('client-id', id);
}

const requestSearch = () => {
    socket.emit('request-search');
}

window.requestSearch = () => {
    requestSearch();
}

export { connectToMatchmaking, requestSearch };