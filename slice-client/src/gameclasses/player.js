import Collider from "./collider";
import { gameWorld, lerp } from "./game";

const playerWidth = 32;
const playerHeight = 32
const gravity = 1;


const groundFriction = 0.2;
const maxSpeed = 10;
const groundAcceleration = maxSpeed * groundFriction / (-groundFriction + 1.0);

class PlayerState {
    constructor(x = 0, y = 0, velX = 0, velY = 0) {
        this.x = x;
        this.y = y;

        this.velX = velX;
        this.velY = velY;
    }
    copy = () =>{
        return new PlayerState(
            this.x, 
            this.y, 
            this.velX, 
            this.velY);
    }
}

class Player{
    constructor(x, y) {
        this.state = new PlayerState(x, y);
        this.prevState = this.state;
        this.collider = new Collider(0, 0, playerWidth, playerHeight);
    }

    draw = (ctx, interp) => {
        // Get the position to draw the player in
        // It interpolates between the position two ticks, and on tick ago
        let drawX = lerp(this.prevState.x, this.state.x, interp);
        let drawY = lerp(this.prevState.y, this.state.y, interp);

        // Draw the player
        ctx.fillStyle = 'green';
        ctx.fillRect(drawX, drawY, playerWidth, playerHeight);
    }

    tick = (prevState, input) => {
        this.prevState = prevState;
        this.state = prevState.copy();

        if (input.left && !input.right) {
            this.state.velX -= groundAcceleration;
        }
        else if(input.right && !input.left) {
            this.state.velX += groundAcceleration;
        }
        this.state.velX -= this.state.velX * groundFriction;
        this.state.x += this.state.velX;

        // Add and apply gravity
        this.state.velY += gravity;
        this.state.y += this.state.velY;

        this.doCollisions(this.state);
        return this.state;
    }

    doCollisions = (state) => {
        // Copy the players position to the collider
        this.collider.x = state.x;
        this.collider.y = state.y;

        if(this.collider.getBottom() >= gameWorld.height) {
            state.y = gameWorld.height - playerHeight;
            state.velY = 0;
        }
    }
}

export default Player;