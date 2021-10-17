import Player from "./player";
import { frameTime, maxStateRecordings } from "./game";
import { getDefaultInput, getLocalInput } from "./input";
import Collider from "./collider";

class GameState {
    constructor(player1State) {
        this.player1State = player1State;
    }
}

class GameWorld {
    constructor(width, height, remote, isHost) {
        this.isHost = isHost;
        this.remote = remote;
        this.width = width;
        this.height = height;
        this.states = [];
        this.currentFrame = 0;
        this.lastFrameWithRemoteInput = 0;
        this.frameTimeAdd = 0;
        this.localInputs = [];
        this.localInputs.push(getDefaultInput());
        this.remoteInputs = [];
        this.remoteInputs.push({ frame: 0, input: getDefaultInput()});

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
        this.player1.draw(ctx, this.frameAccumulator / (frameTime + this.frameTimeAdd));
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
        while(this.frameAccumulator >= frameTime + this.frameTimeAdd) {
            this.tick();
            this.frameAccumulator -= frameTime + this.frameTimeAdd;
        }

        // Record the time of this tick
        this.lastTickTime = performance.now();
    }

    tick = () => {
        if(this.currentFrame > this.remoteInputs.length && !this.isHost)
            this.frameTimeAdd = frameTime / 2.0;
        else
            this.frameTimeAdd = 0;

        this.currentFrame++;
        if(this.isHost) {
            const localInput = getLocalInput();
            this.remote.send({frame: this.currentFrame, input: localInput});
            this.localInputs.push(localInput);

            // Tick the player and get the new state
            let player1StateThisTick = this.player1.tick(
                this.states[this.currentFrame - 1].player1State, 
                this.localInputs[this.currentFrame], 
                this.localInputs[this.currentFrame - 1]);

            // Put the new player state at the beginning of the game states
            this.states.push(new GameState(player1StateThisTick));
        }
        else {
            const greatestRemoteInput = Math.min(this.remoteInputs.length - 1, this.currentFrame);
            const greatestLastInput = Math.min(this.remoteInputs.length - 1, 0);

            // Tick the player and get the new state
            let player1StateThisTick = this.player1.tick(
                this.states[this.currentFrame - 1].player1State, 
                this.remoteInputs[greatestRemoteInput].input, 
                this.remoteInputs[greatestLastInput].input);

            // Put the new player state at the beginning of the game states
            this.states.push(new GameState(player1StateThisTick));
        }
    }

    onRecieveRemoteInput = (remoteInput) => {
        this.remoteInputs.push(remoteInput);
        this.remoteInputs.sort((a, b) => {
            if(a.frame > b.frame)
                return 1;
            if(a.frame < b.frame)
                return -1;
            return 0;
        });

        const minRollbackPoint = Math.min(remoteInput.frame, this.lastFrameWithRemoteInput + 1);
        for(let i = minRollbackPoint; i <= this.currentFrame; i++) {
            let greatestFrame = Math.min(i, this.remoteInputs.length - 1);
            // Tick the player and get the new state
            let player1StateThisTick = this.player1.tick(
                this.states[i - 1].player1State, 
                this.remoteInputs[greatestFrame].input, 
                this.remoteInputs[greatestFrame - 1].input);
            // Put the new player state at the beginning of the game states
            this.states[i] = new GameState(player1StateThisTick);

            if(greatestFrame == i)
                this.lastFrameWithRemoteInput = i;
        }
    }
}

export default GameWorld;