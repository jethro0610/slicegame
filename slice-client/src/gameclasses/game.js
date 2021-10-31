import { tickStartRoundPlayerState, tickEndRoundPlayerState, tickPlayerState, doDashCollisions, createPlayerState, playerWidth, drawPlayerFromState, playerHeight } from "./player";
import { drawPlatform } from "./platform";
import { levelHeight, levelWidth, platforms } from "./level";
import { AttackEffectState, PointEffectState } from "./effect";

const lodash = require('lodash')
const startGameLength = 180;
const startMessageLength = 60;
const player1SpawnX = 250;
const player2SpawnX = levelWidth - player1SpawnX - playerWidth;
const topCaptureMax = 60
const bottomCaptureMax = 90

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
        topCapture: 0,
        bottomCapture: 0,
        textAnimTime: 1.0,
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

    if (state.textAnimTime < 1.0)
        state.textAnimTime += 0.075;
    else
        state.textAnimTime = 1.0

    // Update the player states
    state.player1State = playerStateInfo.player1State;
    state.player2State = playerStateInfo.player2State;
}

const tickStartGameState = (state, playerStateInfo) => {
    if (state.roundTimer == 0)
        state.textAnimTime = 0.0
    state.roundTimer++;
    if(state.roundTimer === startGameLength) {
        state.roundState = 1;
        state.roundTimer = 0;
        state.messageTimer = startMessageLength;
        state.textAnimTime = 0.0
    }
    const player1TickInfo = tickStartRoundPlayerState(playerStateInfo.prevPlayer1State, playerStateInfo.player1State);
    const player2TickInfo = tickStartRoundPlayerState(playerStateInfo.prevPlayer2State, playerStateInfo.player2State);

    // Push the effects the player ticks created to the state
    player1TickInfo.spawnedEffects.forEach(effectState => {
        state.effectStates.push(effectState)
    });
    player2TickInfo.spawnedEffects.forEach(effectState => {
        state.effectStates.push(effectState)
    });
}

const tickStartRoundGameState = (state, playerStateInfo) => {
    const player1TickInfo = tickStartRoundPlayerState(playerStateInfo.prevPlayer1State, playerStateInfo.player1State);
    const player2TickInfo = tickStartRoundPlayerState(playerStateInfo.prevPlayer2State, playerStateInfo.player2State);

    // Push the effects the player ticks created to the state
    player1TickInfo.spawnedEffects.forEach(effectState => {
        state.effectStates.push(effectState)
    });
    player2TickInfo.spawnedEffects.forEach(effectState => {
        state.effectStates.push(effectState)
    });

    if(player1TickInfo.onGround && player2TickInfo.onGround)
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
        if (dashCollisionResult == 1) {
            state.effectStates.push(new AttackEffectState(playerStateInfo.player1State.x, playerStateInfo.player1State.y + playerHeight / 2))
        }
        else if (dashCollisionResult == 2) {
            state.effectStates.push(new AttackEffectState(playerStateInfo.player2State.x, playerStateInfo.player2State.y + playerHeight / 2))
        }
    }

    // Add any capture points
    const topCapturePlayer = getPlayersOnTopCapturePoint(playerStateInfo.player1State, playerStateInfo.player2State)
    if (topCapturePlayer === 0)
        state.topCapture -= 0.25
    else if (topCapturePlayer !== 3)
        state.topCapture += 1

    if (state.topCapture < 0)
        state.topCapture = 0

    if (state.topCapture > topCaptureMax) {
        if (topCapturePlayer === 1)
            state.player1Score += 1
        else if (topCapturePlayer === 2)
            state.player2Score += 1
        state.topCapture = 0
        state.effectStates.push(new PointEffectState(levelWidth / 2, 255, 30, 60));
        state.textAnimTime = 0.0
    }

    const bottomCapturePlayer = getPlayersOnBottomCapturePoint(playerStateInfo.player1State, playerStateInfo.player2State)
    if (bottomCapturePlayer === 0)
        state.bottomCapture -= 0.25
    else if (bottomCapturePlayer !== 3)
        state.bottomCapture += 1

    if (state.bottomCapture < 0)
        state.bottomCapture = 0

    if (state.bottomCapture > bottomCaptureMax) {
        if (bottomCapturePlayer === 1)
            state.player1Score += 1
        else if (bottomCapturePlayer === 2)
            state.player2Score += 1
        state.bottomCapture = 0
        state.effectStates.push(new PointEffectState(levelWidth / 2, 705, 30, 60));
        state.textAnimTime = 0.0
    }
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
        state.effectStates.push(new PointEffectState(levelWidth / 2, levelHeight / 2, 30, 60))
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
    // Don't interpolate if at the beginning of round (this prevents teleport visibility)
    if (state.roundState == 1 && state.roundTimer < 10)
        drawInterp = 1.0;

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

    // Draw the capture indicators under the platform
    drawCaptureIndicator(ctx, levelWidth / 2, 255, 50, state.topCapture / topCaptureMax)
    drawCaptureIndicator(ctx, levelWidth / 2, 705, 50, state.bottomCapture / bottomCaptureMax)

    // Draw the platforms
    platforms.forEach(platform => {
        drawPlatform(ctx, platform, platformColor)
    });

    // Draw the players
    drawPlayerFromState(ctx, state.player1State, prevState.player1State, drawInterp, playerColor);
    drawPlayerFromState(ctx, state.player2State, prevState.player2State, drawInterp, playerColor);

    // Draw the all UI texts
    if (state.roundState === 0)
        drawText(ctx, 'Ready...', state.textAnimTime);
    else if(state.roundState === 3)
        drawText(ctx, state.player1Score + ' - ' + state.player2Score, state.textAnimTime);
    else
        drawTopText(ctx, state.player1Score + ' - ' + state.player2Score, state.textAnimTime);

    if (state.messageTimer > 0) 
        drawText(ctx, 'Go!', state.textAnimTime);
}

const drawText = (ctx, text, textAnimTime) => {
    ctx.font = '125px Work Sans';
    ctx.textAlign ='center';
    const easeTime = 1 - Math.pow(1 - textAnimTime, 4);
    ctx.fillStyle = 'rgba(230, 230, 230, ' + textAnimTime.toString() + ')';
    ctx.fillText(text, levelWidth / 2, (levelHeight / 2) + 50 - (-100 + easeTime * 100));
}

const drawTopText = (ctx, text, textAnimTime) => {
    ctx.font = '75px Work Sans';
    ctx.textAlign ='center';
    const easeTime = 1 - Math.pow(1 - textAnimTime, 4);
    ctx.fillStyle = 'rgba(230, 230, 230, ' + textAnimTime.toString() + ')';
    ctx.fillText(text, levelWidth / 2, 80 - (-100 + easeTime * 100));
}

const drawCaptureIndicator = (ctx, x, y, radius, amount) => {
    ctx.fillStyle = shadowColor;
    ctx.beginPath();
    ctx.lineTo(x + radius * Math.sin((0) * Math.PI / 180), (y + 5) + radius * Math.cos((0) * Math.PI / 180))
    ctx.lineTo(x + radius * 2 * Math.sin((120) * Math.PI / 180), (y + 5) + radius * Math.cos((120) * Math.PI / 180))
    ctx.lineTo(x + radius * 2 * Math.sin((240) * Math.PI / 180), (y + 5) + radius * Math.cos((240) * Math.PI / 180))
    ctx.fill();

    ctx.fillStyle = 'rgb(30, 30, 30)';
    ctx.beginPath();
    ctx.lineTo(x + radius * Math.sin((0) * Math.PI / 180), y + radius * Math.cos((0) * Math.PI / 180))
    ctx.lineTo(x + radius * 2 * Math.sin((120) * Math.PI / 180), y + radius * Math.cos((120) * Math.PI / 180))
    ctx.lineTo(x + radius * 2 * Math.sin((240) * Math.PI / 180), y + radius * Math.cos((240) * Math.PI / 180))
    ctx.fill();

    ctx.strokeStyle = 'gray';
    ctx.beginPath(); 
    const easeRadius = radius * (1 - Math.pow(1 - amount, 2));
    ctx.lineTo(x + easeRadius * Math.sin((0) * Math.PI / 180), y + easeRadius * Math.cos((0) * Math.PI / 180))
    ctx.lineTo(x + easeRadius * 2 * Math.sin((120) * Math.PI / 180), y + easeRadius * Math.cos((120) * Math.PI / 180))
    ctx.lineTo(x + easeRadius * 2 * Math.sin((240) * Math.PI / 180), y + easeRadius * Math.cos((240) * Math.PI / 180))
    ctx.closePath();
    ctx.stroke();
}

const playerIsStandingOn = (playerState, height, x0, x1) => {
    return (playerState.y + playerHeight === height && playerState.x + playerWidth > x0 && playerState.x < x1)
}

const getPlayersOnTopCapturePoint = (player1State, player2State) => {
    const player1Standing = playerIsStandingOn(player1State, levelHeight /4, levelWidth / 2 - 150, levelWidth / 2 + 150);
    const player2Standing = playerIsStandingOn(player2State, levelHeight /4, levelWidth / 2 - 150, levelWidth / 2 + 150);

    if (player1Standing && player2Standing)
        return 3
    else if (player1Standing)
        return 1
    else if (player2Standing)
        return 2
    else 
        return 0
}

const getPlayersOnBottomCapturePoint = (player1State, player2State) => {
    const player1Standing = playerIsStandingOn(player1State, levelHeight / 2 + levelHeight / 4, levelWidth / 2 - 250, levelWidth / 2 + 250);
    const player2Standing = playerIsStandingOn(player2State, levelHeight / 2 + levelHeight / 4, levelWidth / 2 - 250, levelWidth / 2 + 250);

    if (player1Standing && player2Standing)
        return 3
    else if (player1Standing)
        return 1
    else if (player2Standing)
        return 2
    else 
        return 0
}

export { createGameState, tickGameState, drawGameState, player1SpawnX, player2SpawnX }