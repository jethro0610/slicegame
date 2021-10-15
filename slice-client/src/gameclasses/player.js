import Collider from "./collider";
import { gameWorld, lerp } from "./game";

const playerWidth = 32;
const playerHeight = 32
const gravity = 1;

class Player{
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.lastX = x;
        this.lastY = y;

        this.velY = 0;

        this.collider = new Collider(x, y, playerWidth, playerHeight);
    }

    draw = (ctx, interp) => {
        let drawX = lerp(this.lastX, this.x, interp);
        let drawY = lerp(this.lastY, this.y, interp);

        ctx.fillStyle = 'green';
        ctx.fillRect(drawX, drawY, playerWidth, playerHeight);
    }

    tick = () => {
        this.lastX = this.x;
        this.lastY = this.y;

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