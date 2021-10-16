import Collider from "./collider";
import { gameWorld, lerp } from "./game";
import localInput from "./input";

const playerWidth = 32;
const playerHeight = 32
const gravity = 1;


const groundFriction = 0.2;
const maxSpeed = 10;
const groundAcceleration = maxSpeed * groundFriction / (-groundFriction + 1.0);

class Player{
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.lastX = x;
        this.lastY = y;

        this.velX = 0;
        this.velY = 0;

        this.collider = new Collider(x, y, playerWidth, playerHeight);
    }

    draw = (ctx, interp) => {
        // Get the position to draw the player in
        // It interpolates between the position two ticks, and on tick ago
        let drawX = lerp(this.lastX, this.x, interp);
        let drawY = lerp(this.lastY, this.y, interp);

        // Draw the player
        ctx.fillStyle = 'green';
        ctx.fillRect(drawX, drawY, playerWidth, playerHeight);
    }

    tick = () => {
        // Record the last position (used for draw interpolation)
        this.lastX = this.x;
        this.lastY = this.y;

        if (localInput.left && !localInput.right) {
            this.velX -= groundAcceleration;
        }
        else if(localInput.right && !localInput.left) {
            this.velX += groundAcceleration;
        }
        this.velX -= this.velX * groundFriction;
        this.x += this.velX;

        // Add and apply gravity
        this.velY += gravity;
        this.y += this.velY;

        // Copy the players position to the collider
        this.collider.x = this.x;
        this.collider.y = this.y;

        if(this.collider.getBottom() >= gameWorld.height) {
            this.y = gameWorld.height - playerHeight;
            this.velY = 0;
        }
    }
}

export default Player;