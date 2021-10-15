import Collider from "./collider";
import { gameWorld } from "./game";

const playerWidth = 32;
const playerHeight = 32
const gravity = 0.5;

class Player{
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.velY = 0;

        this.collider = new Collider(x, y, playerWidth, playerHeight);
    }

    draw = ctx => {
        ctx.fillRect(this.x, this.y, playerWidth, playerHeight);
    }

    tick = () => {
        this.velY += gravity;
        this.y += this.velY;

        this.collider.x = this.x;
        this.collider.y = this.y;

        if(this.collider.getBottom() >= gameWorld.height) {
            this.y = gameWorld.height - playerHeight;
            this.velY = 0;
        }
    }
}

export default Player;