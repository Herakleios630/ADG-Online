import './styles/p0.css';
import { createInitialAppState, reduceAppState } from './state/p0-state.js';
import { renderApp } from './ui/p0-app.js';

const app = document.querySelector('#app');
let currentState = createInitialAppState();

function dispatch(action) {
  currentState = reduceAppState(currentState, action);
  renderApp(app, currentState, dispatch);
}

renderApp(app, currentState, dispatch);
