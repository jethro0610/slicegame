import Player from "./player";
import { frameTime } from "./game";

class GameWorld {
    constructor(width, height) {
        this.width = width;
        this.height = height;

        this.player1 = new Player(0, 0);

        this.lastTickTime = performance.now();
        this.frameAccumulator = 0;
    }

    draw = ctx => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        this.player1.draw(ctx, this.frameAccumulator / frameTime);
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
        this.player1.tick();
    }
}

export default GameWorld;