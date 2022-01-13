import './App.css';
import GameCanvas from './components/game/gameCanvas';
import StartScreen from './components/startScreen';
import { connect } from 'react-redux';
import './gameclasses/networking';

const mapStateToProps =  state => {
  return {
    gameStarted: state.gameStarted
  }
}

const ConnectApp = ({gameStarted}) => {
  document.body.style.backgroundColor = '#FFECD4'
  const startScreen = gameStarted ? null : <StartScreen/>;
  const gameCanvas = gameStarted ? <GameCanvas/> : null;

  return (
    <div>
      {startScreen}
      {gameCanvas}
    </div>
  );
}
const App = connect(mapStateToProps)(ConnectApp);

export default App;
