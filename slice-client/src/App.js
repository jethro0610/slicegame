import './App.css';
import GameCanvas from './components/game/gameCanvas';
import StartScreen from './components/startScreen';
import SearchScreen from './components/searchScreen';
import { connect } from 'react-redux';
import './gameclasses/networking';

const mapStateToProps =  state => {
  return {
    gameStarted: state.gameStarted,
    searching: state.searching
  }
}

const ConnectApp = ({gameStarted, searching}) => {
  document.body.style.backgroundColor = '#FFECD4'

  const startScreen = !gameStarted && !searching ? <StartScreen/> : null;
  const searchScreen = !gameStarted && searching ? <SearchScreen/> : null;
  const gameCanvas = gameStarted ? <GameCanvas/> : null;
  
  return (
    <div>
      { startScreen }
      { searchScreen }
      { gameCanvas }
    </div>
  );
}
const App = connect(mapStateToProps)(ConnectApp);

export default App;
