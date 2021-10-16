import Collider from "./collider";
import { gameWorld, lerp } from "./game";
import localInput from "./input";

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
}

class Player{
    constructor(x, y) {
        this.states = [];
        this.states.unshift(new PlayerState(x, y));

        this.collider = new Collider(x, y, playerWidth, playerHeight);
    }

    draw = (ctx, interp) => {
        // Get the position to draw the player in
        // It interpolates between the position two ticks, and on tick ago
        let drawX = this.states[0].x;
        let drawY = this.states[0].y;

        if(this.states.length > 1) {
            drawX = lerp(this.states[1].x, this.states[0].x, interp);
            drawY = lerp(this.states[1].y, this.states[0].y, interp);
        }

        // Draw the player
        ctx.fillStyle = 'green';
        ctx.fillRect(drawX, drawY, playerWidth, playerHeight);
    }

    tick = () => {
        let stateThisTick = this.getCopyOfLastState();

        if (localInput.left && !localInput.right) {
            stateThisTick.velX -= groundAcceleration;
        }
        else if(localInput.right && !localInput.left) {
            stateThisTick.velX += groundAcceleration;
        }
        stateThisTick.velX -= stateThisTick.velX * groundFriction;
        stateThisTick.x += stateThisTick.velX;

        // Add and apply gravity
        stateThisTick.velY += gravity;
        stateThisTick.y += stateThisTick.velY;

        this.doCollisions(stateThisTick);
        this.states.unshift(stateThisTick);
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

    getCopyOfLastState = () =>{
        return new PlayerState(
            this.states[0].x, 
            this.states[0].y, 
            this.states[0].velX, 
            this.states[0].velY);
    }
}

export default Player;