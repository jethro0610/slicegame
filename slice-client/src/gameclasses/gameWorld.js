import Player from "./player";

class GameWorld {
    constructor(width, height) {
        this.width = width;
        this.height = height;

        this.player1 = new Player(0, 0);
    }

    draw = ctx => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = 'green';
        this.player1.draw(ctx);
    }

    tick = () => {
        this.player1.tick();
    }
}

export default GameWorld;