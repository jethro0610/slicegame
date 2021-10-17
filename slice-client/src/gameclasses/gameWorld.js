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
        this.width = width;
        this.height = height;

        this.isHost = isHost;
        this.remote = remote;

        this.states = new Map();
        this.tickCount = 0;
        this.remoteTickCount = 0;
        this.tickWaitTime = 0;

        this.localInputs = new Map();
        this.localInputs.set(0, getDefaultInput());
        this.remoteInputs = new Map();
        this.remoteInputs.set(0, getDefaultInput());

        // Create player 1 and copy their state to the first game state
        this.player1 = new Player(0, 0);
        this.states.set(0, new GameState(this.player1.state));

        this.platforms = [];
        this.platforms.push(new Collider(100, 400, 200, 16));

        this.lastTickTime = performance.now();
        this.frameAccumulator = 0;
    }

    draw = ctx => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        this.player1.draw(ctx, this.frameAccumulator / (frameTime + this.tickWaitTime));
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
        while(this.frameAccumulator >= frameTime + this.tickWaitTime) {
            this.tick();
            this.frameAccumulator -= frameTime + this.tickWaitTime;
        }

        // Record the time of this tick
        this.lastTickTime = performance.now();
    }

    tick = () => {
        if(this.tickCount > this.remoteTickCount && !this.isHost)
            this.tickWaitTime = frameTime / 2.0;
        else
            this.tickWaitTime = 0;

        this.tickCount++;
        if(this.isHost) {
            const localInput = getLocalInput();
            this.remote.send({frame: this.tickCount, input: localInput});
            this.localInputs.set(this.tickCount, localInput);

            // Tick the player and get the new state
            let player1StateThisTick = this.player1.tick(
                this.states.get(this.tickCount - 1).player1State, 
                this.localInputs.get(this.tickCount), 
                this.localInputs.get(this.tickCount - 1));

            // Put the new player state at the beginning of the game states
            this.states.set(this.tickCount, new GameState(player1StateThisTick));
        }
        else {
            const remoteInputIndex = Math.min(this.remoteTickCount, this.tickCount);
            const prevRemoteInputIndex = Math.min(remoteInputIndex, 0);

            // Tick the player and get the new state
            let player1StateThisTick = this.player1.tick(
                this.states.get(this.tickCount - 1).player1State, 
                this.remoteInputs.get(remoteInputIndex), 
                this.remoteInputs.get(prevRemoteInputIndex));

            // Put the new player state at the beginning of the game states
            this.states.set(this.tickCount, new GameState(player1StateThisTick));
        }
    }

    onRecieveRemoteInput = (remoteInput) => {
        if(remoteInput.frame > this.remoteTickCount)
            this.remoteTickCount = remoteInput.frame;
        this.remoteInputs.set(remoteInput.frame, remoteInput.input);

        for(let i = remoteInput.frame; i <= this.tickCount; i++) {
            let remoteInputIndex = Math.min(i, this.remoteTickCount);
            // Tick the player and get the new state
            let player1StateThisTick = this.player1.tick(
                this.states.get(i - 1).player1State, 
                this.remoteInputs.get(remoteInputIndex), 
                this.remoteInputs.get(remoteInputIndex - 1));
            // Put the new player state at the beginning of the game states
            this.states.set(i, new GameState(player1StateThisTick));
        }
    }
}

export default GameWorld;