import { createPlayerState, drawPlayerFromState, getDashCollisions, tickEndRoundPlayerState, tickPlayerState } from './player'
import { getDefaultInput, getLocalInput } from "./input";
import Collider from "./collider";
import { ping } from "./networking";
import store from '../redux/store/store';
import { setStarted } from '../redux/reducers/gameStarted';

let gameWorld = null;
const tickTime = (1/60.0) * 1000;
const maxRollbackFrames = 300;

const startGame = (remote, isHost) => {
    gameWorld = new GameWorld(800, 600, remote, isHost);
    store.dispatch(setStarted(true));
}

const stopGame = () => {
    store.dispatch(setStarted(false));
    gameWorld = null;
}

const mapSetCapped = (map, key, value, cap) => {
    map.set(key, value);
    if(key >= cap && map.has(key - cap)) {
        map.delete(key - cap);
    }
}

const createGameState = (player1State, player2State, roundState = 0, endRoundTimer = 0) => {
    return { 
        player1State, 
        player2State, 
        roundState,
        endRoundTimer
    };
}

const copyGameState = (gameState) => {
    return { 
        player1State: gameState.player1State, 
        player2State: gameState.player2State, 
        roundState: gameState.roundState,
        endRoundTimer: gameState.endRoundTimer
    };
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
        this.states.set(0, createGameState(createPlayerState(0, 0), createPlayerState(200, 0)));

        this.platforms = [];
        this.platforms.push(new Collider(100, 400, 200, 16));

        this.lastTickTime = performance.now();
        this.frameAccumulator = 0;
    }

    draw = ctx => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        if(this.tickCount >= 1) {
            const drawInterp = this.frameAccumulator / (tickTime + this.tickWaitTime);
            drawPlayerFromState(ctx, this.states.get(this.tickCount).player1State, this.states.get(this.tickCount - 1).player1State, drawInterp);
            drawPlayerFromState(ctx, this.states.get(this.tickCount).player2State, this.states.get(this.tickCount - 1).player2State, drawInterp);
        }

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
        while(this.frameAccumulator >= tickTime + this.tickWaitTime) {
            this.tick();
            this.frameAccumulator -= tickTime + this.tickWaitTime;
        }

        // Record the time of this tick
        this.lastTickTime = performance.now();
    }

    // Increases frame time whenever client is ahead of remote (slows game down)
    syncClockWithRemote = () => {
        if(this.tickCount > (this.remoteTickCount + (ping / 2) / tickTime) + 1)
            this.tickWaitTime = tickTime;
        else
            this.tickWaitTime = 0;
    }

    // Places local inputs into map and sends them to the remote
    recordAndSendLocalInput = () => {
        const localInput = getLocalInput();
        this.remote.send({frame: this.tickCount, input: localInput});
        mapSetCapped(this.localInputs, this.tickCount, localInput, maxRollbackFrames);
    }

    tickGameState = (stateTickCount, player1Input, prevPlayer1Input, player2Input, prevPlayer2Input) => {
        // Copy the previous state
        let state = copyGameState(this.states.get(stateTickCount - 1));

        let player1StateThisTick, player2StateThisTick
        if(state.roundState == 0) {
            // Tick the player states
            player1StateThisTick = tickPlayerState(
                state.player1State, 
                player1Input, 
                prevPlayer1Input);

            player2StateThisTick = tickPlayerState(
                state.player2State, 
                player2Input, 
                prevPlayer2Input);
        }
        else if(state.roundState == 1) {
            // Tick the end round player states
            player1StateThisTick = tickEndRoundPlayerState(state.player1State)
            player2StateThisTick = tickEndRoundPlayerState(state.player2State)

            state.endRoundTimer += 1;
            if (state.endRoundTimer == 150) {
                state.roundState = 0;
                player1StateThisTick = createPlayerState(0, 0);
                player2StateThisTick = createPlayerState(200, 0);
                state.endRoundTimer = 0;
            }
        }

        // Get any dash collisions
        const dashCollisionResult = getDashCollisions(player1StateThisTick, player2StateThisTick);
        if(dashCollisionResult != 0 && state.roundState == 0) {
            state.roundState = 1;
            player2StateThisTick.velX = 40;
            player2StateThisTick.velY = -20;
        }

        // Update the player states
        state.player1State = player1StateThisTick;
        state.player2State = player2StateThisTick;

        // Add the game state to the map
        mapSetCapped(this.states, stateTickCount, state, maxRollbackFrames);
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
        this.tickGameState(this.tickCount, player1Input, prevPlayer1Input, player2Input, prevPlayer2Input);
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
            this.tickGameState(i, player1Input, prevPlayer1Input, player2Input, prevPlayer2Input);
        }

        // Reset rollback ticks so rollback's aren't executed till next input
        this.rollbackTick = Infinity;
    }
}

export { startGame, stopGame, gameWorld };