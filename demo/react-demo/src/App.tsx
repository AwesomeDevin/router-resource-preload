import React from 'react';
import { BrowserRouter } from 'react-router-dom'


import Router from './router';

import logo from './logo.svg';
import './App.css';


function App() {
  return (
    <BrowserRouter>
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <Router />
        <div>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Component A
          </a>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Component B
          </a>
        </div>
      </header>
    </div>
    </BrowserRouter>
  );
}

export default App;
