import React, { useState, useEffect } from 'react';
import RouteDeclarations from './routes/RouteDeclarations';
import { Route } from 'react-router-dom';
import { ContextProvider } from './context/Context';
import { AppContext, LoginInfo } from './controllers/AppContext';
import './css/App.css';

const App: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        if (localStorage.getItem('user-login')) {
            setIsLoggedIn(true); // set login to true if user-login exists in LS.
            setIsAuthenticated(true); // set auth to true if user-login exists in LS.
        }
    });

    return (
        <ContextProvider>
            <div className="App">
                <Route>
                    <RouteDeclarations
                        onLogin={() => {
                            setIsLoggedIn(true);
                            setIsAuthenticated(true);
                        }}
                        isLoggedIn={isLoggedIn}
                        isAuthenticated={isAuthenticated}
                        isSavedLoginPresent={true}
                    />
                </Route>
            </div>
        </ContextProvider>
    );
};

export default App;
