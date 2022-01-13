import React from 'react';
import './css/startScreen.css'
import './css/button.css'
const StartScreen = props => {
    // Return the canvas DOM element
    return (
        <div class='startScreenBody'>
            <div>Slice</div>
            <button class='button'>Find a Match</button>
        </div>
    )
}

export default StartScreen;