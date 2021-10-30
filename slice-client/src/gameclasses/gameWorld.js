import { drawPlayerFromState } from './player'
import { drawPlatform } from './platform';
import { getDefaultInput, getLocalInput } from "./input";
import Collider from "./collider";
import { ping } from "./networking";
import store from '../redux/store/store';
import { setStarted } from '../redux/reducers/gameStarted';
import { createGameState, tickGameState, gameWidth, gameHeight } from './game';
const lodash = require('lodash');

let gameWorld = null;
const tickTime = (1/60.0) * 1000;
const maxRollbackFrames = 300;

const playerColor = 'rgb(180, 180, 180)'
const platformColor = 'rgb(60, 60, 60)'
const shadowColor = 'rgba(0, 0, 0, 0.5)'

const startGame = (remote, isHost) => {
    gameWorld = new GameWorld(gameWidth, gameHeight, remote, isHost);
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

class GameWorld {
    constructor(width, height, remote, isHost) {
        this.width = width;
        this.height = height;

        this.isHost = isHost;
        this.remote = remote;

        this.states = new Map();
        this.states.set(0, createGameState()); // Set the initial game state

        this.tickCount = 0;
        this.remoteTickCount = 0;
        this.tickWaitTime = 0;

        this.rollbackTick = Infinity;
        this.lastRemoteInputTick = 0;

        this.localInputs = new Map();
        this.localInputs.set(0, getDefaultInput());
        this.remoteInputs = new Map();
        this.remoteInputs.set(0, getDefaultInput());

        this.platforms = [];
        this.platforms.push(new Collider(100, (height / 2), 400, 16));
        this.platforms.push(new Collider(width - 500, (height / 2), 400, 16));

        this.platforms.push(new Collider((width / 2) - 150, (height /4), 300, 16));
        this.platforms.push(new Collider((width / 2) - 250, (height / 2) + (height /4), 500, 16));
        this.lastTickTime = performance.now();
        this.frameAccumulator = 0;
    }

    drawText = (ctx, text) => {
        ctx.font = '125px Arial';
        ctx.textAlign ='center';
        ctx.fillStyle = 'black';
        ctx.fillText(text, this.width / 2, (this.height / 2) + 50);
    }

    drawTopText = (ctx, text) => {
        ctx.font = '75px Arial';
        ctx.textAlign ='center';
        ctx.fillStyle = 'black';
        ctx.fillText(text, this.width / 2, 80);
    }

    draw = ctx => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = 'rgb(30, 30, 30)'
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        const state = this.states.get(this.tickCount);
        const prevState = this.states.get(this.tickCount - 1);

        // Draw the platform and player shadows
        this.platforms.forEach(platform => {
            drawPlatform(ctx, platform, shadowColor, 0, 5)
        });
        if(this.tickCount >= 1) {
            const drawInterp = this.frameAccumulator / (tickTime + this.tickWaitTime);
            drawPlayerFromState(ctx, state.player1State, prevState.player1State, drawInterp, shadowColor, 0, 5);
            drawPlayerFromState(ctx, state.player2State, prevState.player2State, drawInterp, shadowColor, 0, 5);
        }

        // Draw the effects
        state.effectStates.forEach(effectState => {
            effectState.draw(ctx)
        })

        // Draw the platforms
        this.platforms.forEach(platform => {
            drawPlatform(ctx, platform, platformColor)
        });

        // Draw the players
        if(this.tickCount >= 1) {
            const drawInterp = this.frameAccumulator / (tickTime + this.tickWaitTime);
            drawPlayerFromState(ctx, state.player1State, prevState.player1State, drawInterp, playerColor);
            drawPlayerFromState(ctx, state.player2State, prevState.player2State, drawInterp, playerColor);
        }

        if (state.roundState == 0)
            this.drawText(ctx, 'Ready...');
        else if(state.roundState == 3)
            this.drawText(ctx, state.player1Score + ' - ' + state.player2Score);
        else
            this.drawTopText(ctx, state.player1Score + ' - ' + state.player2Score);

        if (state.messageTimer > 0) 
            this.drawText(ctx, 'Slice!');
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
        this.tickGameStateAtTick(this.tickCount, player1Input, prevPlayer1Input, player2Input, prevPlayer2Input)
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
            this.tickGameStateAtTick(i, player1Input, prevPlayer1Input, player2Input, prevPlayer2Input)
        }

        // Reset rollback ticks so rollback's aren't executed till next input
        this.rollbackTick = Infinity;
    }

    tickGameStateAtTick = (stateTick, player1Input, prevPlayer1Input, player2Input, prevPlayer2Input) => {
        const state = lodash.cloneDeep(this.states.get(stateTick - 1));
        tickGameState(state, player1Input, prevPlayer1Input, player2Input, prevPlayer2Input)
        mapSetCapped(this.states, stateTick, state, maxRollbackFrames);
    }
}

export { startGame, stopGame, gameWorld };