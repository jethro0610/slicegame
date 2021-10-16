import GameWorld from './gameWorld';
import store from '../redux/store/store';
import { setStarted } from '../redux/reducers/gameStarted';

let gameWorld = null;
const frameTime = (1/60.0) * 1000;
const maxStateRecordings = 600;

const startGame = (remote, isHost) => {
    gameWorld = new GameWorld(800, 800, remote, isHost);
    store.dispatch(setStarted(true));
}

const stopGame = () => {
    store.dispatch(setStarted(false));
    gameWorld = null;
}

const lerp = (a, b, t) => {
    return (1 - t) * a + t * b;
}

export { stopGame, startGame, gameWorld, lerp, frameTime, maxStateRecordings };