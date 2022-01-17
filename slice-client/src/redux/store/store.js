import {combineReducers, createStore, compose} from 'redux';
import { gameStartedReducer } from '../reducers/gameStarted';
import { muteReducer } from '../reducers/muted';
import { searchingReducer } from '../reducers/searching';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const combined = combineReducers({ gameStarted: gameStartedReducer, searching: searchingReducer, muted: muteReducer });

const store = createStore(combined, composeEnhancers());
export default store;