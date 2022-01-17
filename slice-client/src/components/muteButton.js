import React from 'react';
import { connect } from 'react-redux';
import './css/muteButton.css'
import muteOn from './images/muteon.png'
import muteOff from './images/muteoff.png'
import { toggleMute } from '../music/music'

const mapStateToProps =  state => {
    return {
      muted: state.muted
    }
  }

const ConnectMuteButton = ({muted}) => {
    // Return the canvas DOM element
    const image = muted ? muteOff : muteOn;

    return (
        <button onClick={toggleMute} id='muteButton'>
            <img src={image} id='muteButtonImg'/>
        </button>
    )
}
const MuteButton = connect(mapStateToProps)(ConnectMuteButton);
export default MuteButton;