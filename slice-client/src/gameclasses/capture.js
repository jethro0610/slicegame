import { playerHeight, playerWidth } from "./player";

const createCaptureState = (maxPoints, x, y, width) => {
    return {
        maxPoints: maxPoints,
        points: 0,
        x: x,
        y: y,
        width: width
    };
}

const playerIsStandingOn = (playerState, x, y, width) => {
    return (playerState.y + playerHeight === y && playerState.x + playerWidth > x - width / 2 && playerState.x < x + width / 2);
}

const getPlayersOnCapturePoint = (captureState, player1State, player2State) => {
    const player1Standing = playerIsStandingOn(player1State, captureState.x, captureState.y, captureState.width);
    const player2Standing = playerIsStandingOn(player2State, captureState.x, captureState.y, captureState.width);

    if (player1Standing && player2Standing)
        return 3;
    else if (player1Standing)
        return 1;
    else if (player2Standing)
        return 2;
    else 
        return 0;
}

const tickCaptureState = (captureState, player1State, player2State, onScore, ...args) => {
    // Add any capture points
    const capturePlayer = getPlayersOnCapturePoint(captureState, player1State, player2State);
    if (capturePlayer === 0)
        captureState.points -= 0.25;
    else if (capturePlayer !== 3)
        captureState.points += 1;

    if (captureState.points < 0)
        captureState.points = 0;

    if (captureState.points > captureState.maxPoints) {
        captureState.points = 0;
        onScore(capturePlayer, args);
    }
}

const drawCaptureState = (ctx, captureState, width, height) => {
    // Draw the capture point shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.beginPath();
    ctx.lineTo(captureState.x - width, captureState.y + 6);
    ctx.lineTo(captureState.x + width, captureState.y + 6);
    ctx.lineTo(captureState.x, captureState.y + height + 6);
    ctx.fill();

    // Draw the outline
    ctx.fillStyle = '#FFECD4';
    ctx.beginPath();
    ctx.lineTo(captureState.x - width, captureState.y + 1);
    ctx.lineTo(captureState.x + width, captureState.y + 1);
    ctx.lineTo(captureState.x, captureState.y + height + 1);
    ctx.fill();

    // Draw the amount indicator
    const amount = captureState.points / captureState.maxPoints
    if (amount <= 0)
        return;
    ctx.fillStyle = '#B5E0F7';
    ctx.beginPath(); 
    const easeAmount = (1 - Math.pow(1 - amount, 2));
    const startY = captureState.y + height / 2;
    ctx.lineTo(captureState.x - width * easeAmount, startY - (height / 2) * easeAmount + 1);
    ctx.lineTo(captureState.x + width * easeAmount, startY - (height / 2) * easeAmount + 1);
    ctx.lineTo(captureState.x, startY + (height / 2) * easeAmount + 1);
    ctx.fill();
}

export { createCaptureState, tickCaptureState, drawCaptureState };