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
        const frameInterval = performance.now() - this.lastTickTime;
        this.frameAccumulator += frameInterval;
        while(this.frameAccumulator >= frameTime) {
            this.tick();
            this.frameAccumulator -= frameTime;
        }
        this.lastTickTime = performance.now();
    }

    tick = () => {
        this.player1.tick();
    }
}

export default GameWorld;