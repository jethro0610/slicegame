import Player from "./player";
import { frameTime, maxStateRecordings } from "./game";
import localInput from "./input";
import Collider from "./collider";

class GameState {
    constructor(player1State) {
        this.player1State = player1State;
    }
}

class GameWorld {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.states = [];

        // Create player 1 and copy their state to the first game state
        this.player1 = new Player(0, 0);
        this.states.unshift(new GameState(this.player1.state));

        this.platforms = [];
        this.platforms.push(new Collider(100, 400, 200, 16));

        this.lastTickTime = performance.now();
        this.frameAccumulator = 0;
    }

    draw = ctx => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        this.player1.draw(ctx, this.frameAccumulator / frameTime);
        this.platforms.forEach(platform => {
            // Draw the platform
            ctx.fillStyle = 'black';
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        });
    }

    doTicks = () => {
        // Get the amount of time between the last tick and now
        const frameInterval = performance.now() - this.lastTickTime;

        // Add the interval to the accumulator
        this.frameAccumulator += frameInterval;

        // If the a whole frame or more has accumulated, tick the world
        while(this.frameAccumulator >= frameTime) {
            this.tick();
            this.frameAccumulator -= frameTime;
        }

        // Record the time of this tick
        this.lastTickTime = performance.now();
    }

    tick = () => {
        // Tick the player and get the new state
        let player1StateThisTick = this.player1.tick(this.states[0].player1State, localInput);
        // Put the new player state at the beginning of the game states
        this.states.unshift(new GameState(player1StateThisTick));
        // Limit the number of game states
        this.states.length = Math.min(this.states.length, maxStateRecordings);
    }
}

export default GameWorld;