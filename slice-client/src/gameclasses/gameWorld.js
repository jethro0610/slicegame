import Player from "./player";
import { frameTime } from "./game";
import { getDefaultInput, getLocalInput } from "./input";
import Collider from "./collider";

const maxRollbackFrames = 300;
const mapSetCapped = (map, key, value, cap) => {
    map.set(key, value);
    if(key >= cap && map.has(key - cap)) {
        map.delete(key - cap);
    }
}

class GameState {
    constructor(player1State, player2State) {
        this.player1State = player1State;
        this.player2State = player2State;
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

        this.rollbackTick = Infinity;
        this.lastRemoteInputTick = 0;

        this.localInputs = new Map();
        this.localInputs.set(0, getDefaultInput());
        this.remoteInputs = new Map();
        this.remoteInputs.set(0, getDefaultInput());

        // Create player 1 and copy their state to the first game state
        this.player1 = new Player(0, 0);
        this.player2 = new Player(200, 0);
        this.states.set(0, new GameState(this.player1.state, this.player2.state));

        this.platforms = [];
        this.platforms.push(new Collider(100, 400, 200, 16));

        this.lastTickTime = performance.now();
        this.frameAccumulator = 0;
    }

    draw = ctx => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        this.player1.draw(ctx, this.frameAccumulator / (frameTime + this.tickWaitTime));
        this.player2.draw(ctx, this.frameAccumulator / (frameTime + this.tickWaitTime));
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

    // Increases frame time whenever client is ahead of remote (slows game down)
    syncClockWithRemote = () => {
        if(this.tickCount > this.remoteTickCount)
            this.tickWaitTime = frameTime / 2.0;
        else
            this.tickWaitTime = 0;
    }

    // Places local inputs into map and sends them to the remote
    recordAndSendLocalInput = () => {
        const localInput = getLocalInput();
        this.remote.send({frame: this.tickCount, input: localInput});
        mapSetCapped(this.localInputs, this.tickCount, localInput, maxRollbackFrames);
    }

    gameTick = (stateTickCount, player1Input, prevPlayer1Input, player2Input, prevPlayer2Input) => {
        let player1StateThisTick = this.player1.tick(
            this.states.get(stateTickCount - 1).player1State, 
            player1Input, 
            prevPlayer1Input);

        let player2StateThisTick = this.player2.tick(
            this.states.get(stateTickCount - 1).player2State, 
            player2Input, 
            prevPlayer2Input);
        // Put the new player state at the beginning of the game states
        mapSetCapped(this.states, stateTickCount, new GameState(player1StateThisTick, player2StateThisTick), maxRollbackFrames);
    }

    tick = () => {
        this.syncClockWithRemote();
        this.executeRollback();

        this.tickCount++;
        this.recordAndSendLocalInput();

        // Determine who gives inputs to player 1
        let player1Input, prevPlayer1Input, player2Input, prevPlayer2Input;
        if (this.isHost) {
            player1Input = this.localInputs.get(this.tickCount); 
            prevPlayer1Input = this.localInputs.get(this.tickCount - 1);

            const remoteInputIndex = Math.min(this.remoteTickCount, this.tickCount);
            const prevRemoteInputIndex = Math.max(remoteInputIndex, 0);
            player2Input = this.remoteInputs.get(remoteInputIndex);
            prevPlayer2Input = this.remoteInputs.get(prevRemoteInputIndex);
        }
        else {
            player2Input = this.localInputs.get(this.tickCount); 
            prevPlayer2Input = this.localInputs.get(this.tickCount - 1);

            const remoteInputIndex = Math.min(this.remoteTickCount, this.tickCount);
            const prevRemoteInputIndex = Math.max(remoteInputIndex, 0);
            player1Input = this.remoteInputs.get(remoteInputIndex);
            prevPlayer1Input = this.remoteInputs.get(prevRemoteInputIndex);
        }

        // Tick the game
        this.gameTick(this.tickCount, player1Input, prevPlayer1Input, player2Input, prevPlayer2Input);
    }

    onRecieveRemoteInput = (remoteInput) => {
        // Set the remote tick count if it goes up
        if(remoteInput.frame > this.remoteTickCount)
            this.remoteTickCount = remoteInput.frame;

        // Set the frame to rollback to, and ensure that its the earliest frame
        if(remoteInput.frame < this.rollbackTick)
            this.rollbackTick = remoteInput.frame;

        // Add the remote input to the map
        mapSetCapped(this.remoteInputs, remoteInput.frame, remoteInput.input, maxRollbackFrames);
    }

    executeRollback = () => {
        // Skip if no inputs were recieved (since rollbackTick is only set when inputs are sent)
        if(this.rollbackTick == Infinity)
            return;

        // Either rollback to the earliest recieved input, or the last tick where the remote
        // sent a valid input. This ensures that missed inputs are corrected
        const rollbackPoint = Math.min(this.rollbackTick, this.lastRemoteInputTick + 1);
        let lastValidInput = undefined;
        let missingInput = false;
        for(let i = rollbackPoint; i <= this.tickCount; i++) {
            // Determine if an input is missing and record the last valid input
            // if there is a missing input, the loop executes the rest of the
            // ticks using the last valid one
            if(this.remoteInputs.has(i) && !missingInput) {
                lastValidInput = i;
                this.lastRemoteInputTick = i;
            }
            else
                missingInput = true;

            // Assign the inputs of the rollback ticks and
            // tick the game
            let player1Input, prevPlayer1Input, player2Input, prevPlayer2Input;
            if (this.isHost) {
                player1Input = this.localInputs.get(i);
                prevPlayer1Input = this.localInputs.get(i - 1);

                player2Input = this.remoteInputs.get(lastValidInput);
                prevPlayer2Input = this.remoteInputs.get(missingInput ? lastValidInput : lastValidInput - 1);
            }
            else {
                player2Input = this.localInputs.get(i);
                prevPlayer2Input = this.localInputs.get(i - 1);

                player1Input = this.remoteInputs.get(lastValidInput);
                prevPlayer1Input = this.remoteInputs.get(missingInput ? lastValidInput : lastValidInput - 1);
            }
            this.gameTick(i, player1Input, prevPlayer1Input, player2Input, prevPlayer2Input);
        }

        // Reset rollback ticks so rollback's aren't executed till next input
        this.rollbackTick = Infinity;
    }
}

export default GameWorld;