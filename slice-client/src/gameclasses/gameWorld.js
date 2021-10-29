import { copyPlayerState, createPlayerState, doDashCollisions, drawPlayerFromState, playerWidth, tickEndRoundPlayerState, tickPlayerState, tickStartRoundPlayerState } from './player'
import { getDefaultInput, getLocalInput } from "./input";
import Collider from "./collider";
import { ping } from "./networking";
import store from '../redux/store/store';
import { setStarted } from '../redux/reducers/gameStarted';

let gameWorld = null;
const tickTime = (1/60.0) * 1000;
const maxRollbackFrames = 300;

const gameWidth = 1600;
const gameHeight = 900;
const player1SpawnX = 250;
const player2SpawnX = gameWidth - player1SpawnX - playerWidth;

const startGameLength = 180;
const startMessageLength = 60;

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

const createGameState = (player1State, player2State, roundState = 0, roundTimer = 0, messageTimer = 0, roundWinner = 0, player1Score = 0, player2Score = 0) => {
    return { 
        player1State, 
        player2State, 
        roundState,
        roundTimer,
        messageTimer,
        roundWinner,
        player1Score,
        player2Score
    };
}

const copyGameState = (state) => {
    return { 
        player1State: state.player1State, 
        player2State: state.player2State, 
        roundState: state.roundState,
        startGameTimer: state.startGameTimer,
        roundTimer: state.roundTimer,
        messageTimer: state.messageTimer,
        roundWinner: state.roundWinner,
        player1Score: state.player1Score,
        player2Score: state.player2Score
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
        this.states.set(0, createGameState(createPlayerState(player1SpawnX, -100), createPlayerState(player2SpawnX, -100)));

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
        const state = this.states.get(this.tickCount);
        const prevState = this.states.get(this.tickCount - 1);

        this.platforms.forEach(platform => {
            // Draw the platform
            ctx.fillStyle = 'black';
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        });

        if(this.tickCount >= 1) {
            const drawInterp = this.frameAccumulator / (tickTime + this.tickWaitTime);
            drawPlayerFromState(ctx, state.player1State, prevState.player1State, drawInterp);
            drawPlayerFromState(ctx, state.player2State, prevState.player2State, drawInterp);
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

    tickGameState = (stateTickCount, player1Input, prevPlayer1Input, player2Input, prevPlayer2Input) => {
        // Create new states
        let state = copyGameState(this.states.get(stateTickCount - 1));
        let prevPlayer1State = state.player1State;
        let player1State = copyPlayerState(state.player1State); 
        let prevPlayer2State = state.player2State;
        let player2State = copyPlayerState(state.player2State);

        if(state.messageTimer > 0)
            state.messageTimer--;

        if(state.roundState == 0) {
            state.roundTimer++;
            if(state.roundTimer == startGameLength) {
                state.roundState =1;
                state.roundTimer = 0;
                state.messageTimer = startMessageLength;
            }
            tickStartRoundPlayerState(prevPlayer1State, player1State);
            tickStartRoundPlayerState(prevPlayer2State, player2State);
        }
        else if (state.roundState == 1) {
            let player1OnGround = tickStartRoundPlayerState(prevPlayer1State, player1State);
            let player2OnGround = tickStartRoundPlayerState(prevPlayer2State, player2State);

            if(player1OnGround && player2OnGround)
                state.roundState = 2;
        }
        else if(state.roundState == 2) {
            // Tick the player states
            tickPlayerState(
                prevPlayer1State, 
                player1State,
                prevPlayer1Input, 
                player1Input);

            tickPlayerState(
                prevPlayer2State, 
                player2State,
                prevPlayer2Input, 
                player2Input);

            // Get any dash collisions
            const dashCollisionResult = doDashCollisions(player1State, player2State);
            if(dashCollisionResult != 0) {
                state.roundState = 3;
                state.roundWinner = dashCollisionResult;
            }
        }
        else if(state.roundState == 3) {
            // Tick the end round player states
            tickEndRoundPlayerState(prevPlayer1State, player1State, state.roundWinner == 2);
            tickEndRoundPlayerState(prevPlayer2State, player2State, state.roundWinner == 1);

            state.roundTimer += 1;

            if(state.roundTimer == 60) {
                if (state.roundWinner == 1)
                    state.player1Score++;
                else if (state.roundWinner == 2)
                    state.player2Score++;
            }
            if (state.roundTimer == 150) {
                state.roundState = 1;
                player1State = createPlayerState(player1SpawnX, -100);
                player2State = createPlayerState(player2SpawnX, -100);
                state.roundTimer = 0;
            }
        }

        // Update the player states
        state.player1State = player1State;
        state.player2State = player2State;

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