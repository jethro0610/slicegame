import Collider from "./collider";

const levelWidth = 1600;
const levelHeight = 900;
const platforms = [];
platforms.push(new Collider(100, (levelHeight / 2), 400, 16));
platforms.push(new Collider(levelWidth - 500, (levelHeight / 2), 400, 16));
platforms.push(new Collider((levelWidth / 2) - 150, (levelHeight /4), 300, 16));
platforms.push(new Collider((levelWidth / 2) - 250, (levelHeight / 2) + (levelHeight /4), 500, 16));

export { levelWidth, levelHeight,platforms }