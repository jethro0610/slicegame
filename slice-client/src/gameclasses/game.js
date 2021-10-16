import GameWorld from './gameWorld';
let gameWorld = new GameWorld(800, 800);
let frameTime = (1/60.0) * 1000;

const lerp = (a, b, t) => {
    return (1 - t) * a + t * b;
}

export { gameWorld, lerp, frameTime };