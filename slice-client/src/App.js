import './App.css';
import GameCanvas from './components/game/gameCanvas';

import store from './redux/store/store';
import { connect } from 'react-redux';

const mapStateToProps =  state => {
  return {
    hasConnection: state.gameConnection.hasConnection
  }
}

const ConnectApp = ({hasConnection}) => {
  const gameCanvas = hasConnection ? <GameCanvas/> : null;

  return (
    <div>
      {gameCanvas}
    </div>
  );
}
const App = connect(mapStateToProps)(ConnectApp);

export default App;
