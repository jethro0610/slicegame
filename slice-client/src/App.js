import './App.css';
import GameCanvas from './components/game/gameCanvas';
import { connect } from 'react-redux';
import './gameclasses/networking';

const mapStateToProps =  state => {
  return {
    gameStarted: state.gameStarted
  }
}

const ConnectApp = ({gameStarted}) => {
  const gameCanvas = gameStarted ? <GameCanvas/> : null;

  return (
    <div>
      {gameCanvas}
    </div>
  );
}
const App = connect(mapStateToProps)(ConnectApp);

export default App;
