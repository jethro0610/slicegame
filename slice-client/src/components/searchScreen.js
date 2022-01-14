import React from 'react';
import './css/searchScreen.css'
import './css/button.css'

const SearchScreen = props => {
    // Return the canvas DOM element
    return (
        <div class='searchScreenBody'>
            <div>Finding a Match...</div>
            <div class ='loader'>
                <div class='l1'></div>
                <div class='l2'></div>
                <div class='l3'></div>
            </div>
            <button class='button cancelButton'>Cancel</button>
        </div>

    )
}

export default SearchScreen;