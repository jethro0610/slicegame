import Collider from "./collider";
import { gameWorld, lerp } from "./game";

const playerWidth = 32;
const playerHeight = 32
const gravity = 1;


const groundFriction = 0.2;
const maxSpeed = 10;
const groundAcceleration = maxSpeed * groundFriction / (-groundFriction + 1.0);

class PlayerState {
    constructor(x = 0, y = 0, velX = 0, velY = 0, onGround = false) {
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
        // Store the previous state and copy it into the current state
        this.prevState = prevState;
        this.state = prevState.copy();

        let onGround = this.doGroundCollision(this.state, input.down);

        // Movement
        if (input.left && !input.right) {
            this.state.velX -= groundAcceleration;
        }
        else if(input.right && !input.left) {
            this.state.velX += groundAcceleration;
        }
        this.state.velX -= this.state.velX * groundFriction;
        this.state.x += this.state.velX;

        // Add and apply gravity
        if(!onGround)
            this.state.velY += gravity;
        this.state.y += this.state.velY;

        // Do wall collisions last, so player stays within bounds
        this.doWallCollision(this.state);

        return this.state;
    }

    doGroundCollision = (state, shouldDrop) => {
        this.collider.x = this.state.x;
        this.collider.y = this.state.y;
        let onGround = false;

        gameWorld.platforms.forEach(platform => {
            // If player is within horizontal bounds of platform...
            if(this.collider.getRight() >= platform.getLeft() && this.collider.getLeft() <= platform.getRight()){
                // If player is on top of platform...
                if(this.collider.getBottom() >= platform.getTop() && this.collider.getTop() <= platform.getTop() && !shouldDrop && this.state.velY >= 0) {
                    onGround = true;
                    state.y = platform.getTop() - playerHeight;
                    state.velY = 0;
                }
            }
        });

        if(this.collider.getBottom() >= gameWorld.height){
			if(state.velY >= 0){
                state.onGround = true;
				state.y = gameWorld.height - this.collider.height;
				state.velY = 0;
			}
		}

        this.collider.x = this.state.x;
        this.collider.y = this.state.y;
        return onGround;
    }

    doWallCollision = (state) => {
        // Copy the players position to the collider
        this.collider.x = this.state.x;
        this.collider.y = this.state.y;

        // Check for collision with walls
		if(this.collider.getRight() >= gameWorld.width){
			state.x = gameWorld.width - this.collider.width;
			state.velX = 0;
		}
		if(this.collider.getLeft() <= 0){
			state.x = 0;
			state.velX = 0;
		}
		if(this.collider.getTop() <= 0){
			state.y = 0;
		}

        this.collider.x = this.state.x;
        this.collider.y = this.state.y;
    }
}

export default Player;