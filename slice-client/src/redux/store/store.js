import {combineReducers, createStore, applyMiddleware, compose} from 'redux';
import { gameConnectionReducer } from '../reducers/gameConnection';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const combined = combineReducers({ gameConnection: gameConnectionReducer });

const store = createStore(combined, composeEnhancers());
export default store;