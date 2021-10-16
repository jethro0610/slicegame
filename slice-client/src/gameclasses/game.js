import GameWorld from './gameWorld';
import store from '../redux/store/store';
import { setStarted } from '../redux/reducers/gameStarted';

let gameWorld = null;
const frameTime = (1/60.0) * 1000;
const maxStateRecordings = 600;

const startGame = () => {
    gameWorld = new GameWorld(800, 800);
    store.dispatch(setStarted(true));
}

const stopGame = () => {
    gameWorld = null;
    store.dispatch(setStarted(false));
}

const lerp = (a, b, t) => {
    return (1 - t) * a + t * b;
}

export { stopGame, startGame, gameWorld, lerp, frameTime, maxStateRecordings };