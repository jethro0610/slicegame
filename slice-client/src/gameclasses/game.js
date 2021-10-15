import GameWorld from './gameWorld';
let gameWorld = new GameWorld(800, 800);

setInterval(gameWorld.tick, 1/60.0 * 1000);

export { gameWorld };