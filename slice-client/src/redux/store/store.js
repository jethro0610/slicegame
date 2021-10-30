import {combineReducers, createStore, compose} from 'redux';
import { gameStartedReducer } from '../reducers/gameStarted';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const combined = combineReducers({ gameStarted: gameStartedReducer });

const store = createStore(combined, composeEnhancers());
export default store;