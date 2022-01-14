import io from 'socket.io-client'
import { setSearching } from './redux/reducers/searching'
import store from './redux/store/store'
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

    socket.on('confirm-search', () => {
        store.dispatch(setSearching(true));
    })

    socket.on('stop-search', () => {
        store.dispatch(setSearching(false));
    })

    socket.emit('client-id', id);
}

const requestSearch = () => {
    socket.emit('request-search');
}

const requestStopSearch = () => {
    socket.emit('request-stop-search');
}

window.requestSearch = () => {
    requestSearch();
}

export { connectToMatchmaking, requestSearch, requestStopSearch };