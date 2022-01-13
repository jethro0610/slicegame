import React from 'react';
import { requestSearch } from '../matchmaking';
import './css/startScreen.css'
import './css/button.css'

const StartScreen = props => {
    // Return the canvas DOM element
    return (
        <div class='startScreenBody'>
            <div>Paper Cuts!</div>
            <button class='button' onClick={requestSearch}>Find a Match</button>
        </div>
    )
}

export default StartScreen;