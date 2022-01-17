import dashAudio from '../sounds/dash.wav'
import runAudio from '../sounds/run.wav'
import heavyAudio from '../sounds/heavy.wav'
import jumpAudio from '../sounds/jump.wav'
import doubleJumpAudio from '../sounds/doublejump.wav'
import pointAudio from '../sounds/point.wav'
import hitAudio from '../sounds/hit.wav'

function sound(src) {
    this.ticksPlayed = new Set();
    this.sound = document.createElement('audio');
    this.sound.src = src;
    this.sound.setAttribute('preload', 'auto');
    this.sound.setAttribute('controls', 'none');
    this.sound.style.display = 'none';
    document.body.appendChild(this.sound);
    this.play = function(tickTime) {
        if (!this.ticksPlayed.has(tickTime)) {
            this.sound.currentTime = 0;
            this.sound.play();
            this.ticksPlayed.add(tickTime);
        }
    }

    this.stop = function() {
        this.sound.pause();
    }
}

const dashSound = new sound(dashAudio);
const runSound = new sound(runAudio);
const heavySound = new sound(heavyAudio);
const jumpSound = new sound(jumpAudio);
const doubleJumpSound = new sound(doubleJumpAudio);
const pointSound = new sound(pointAudio);
const hitSound = new sound(hitAudio);

export { dashSound, runSound, heavySound, jumpSound, doubleJumpSound, pointSound, hitSound }