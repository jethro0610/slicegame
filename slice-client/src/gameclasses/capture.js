import Collider from "./collider";
import { playerHeight, playerWidth } from "./player";

const createCaptureState = (maxPoints, x, y, width) => {
    return {
        maxPoints: maxPoints,
        points: 0,
        x: x,
        y: y,
        width: width,
        ballTime: -1
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

const tickCaptureState = (captureState, player1State, player2State, tickTime, onScore, ...args) => {
    // Add any capture points
    const capturePlayer = getPlayersOnCapturePoint(captureState, player1State, player2State);

    if (captureState.ballTime === -1) {
        if (capturePlayer === 0)
            captureState.points += 0.25;
        else if (capturePlayer !== 3)
            captureState.points += 2;
    }

    if (captureState.points < 0)
        captureState.points = 0;

    if (captureState.points > captureState.maxPoints) {
        captureState.points = 0;
        captureState.ballTime = 0;
    }

    if (captureState.ballTime !== -1) {
        captureState.ballTime += 1;
    }

    if (captureState.ballTime >= 8) {
        captureState.ballTime = 8;

        let ballCollider = new Collider(captureState.x - 30, captureState.y - 75 - 30, 60, 60);
        let collider1 = new Collider(player1State.x, player1State.y, playerWidth, playerHeight);
        let collider2 = new Collider(player2State.x, player2State.y, playerWidth, playerHeight);

        const player1Touching = collider1.isIntersecting(ballCollider);
        const player2Touching = collider2.isIntersecting(ballCollider);

        if (player1Touching && ! player2Touching) {
            captureState.ballTime = -1;
            onScore(1, captureState.x, captureState.y - 75, tickTime, args);
        }

        if (player2Touching && !player1Touching) {
            captureState.ballTime = -1;
            onScore(2, captureState.x, captureState.y - 75, tickTime, args);
        }
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

    if (captureState.ballTime !== -1)
        drawBall(ctx, captureState);

    // Draw the amount indicator
    const amount = captureState.points / captureState.maxPoints
    if (amount <= 0)
        return;
    ctx.fillStyle = '#B5E0F7';
    ctx.beginPath(); 
    const easeAmount = amount
    const startY = captureState.y + height / 2;
    ctx.lineTo(captureState.x - width * easeAmount, startY - (height / 2) * easeAmount + 1);
    ctx.lineTo(captureState.x + width * easeAmount, startY - (height / 2) * easeAmount + 1);
    ctx.lineTo(captureState.x, startY + (height / 2) * easeAmount + 1);
    ctx.fill();
}

const drawBall = (ctx, captureState) => {
    const ballScalar = (1 - Math.pow(1 - (captureState.ballTime / 8), 2));
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    const captureBallCenter = captureState.y - 75 * ballScalar;
    ctx.beginPath();
    ctx.lineTo(captureState.x, captureBallCenter + 30 + 5);
    ctx.lineTo(captureState.x + 30, captureBallCenter + 5);
    ctx.lineTo(captureState.x, captureBallCenter - 30 + 5);
    ctx.lineTo(captureState.x - 30, captureBallCenter + 5);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(181, 224, 247, ' + ballScalar.toString()  + ' )';
    ctx.beginPath();
    ctx.lineTo(captureState.x, captureBallCenter + 30);
    ctx.lineTo(captureState.x + 30, captureBallCenter);
    ctx.lineTo(captureState.x, captureBallCenter - 30);
    ctx.lineTo(captureState.x - 30, captureBallCenter);
    ctx.fill();
}

export { createCaptureState, tickCaptureState, drawCaptureState };