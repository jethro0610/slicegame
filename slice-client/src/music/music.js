import bluebird from './Bluebird.mp3'
import presentday from './Present Day.mp3'
const songs = [];
let currentSong = -1;

const playNextSong = () => {
    if (currentSong !== -1)
        songs[currentSong].stop();

    currentSong += 1;
    if (currentSong >= songs.length)
        currentSong = 0;

    songs[currentSong].play();
}

const playRandomSong = () => {
    if (currentSong !== -1)
        songs[currentSong].stop();

    currentSong = Math.floor(Math.random() * songs.length);
    songs[currentSong].play();
}

const stopSong = () => {
    if (currentSong === -1)
        return;

    songs[currentSong].stop();
    currentSong = -1;
}

function song(src) {
    this.sound = document.createElement('audio');
    this.sound.src = src;
    this.sound.setAttribute('preload', 'auto');
    this.sound.setAttribute('controls', 'none');
    this.sound.style.display = 'none';
    this.sound.volume = 0.25;
    document.body.appendChild(this.sound);
    this.play = function() {
        this.sound.currentTime = 0;
        this.sound.play();
    }

    this.stop = function() {
        this.sound.pause();
    }

    this.sound.onended = () => {
        playNextSong();
    }
}

songs.push(new song(bluebird));
songs.push(new song(presentday));

export { playNextSong, playRandomSong, stopSong}