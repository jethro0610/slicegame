import io from 'socket.io-client'
const socket = io.connect(process.env.REACT_APP_BACKEND_ORIGIN, {
    withCredentials: true
});

socket.on('connect', () => {
    console.log('Got connection to matchmaking server')
});

const requestSearch = () => {
    socket.emit('request-search');
}

window.requestSearch = () => {
    requestSearch();
}