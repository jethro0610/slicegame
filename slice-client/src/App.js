import './App.css';
import GameCanvas from './components/game/gameCanvas';
import StartScreen from './components/startScreen';
import { connect } from 'react-redux';
import useEffect from 'react';
import './gameclasses/networking';

const mapStateToProps =  state => {
  return {
    gameStarted: state.gameStarted
  }
}

const ConnectApp = ({gameStarted}) => {
  document.body.style.backgroundColor = '#FFECD4'
  const gameCanvas = gameStarted ? <GameCanvas/> : null;

  return (
    <div>
      <StartScreen></StartScreen>
      {gameCanvas}
    </div>
  );
}
const App = connect(mapStateToProps)(ConnectApp);

export default App;
