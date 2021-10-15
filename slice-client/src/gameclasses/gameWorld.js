class GameWorld {
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }

    draw = ctx => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = '#000000';
        ctx.fillRect(10,10,50,50);
    }
}

export default GameWorld;