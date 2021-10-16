import Collider from "./collider";
import { gameWorld, lerp } from "./game";

const playerWidth = 32;
const playerHeight = 64;
const gravity = 1.5;

const groundFriction = 0.1;
const airFriction = 0.05;
const maxSpeed = 10;
const groundAcceleration = maxSpeed * groundFriction / (-groundFriction + 1.0);
const airAcceleration = maxSpeed * airFriction / (-airFriction + 1.0);

const jumpStrength = 25;
const maxAirJumps = 2;
const jumpReversalSpeed = 1.5;

const dashLength = 8;
const dashSpeed = 50;
const dashYTransfer = 0.5;

const cooldownLength = 40;
const cooldownSpeed = 0.015;

class PlayerState {
    constructor(x = 0, y = 0, velX = 0, velY = 0, airJumpsUsed = 0, dash = false, cooldown = false, right = true) {
        this.x = x;
        this.y = y;

        this.velX = velX;
        this.velY = velY;

        this.airJumpsUsed = airJumpsUsed;
        this.dash = dash;
        this.cooldown = cooldown;

        this.right = right;
    }

    copy = () =>{
        return new PlayerState(
            this.x, 
            this.y, 
            this.velX, 
            this.velY,
            this.airJumpsUsed,
            this.dash,
            this.cooldown,
            this.right);
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
        // It interpolates between the position the current and last tick
        let drawX = lerp(this.prevState.x, this.state.x, interp);
        let drawY = lerp(this.prevState.y, this.state.y, interp);

        // Draw the player
        ctx.fillStyle = 'green';
        ctx.fillRect(drawX, drawY, playerWidth, playerHeight);
    }

    tick = (prevState, input, prevInput) => {
        // Store the previous state and copy it into the current state
        this.prevState = prevState;
        this.state = prevState.copy();

        let onGround = this.doGroundCollision(this.state, input.down);
        if(onGround) {
            // Reset the dash
            this.state.dash = false;
            this.state.cooldown = false;

            this.state.airJumpsUsed = 0; // Reset air jumps
            this.calculateReversal(this.state, input); // Dash dance
        }

        // Ground Movement
        // Use acceleration and friction based on ground or air
        if(!this.isInDashState()) {
            let acceleration = onGround ? groundAcceleration : airAcceleration;
            let friction = onGround ? groundFriction : airFriction;
            if (input.left && !input.right) {
                this.state.velX -= acceleration;
                this.state.right = false;
            }
            else if(input.right && !input.left) {
                this.state.velX += acceleration;
                this.state.right = true;
            }
            this.state.velX -= this.state.velX * friction;
        }

        // Apply gravity
        if((!onGround && !this.isInDashState()) || this.isInCooldownFall()) // Only apply when not dashing or in cooldown fall
            this.state.velY += gravity;

        // Jumping
        if (input.up && !prevInput.up && !this.isInDashState()) {
            if(onGround)
                this.state.velY = -jumpStrength;
            else if(this.state.airJumpsUsed < maxAirJumps) {
                this.state.airJumpsUsed += 1;
                this.state.velY = -jumpStrength;
                this.calculateReversal(this.state, input, jumpReversalSpeed);
            }
        }

        // Dashing
        if(input.dash && !prevInput.dash && !onGround && !this.isInDashState()) {
            this.state.velX = this.state.right ? dashSpeed : -dashSpeed;
            this.state.velY = this.state.velY * dashYTransfer;
            this.state.dash = dashLength;
        }
        // Subtract from dash timer and apply velocity
        if (this.state.dash > 0)
            this.state.dash -= 1;
        // Subtract from the cooldown timer
        if (this.state.cooldown > 0)
            this.state.cooldown -= 1;
        // Apply cooldown slide
        if (this.state.dash <= 0 && this.state.dash !== false && this.state.cooldown === false) {
            this.state.cooldown = cooldownLength;
            this.state.velX = this.state.velX * cooldownSpeed;
            this.state.velY = this.state.velY * cooldownSpeed;
        }

        // Apply velocities
        this.state.x += this.state.velX;
        this.state.y += this.state.velY;

        // Do wall collisions last, so player stays within bounds
        this.doWallCollision(this.state);

        return this.state;
    }

    isDashing = () => {
        return this.state.dash > 0;
    }

    isInDashState = () => {
        return !(this.state.dash === false && this.state.cooldown === false);
    }

    isInCooldownFall = () => {
        return this.state.cooldown === 0;
    }

    calculateReversal = (state, input, scalar = 1) => {
        if(!(input.left && input.right)) {
            if((input.left && state.velX > 0) || (input.right && state.velX < 0))
                state.velX = -state.velX * scalar;
        }
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
                onGround = true;
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