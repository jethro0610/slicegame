import { tickStartRoundPlayerState, tickEndRoundPlayerState, tickPlayerState, doDashCollisions, createPlayerState, playerWidth, drawPlayerFromState, playerHeight } from "./player";
import { createCaptureState, drawCaptureState, tickCaptureState } from './capture';
import { drawPlatform } from "./platform";
import { levelHeight, levelWidth, platforms } from "./level";
import { AttackEffectState, PointEffectState } from "./effect";
import { disconnect } from './networking';
const lodash = require('lodash');

const startGameLength = 180;
const startMessageLength = 60;
const player1SpawnX = 250;
const player2SpawnX = levelWidth - player1SpawnX - playerWidth;
const maxPoints = 10;

const roundTypes = {
    STARTGAME: 0,
    STARTROUND: 1,
    FIGHT: 2,
    ENDROUND: 3,
    ENDGAME: 4
}

const createGameState = () => {
    return { 
        player1State: createPlayerState(player1SpawnX, -100, true), 
        player2State: createPlayerState(player2SpawnX, -100, false), 
        topCaptureState: createCaptureState(60, levelWidth / 2, levelHeight / 4, 300),
        bottomCaptureState: createCaptureState(90, levelWidth / 2, levelHeight / 2 + levelHeight / 4, 500),
        roundState: roundTypes.STARTGAME,
        roundTimer: 0,
        goTimer: 0, 
        roundWinner: 0,
        player1Score: 0,
        player2Score: 0,
        topCapture: 0,
        bottomCapture: 0,
        uiAnimTime: 1.0,
        effectStates: []
    };
}

const tickEffectStates = (states) => {
    // Tick effects by cloning the origial
    // this clone then replaces the effect states
    // of the game state. Effects that need to be destroyed
    // are discraded
    const newStates = [];
    states.forEach(effectState => {
        const newState = lodash.cloneDeep(effectState);
        newState.tick();
        if (!newState.shouldDestroy()) // Don't push effects back into the state if they are to be destroyed
            newStates.push(newState);
    })
    return newStates;
}

const tickGameState = (state, player1Input, prevPlayer1Input, player2Input, prevPlayer2Input) => {
    // Create new states for player
    let playerStateInfo = {
        prevPlayer1Input,
        player1Input,
        prevPlayer1State: state.player1State,
        player1State: lodash.cloneDeep(state.player1State),
        prevPlayer2Input,
        player2Input,
        prevPlayer2State: state.player2State,
        player2State: lodash.cloneDeep(state.player2State)
    }

    // Create new states for capture points
    state.topCaptureState = lodash.cloneDeep(state.topCaptureState);
    state.bottomCaptureState = lodash.cloneDeep(state.bottomCaptureState);

    // Tick and update the effects
    state.effectStates = tickEffectStates(state.effectStates);

    // Tick the message and text timers until they are complete 
    // this means they are either not drawn on screen or are done animating
    if(state.messageTimer > 0)
        state.messageTimer--;
    if (state.textAnimTime < 1.0)
        state.textAnimTime += 0.075;
    else
        state.textAnimTime = 1.0;

    switch (state.roundState) {
        case roundTypes.STARTGAME:
            tickStartGameState(state, playerStateInfo);
            break;

        case roundTypes.STARTROUND:
            tickStartRoundGameState(state, playerStateInfo);
            break;
        case roundTypes.FIGHT:
            tickMidroundGameState(state, playerStateInfo);
            break;
        case roundTypes.ENDROUND:
            tickEndRoundGameState(state, playerStateInfo);
            break;
        case roundTypes.ENDGAME:
            tickEndGameState(state);
            break;
        default:
            break;
    }

    // Update the player states of the game state
    state.player1State = playerStateInfo.player1State;
    state.player2State = playerStateInfo.player2State;
}

const tickStartGameState = (state, playerStateInfo) => {
    // At the start of the game, animate the intro text
    if (state.roundTimer === 0)
        state.textAnimTime = 0.0;

    // Add the round timer and go to the next round once at the required time
    state.roundTimer++;
    if(state.roundTimer === startGameLength) {
        state.roundState = roundTypes.STARTROUND;
        state.roundTimer = 0;
        state.messageTimer = startMessageLength;
        state.textAnimTime = 0.0
    }
    const player1TickOutput = tickStartRoundPlayerState(playerStateInfo.prevPlayer1State, playerStateInfo.player1State);
    const player2TickOutput = tickStartRoundPlayerState(playerStateInfo.prevPlayer2State, playerStateInfo.player2State);

    // Push the effects the player ticks created to the game effect state
    Array.prototype.push.apply(state.effectStates, player1TickOutput.spawnedEffects);
    Array.prototype.push.apply(state.effectStates, player2TickOutput.spawnedEffects);
}

const tickStartRoundGameState = (state, playerStateInfo) => {
    const player1TickOutput = tickStartRoundPlayerState(playerStateInfo.prevPlayer1State, playerStateInfo.player1State);
    const player2TickOutput = tickStartRoundPlayerState(playerStateInfo.prevPlayer2State, playerStateInfo.player2State);

    // Push the effects the player ticks created to the game effect state
    state.effectStates.push.apply(player1TickOutput.spawnedEffects);
    state.effectStates.push.apply(player2TickOutput.spawnedEffects);

    // Start the fight when both players touch the ground
    if(player1TickOutput.onGround && player2TickOutput.onGround)
        state.roundState = roundTypes.FIGHT;
}

const tickMidroundGameState = (state, playerStateInfo) => {
    // Tick the player states
    const player1TickOutput = tickPlayerState(
        playerStateInfo.prevPlayer1State, 
        playerStateInfo.player1State,
        playerStateInfo.prevPlayer1Input, 
        playerStateInfo.player1Input);

    const player2TickOutput = tickPlayerState(
        playerStateInfo.prevPlayer2State, 
        playerStateInfo.player2State,
        playerStateInfo.prevPlayer2Input, 
        playerStateInfo.player2Input);
    
    // Push the effects the player ticks created to the game effect state
    Array.prototype.push.apply(state.effectStates, player1TickOutput.spawnedEffects);
    Array.prototype.push.apply(state.effectStates, player2TickOutput.spawnedEffects);

    // Get any dash collisions and go to the next round
    // also creates any needed effects
    const dashCollisionResult = doDashCollisions(playerStateInfo.player1State, playerStateInfo.player2State);
    if(dashCollisionResult !== 0) {
        state.roundState = roundTypes.ENDROUND;
        state.roundWinner = dashCollisionResult;
        if (dashCollisionResult === 1)
            state.effectStates.push(new AttackEffectState(playerStateInfo.player1State.x, playerStateInfo.player1State.y + playerHeight / 2));
        else if (dashCollisionResult === 2)
            state.effectStates.push(new AttackEffectState(playerStateInfo.player2State.x, playerStateInfo.player2State.y + playerHeight / 2));
    }

    // Add any capture points
    tickCaptureState(state.topCaptureState, playerStateInfo.player1State, playerStateInfo.player2State, onScore, state);
    tickCaptureState(state.bottomCaptureState, playerStateInfo.player1State, playerStateInfo.player2State, onScore, state);

    if (state.player1Score >= maxPoints || state.player2Score >= maxPoints) {
        playerStateInfo.player1State = createPlayerState(player1SpawnX, -100, true);
        playerStateInfo.player2State = createPlayerState(player2SpawnX, -100, false);
        state.roundTimer = 0;
        state.roundState = roundTypes.ENDGAME;
        state.textAnimTime = 0.0;
    }
}

const onScore = (scoringPlayer, args) => {
    const state = args[0];
    if (scoringPlayer === 1)
        state.player1Score += 1;
    else if (scoringPlayer === 2)
        state.player2Score += 1;

    state.effectStates.push(new PointEffectState(levelWidth / 2, 255, 30, 60));
    state.textAnimTime = 0.0;
    state.roundWinner = scoringPlayer;
}

const tickEndRoundGameState = (state, playerStateInfo) => {
    // Tick the end round player states
    tickEndRoundPlayerState(playerStateInfo.prevPlayer1State, playerStateInfo.player1State, state.roundWinner === 2);
    tickEndRoundPlayerState(playerStateInfo.prevPlayer2State, playerStateInfo.player2State, state.roundWinner === 1);

    state.roundTimer += 1;

    if(state.roundTimer === 60) {
        if (state.roundWinner === 1)
            state.player1Score += 5;
        else if (state.roundWinner === 2)
            state.player2Score += 5;

        state.textAnimTime = 0.0;
        state.effectStates.push(new PointEffectState(levelWidth / 2, levelHeight / 2, 30, 60));
    }
    if (state.roundTimer === 150) {
        state.roundState = roundTypes.STARTROUND;
        playerStateInfo.player1State = createPlayerState(player1SpawnX, -100, true);
        playerStateInfo.player2State = createPlayerState(player2SpawnX, -100, false);
        state.roundTimer = 0;
        if (state.player1Score >= maxPoints || state.player2Score >= maxPoints) {
            state.roundState = roundTypes.ENDGAME;
            state.textAnimTime = 0.0;
        }
    }
}

const tickEndGameState = (state) => {
    state.roundTimer += 1;
    if (state.roundTimer === 120) {
        disconnect();
    }
}

const playerColor = '#5B8EAB'
const platformColor = '#AB8F6C'
const shadowColor = 'rgba(0, 0, 0, 0.05)'
const drawGameState = (prevState, state, ctx, drawInterp) => {
    // Don't interpolate if at the beginning of round or end of game (this prevents teleport trailing)
    if ((state.roundState === roundTypes.STARTROUND && state.roundTimer < 10) || state.roundState === roundTypes.ENDGAME)
        drawInterp = 1.0;

    // Draw the platform and player shadows
    platforms.forEach(platform => {
        drawPlatform(ctx, platform, shadowColor, 0, 5);
    });
    drawPlayerFromState(ctx, state.player1State, prevState.player1State, drawInterp, shadowColor, 0, 5);
    drawPlayerFromState(ctx, state.player2State, prevState.player2State, drawInterp, shadowColor, 0, 5);

    // Draw the effects
    state.effectStates.forEach(effectState => {
        effectState.draw(ctx);
    })

    // Draw the capture indicators under the platform
    drawCaptureState(ctx, state.topCaptureState, 100, 75);
    drawCaptureState(ctx, state.bottomCaptureState, 100, 75);

    // Draw the platforms
    platforms.forEach(platform => {
        drawPlatform(ctx, platform, platformColor);
    });

    // Draw the players
    drawPlayerFromState(ctx, state.player1State, prevState.player1State, drawInterp, playerColor);
    drawPlayerFromState(ctx, state.player2State, prevState.player2State, drawInterp, playerColor);

    // Draw the all UI texts
    if (state.roundState === roundTypes.STARTGAME)
        drawText(ctx, 'Ready...', state.textAnimTime);
    else if(state.roundState === roundTypes.ENDROUND) // Draw the score in the middle of the screen
        drawText(ctx, state.player1Score + ' - ' + state.player2Score, state.textAnimTime);
    else if (state.roundState === roundTypes.ENDGAME)
        drawText(ctx, "Player " + state.roundWinner + " Wins", state.textAnimTime);
    else // Draw the score at the top of the screen
        drawTopText(ctx, state.player1Score + ' - ' + state.player2Score, state.textAnimTime);

    if (state.messageTimer > 0) 
        drawText(ctx, 'Go!', state.textAnimTime);
}

const drawText = (ctx, text, textAnimTime) => {
    ctx.font = '125px Work Sans';
    ctx.textAlign ='center';
    const easeTime = 1 - Math.pow(1 - textAnimTime, 4);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillText(text, levelWidth / 2, (levelHeight / 2) + 50 - (-100 + easeTime * 100) + 3);

    ctx.fillStyle = 'rgba(255, 255, 255, ' + textAnimTime.toString() + ')';
    ctx.fillText(text, levelWidth / 2, (levelHeight / 2) + 50 - (-100 + easeTime * 100));
}

const drawTopText = (ctx, text, textAnimTime) => {
    ctx.font = '75px Work Sans';
    ctx.textAlign ='center';
    const easeTime = 1 - Math.pow(1 - textAnimTime, 4);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)' 
    ctx.fillText(text, levelWidth / 2, 80 - (-100 + easeTime * 100) + 3);

    ctx.fillStyle = 'rgba(255, 255, 255, ' + textAnimTime.toString() + ')';
    ctx.fillText(text, levelWidth / 2, 80 - (-100 + easeTime * 100));
}

export { createGameState, tickGameState, drawGameState, player1SpawnX, player2SpawnX };