import Collider from "./collider";
import { gameWorld } from "./gameWorld";
import VSprite from './vsprite'

// Create the player VSprite and add animations
const playerVSpriteJson = require('../vsprites/char.json')
const playerVSprite = new VSprite(playerVSpriteJson)

const playerWidth = 32;
const playerHeight = 64;
const gravity = 1.75;

const groundFriction = 0.075;
const airFriction = 0.025;
const maxSpeed = 15;
const groundAcceleration = maxSpeed * groundFriction / (-groundFriction + 1.0);
const airAcceleration = maxSpeed * airFriction / (-airFriction + 1.0);

const jumpStrength = 30;
const maxAirJumps = 2;
const jumpReversalSpeed = 1.5;

const groundDashLength = 5;
const airDashLength = 8;
const dashSpeed = 50;
const dashYTransfer = 0.5;

const cooldownLength = 40;
const cooldownSpeed = 0.015;

const knockback = 0.01;

const lerp = (a, b, t) => {
    return (1 - t) * a + t * b;
}

const createPlayerState = (x = 0, y = 0, velX = 0, velY = 0, airJumpsUsed = 0, dash = false, cooldown = false, right = true, animation='idle', animationFrame=-1) => {
    return { x, y, velX, velY, airJumpsUsed, dash, cooldown, right, animation, animationFrame};
}

const copyPlayerState = (state) =>{
    return { 
        x: state.x, 
        y: state.y, 
        velX: state.velX, 
        velY: state.velY, 
        airJumpsUsed: state.airJumpsUsed, 
        dash: state.dash, 
        cooldown: state.cooldown, 
        right: state.right,
        animation:state.animation,
        animationFrame:state.animationFrame};
}

const tickStartRoundPlayerState = (prevState, state) => {
    // Apply gravity and return whether or not the player is on the ground
    state.velY += gravity;
    state.y += state.velY;
    return doGroundCollision(state, false);
}

const tickPlayerState = (prevState, state, prevInput, input) => {
    state.animation = 'idle'
    state.animationFrame = -1

    if (state.velX < -1 || state.velX > 1)
        state.animation = 'skid'

    // Store the previous state and copy it into the current state
    let onGround = doGroundCollision(state, (input.down && !state.dash));
    if(onGround) {
        // Reset the dash if landing
        if(prevState.velY > 0 || isInCooldownFall(state)) {
            state.dash = false;
            state.cooldown = false;
        }

        state.airJumpsUsed = 0; // Reset air jumps

        if(!isInDashOrCooldown(state))
            calculateReversal(state, input); // Dash dance

    }

    // Ground Movement
    // Use acceleration and friction based on ground or air
    if(!isInDashOrCooldown(state)) {
        let acceleration = onGround ? groundAcceleration : airAcceleration;
        let friction = onGround ? groundFriction : airFriction;
        if (input.left && !input.right) {
            state.animation = 'run'
            state.velX -= acceleration;
            state.right = false;
        }
        else if(input.right && !input.left) {
            state.animation = 'run'
            state.velX += acceleration;
            state.right = true;
        }
        state.velX -= state.velX * friction;
    }

    // Apply gravity
    if(!onGround)  {// Only apply when not dashing or in cooldown fall 
        if(!isInDashOrCooldown(state) || isInCooldownFall(state))
            state.velY += gravity;

        if (state.velY > 0)
            state.animation = 'fall'
        else {
            if (state.airJumpsUsed >= 1) {
                const jumpFrame = parseInt((10 - parseInt((-state.velY / jumpStrength) * 10)));
                state.animation = 'airJump'
                state.animationFrame = jumpFrame
            }
            else
                state.animation = 'jump';
        }
    }

    // Jumping
    if (input.up && !prevInput.up && !isInDashOrCooldown(state)) {
        if(onGround)
            state.velY = -jumpStrength;
        else if(state.airJumpsUsed < maxAirJumps) {
            state.airJumpsUsed += 1;
            state.velY = -jumpStrength;
            calculateReversal(state, input, jumpReversalSpeed);
        }
    }

    // Dashing
    if(input.dash && !prevInput.dash && !isInDashOrCooldown(state)) {
        state.dash = onGround ? groundDashLength : airDashLength;
        state.velX = state.right ? dashSpeed : -dashSpeed;
        state.velY = state.velY * dashYTransfer;
    }
    // Subtract from dash timer and apply velocity
    if (state.dash > 0) {
        state.dash -= 1;
        state.animation = 'dash'
    }
    // Subtract from the cooldown timer
    if (state.cooldown > 0) {
        state.cooldown -= 1;
        if (state.cooldown <= 5)
            state.animation = 'skid'
        else
            state.animation = 'dash'
    }
    // Apply cooldown slide
    if (state.dash <= 0 && state.dash !== false && state.cooldown === false) {
        state.cooldown = cooldownLength;
        state.velX = state.velX * cooldownSpeed;
        state.velY = state.velY * cooldownSpeed;
    }

    // Apply velocities
    state.x += state.velX;
    state.y += state.velY;

    // Do wall collisions last, so player stays within bounds
    doWallCollision(state);
}

const tickEndRoundPlayerState = (prevState, state, loser = false) => {
    // Subtract from dash timer and apply velocity
    if (state.dash > 0)
        state.dash -= 1;
        
    // Apply cooldown slide
    if (state.dash <= 0 && state.dash !== false && state.cooldown === false) {
        state.cooldown = cooldownLength;
        state.velX = state.velX * cooldownSpeed;
        state.velY = state.velY * cooldownSpeed;
    }

    // Apply velocities
    state.x += state.velX;
    state.y += state.velY;

    if (loser)
        state.animation = 'hit'

    // Do wall collisions last, so player stays within bounds
    doWallCollision(state);
}

const isDashing = (state) => {
    return state.dash > 0;
}

const isInDashOrCooldown = (state) => {
    return !(state.dash === false && state.cooldown === false);
}

const isInCooldownFall = (state) => {
    return state.cooldown === 0;
}

const calculateReversal = (state, input, scalar = 1) => {
    if(!(input.left && input.right)) {
        if((input.left && state.velX > 0) || (input.right && state.velX < 0))
            state.velX = -state.velX * scalar;
    }
}

const doGroundCollision = (state, shouldDrop) => {
    let collider = new Collider(state.x, state.y, playerWidth, playerHeight);
    let onGround = false;

    gameWorld.platforms.forEach(platform => {
        // If player is within horizontal bounds of platform...
        if(collider.getRight() >= platform.getLeft() && collider.getLeft() <= platform.getRight()){
            // If player is on top of platform...
            if(collider.getBottom() >= platform.getTop() && collider.getTop() <= platform.getTop() && !shouldDrop && state.velY >= 0) {
                onGround = true;
                state.y = platform.getTop() - playerHeight;
                state.velY = 0;
            }
        }
    });

    if(collider.getBottom() >= gameWorld.height){
        if(state.velY >= 0){
            onGround = true;
            state.y = gameWorld.height - collider.height;
            state.velY = 0;
        }
    }

    return onGround;
}

const doWallCollision = (state) => {
    // Copy the players position to the collider
    let collider = new Collider(state.x, state.y, playerWidth, playerHeight);

    // Check for collision with walls
    if(collider.getRight() >= gameWorld.width){
        state.x = gameWorld.width - collider.width;
        state.velX = 0;
    }
    if(collider.getLeft() <= 0){
        state.x = 0;
        state.velX = 0;
    }
}

const doDashCollisions = (state1, state2) => {
    let collider1 = new Collider(state1.x, state1.y, playerWidth, playerHeight);
    let collider2 = new Collider(state2.x, state2.y, playerWidth, playerHeight);

    if(collider1.isIntersecting(collider2)) {
        if(isDashing(state1) && isDashing(state2))
            return 0;

        if(!isDashing(state1) && !isDashing(state2))
            return 0;

        if(isDashing(state1)) {
            state2.velX = state1.velX * knockback;
            state2.velY = state1.velY * knockback;
            state2.right = !state1.right
            return 1;
        }
        else if (isDashing(state2)) {
            state1.velX = state2.velX * knockback;
            state1.velY = state2.velY * knockback;
            state1.right = !state2.right
            return 2;
        }
    }

    return 0;
}

const drawPlayerFromState = (ctx, state, prevState, interp, color = 'black', offsetX = 0, offsetY = 0) => {
    // Get the position to draw the player in
    // It interpolates between the position the current and last tick
    let drawX = lerp(prevState.x, state.x, interp) + offsetX;
    let drawY = lerp(prevState.y, state.y, interp) + offsetY;

    playerVSprite.draw(ctx, drawX + playerWidth / 2, drawY + playerHeight + 2, 200, color, !state.right, state.animation)
}

export { 
    playerWidth,
    playerHeight,
    createPlayerState, 
    copyPlayerState, 
    tickStartRoundPlayerState,
    tickPlayerState, 
    drawPlayerFromState, 
    doDashCollisions,
    tickEndRoundPlayerState };