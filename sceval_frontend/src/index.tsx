import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AppContext } from './controllers/AppContext';
require('dotenv').config();

import * as serviceWorker from './serviceWorker';

// from .env
const projectId = process.env.REACT_APP_PROJECT_ID !== undefined ?
    parseInt(process.env.REACT_APP_PROJECT_ID, 10) :
    1235;
AppContext.setProjectId(projectId);
AppContext.setAppId('sceval_app');

ReactDOM.render(
    <BrowserRouter>
        <App />
    </BrowserRouter>, 
    document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
