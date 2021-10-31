import { tickStartRoundPlayerState, tickEndRoundPlayerState, tickPlayerState, doDashCollisions, createPlayerState, playerWidth, drawPlayerFromState } from "./player";
import { drawPlatform } from "./platform";
import { levelHeight, levelWidth, platforms } from "./level";

const lodash = require('lodash')
const startGameLength = 180;
const startMessageLength = 60;
const player1SpawnX = 250;
const player2SpawnX = levelWidth - player1SpawnX - playerWidth;

const createGameState = () => {
    return { 
        player1State: createPlayerState(player1SpawnX, -100, true), 
        player2State: createPlayerState(player2SpawnX, -100, false), 
        roundState: 0,
        roundTimer: 0,
        messageTimer: 0, 
        roundWinner: 0,
        player1Score: 0,
        player2Score: 0,
        effectStates: []
    };
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

    // Tick effects
    const effectStates = []
    state.effectStates.forEach(effectState => {
        const newState = lodash.cloneDeep(effectState)
        newState.tick()
        if (!newState.shouldDestroy()) // Don't push effects back into the state if they are to be destroyed
            effectStates.push(newState)
    })
    state.effectStates = effectStates

    if(state.messageTimer > 0)
        state.messageTimer--;

    switch (state.roundState) {
        case 0:
            tickStartGameState(state, playerStateInfo)
            break;

        case 1:
            tickStartRoundGameState(state, playerStateInfo)
            break;
        case 2:
            tickMidroundGameState(state, playerStateInfo)
            break;
        case 3:
            tickEndRoundGameState(state, playerStateInfo)
            break;

        default:
            break;
    }

    // Update the player states
    state.player1State = playerStateInfo.player1State;
    state.player2State = playerStateInfo.player2State;
}

const tickStartGameState = (state, playerStateInfo) => {
    state.roundTimer++;
    if(state.roundTimer === startGameLength) {
        state.roundState =1;
        state.roundTimer = 0;
        state.messageTimer = startMessageLength;
    }
    tickStartRoundPlayerState(playerStateInfo.prevPlayer1State, playerStateInfo.player1State);
    tickStartRoundPlayerState(playerStateInfo.prevPlayer2State, playerStateInfo.player2State);
}

const tickStartRoundGameState = (state, playerStateInfo) => {
    const player1OnGround = tickStartRoundPlayerState(playerStateInfo.prevPlayer1State, playerStateInfo.player1State);
    const player2OnGround = tickStartRoundPlayerState(playerStateInfo.prevPlayer2State, playerStateInfo.player2State);

    if(player1OnGround && player2OnGround)
        state.roundState = 2;
}

const tickMidroundGameState = (state, playerStateInfo) => {
    // Tick the player states
    const player1StateEffects = tickPlayerState(
        playerStateInfo.prevPlayer1State, 
        playerStateInfo.player1State,
        playerStateInfo.prevPlayer1Input, 
        playerStateInfo.player1Input);

    const player2StateEffects = tickPlayerState(
        playerStateInfo.prevPlayer2State, 
        playerStateInfo.player2State,
        playerStateInfo.prevPlayer2Input, 
        playerStateInfo.player2Input);
    
    // Push the effects the player ticks created to the state
    player1StateEffects.forEach(effectState => {
        state.effectStates.push(effectState)
    });
    player2StateEffects.forEach(effectState => {
        state.effectStates.push(effectState)
    });

    // Get any dash collisions
    const dashCollisionResult = doDashCollisions(playerStateInfo.player1State, playerStateInfo.player2State);
    if(dashCollisionResult !== 0) {
        state.roundState = 3;
        state.roundWinner = dashCollisionResult;
    }
}

const tickEndRoundGameState = (state, playerStateInfo) => {
    // Tick the end round player states
    tickEndRoundPlayerState(playerStateInfo.prevPlayer1State, playerStateInfo.player1State, state.roundWinner === 2);
    tickEndRoundPlayerState(playerStateInfo.prevPlayer2State, playerStateInfo.player2State, state.roundWinner === 1);

    state.roundTimer += 1;

    if(state.roundTimer === 60) {
        if (state.roundWinner === 1)
            state.player1Score++;
        else if (state.roundWinner === 2)
            state.player2Score++;
    }
    if (state.roundTimer === 150) {
        state.roundState = 1;
        playerStateInfo.player1State = createPlayerState(player1SpawnX, -100, true);
        playerStateInfo.player2State = createPlayerState(player2SpawnX, -100, false);
        state.roundTimer = 0;
    }
}

const playerColor = 'rgb(180, 180, 180)'
const platformColor = 'rgb(60, 60, 60)'
const shadowColor = 'rgba(0, 0, 0, 0.5)'
const drawGameState = (prevState, state, ctx, drawInterp) => {
    // Draw the platform and player shadows
    platforms.forEach(platform => {
        drawPlatform(ctx, platform, shadowColor, 0, 5)
    });
    drawPlayerFromState(ctx, state.player1State, prevState.player1State, drawInterp, shadowColor, 0, 5);
    drawPlayerFromState(ctx, state.player2State, prevState.player2State, drawInterp, shadowColor, 0, 5);

    // Draw the effects
    state.effectStates.forEach(effectState => {
        effectState.draw(ctx)
    })

    // Draw the platforms
    platforms.forEach(platform => {
        drawPlatform(ctx, platform, platformColor)
    });

    // Draw the players
    drawPlayerFromState(ctx, state.player1State, prevState.player1State, drawInterp, playerColor);
    drawPlayerFromState(ctx, state.player2State, prevState.player2State, drawInterp, playerColor);

    if (state.roundState === 0)
        drawText(ctx, 'Ready...');
    else if(state.roundState === 3)
        drawText(ctx, state.player1Score + ' - ' + state.player2Score);
    else
        drawTopText(ctx, state.player1Score + ' - ' + state.player2Score);

    if (state.messageTimer > 0) 
        drawText(ctx, 'Slice!');
}

const drawText = (ctx, text) => {
    ctx.font = '125px Arial';
    ctx.textAlign ='center';
    ctx.fillStyle = 'black';
    ctx.fillText(text, levelWidth / 2, (levelHeight / 2) + 50);
}

const drawTopText = (ctx, text) => {
    ctx.font = '75px Arial';
    ctx.textAlign ='center';
    ctx.fillStyle = 'black';
    ctx.fillText(text, levelWidth / 2, 80);
}

export { createGameState, tickGameState, drawGameState, player1SpawnX, player2SpawnX }