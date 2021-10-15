import Player from "./player";
import { frameTime } from "./game";

class GameWorld {
    constructor(width, height) {
        this.width = width;
        this.height = height;

        this.player1 = new Player(0, 0);

        this.tickTime = Date.now();
        this.lastTickTime = this.tickTime;
    }

    draw = ctx => {
        let interp =  (Date.now() - this.lastTickTime - frameTime * 2) / frameTime;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        this.player1.draw(ctx, interp);
    }

    tick = () => {
        this.lastTickTime = this.tickTime;
        this.tickTime = Date.now();

        this.player1.tick();
    }
}

export default GameWorld;