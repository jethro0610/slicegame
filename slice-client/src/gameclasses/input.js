let localInput = {
    up: false,
    down: false,
    left: false,
    right: false
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
}
window.addEventListener('keydown', onKeyDown, true);
window.addEventListener('keyup', onKeyUp, true);

export default localInput;