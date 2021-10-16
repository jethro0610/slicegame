let localInput = {
    up: false,
    down: false,
    left: false,
    right: false,
    dash: false
};

const getLocalInput = () => {
    return {
        up: localInput.up,
        down: localInput.down,
        left: localInput.left,
        right: localInput.right,
        dash: localInput.dash
    }
};

const onKeyDown = (e) => {
    if(e.keyCode === 32)
        localInput.up = true;
    if(e.keyCode === 83)
        localInput.down = true;
    if(e.keyCode === 65)
        localInput.left = true;
    if(e.keyCode === 68)
        localInput.right = true;
     if(e.keyCode === 16)
        localInput.dash = true;
}

const onKeyUp = (e) => {
    if(e.keyCode === 32)
        localInput.up = false;
    if(e.keyCode === 83)
        localInput.down = false;
    if(e.keyCode === 65)
        localInput.left = false;
    if(e.keyCode === 68)
        localInput.right = false;
    if(e.keyCode === 16)
        localInput.dash = false;
}
window.addEventListener('keydown', onKeyDown, true);
window.addEventListener('keyup', onKeyUp, true);

export { getLocalInput };