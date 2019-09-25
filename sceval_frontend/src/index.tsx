import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AppContext } from './controllers/AppContext';
import * as serviceWorker from './serviceWorker';

require('dotenv').config();


// from .env
const projectId = process.env.REACT_APP_PROJECT_ID !== undefined ?
    parseInt(process.env.REACT_APP_PROJECT_ID, 10) :
    1235;
const appId = process.env.REACT_APP_APP_ID !== undefined ? process.env.REACT_APP_APP_ID : 'sceval_app';
AppContext.setProjectId(projectId);
AppContext.setAppId(appId);

ReactDOM.render(
    <BrowserRouter>
        <App />
    </BrowserRouter>, 
    document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
