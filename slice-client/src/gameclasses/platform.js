const drawPlatform = (ctx, platformRect, color = 'black', offsetX = 0, offsetY = 0) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(platformRect.x + offsetX, platformRect.y + offsetY)
    ctx.lineTo(platformRect.x + platformRect.width + offsetX, platformRect.y + offsetY)
    ctx.lineTo(platformRect.x + platformRect.width / 2 + offsetX, platformRect.y + platformRect.height * 1.5 + offsetY)
    ctx.closePath();
    ctx.fill(); 
}

export { drawPlatform }