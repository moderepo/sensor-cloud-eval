import React, { useState, useEffect } from 'react';
import RouteDeclarations from './routes/RouteDeclarations';
import { ContextProvider } from './context/Context';
import './css/App.css';

const App: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(
        () => {
            if (localStorage.getItem('user-login')) {
                setIsLoggedIn(true); // set login to true if user-login exists in LS.
                setIsAuthenticated(true); // set auth to true if user-login exists in LS.
            }
        },
        [isLoggedIn, isAuthenticated]
    );

    const onLogin = () => {
        setIsLoggedIn(true);
        setIsAuthenticated(true);
    };

    return (
        <ContextProvider>
            <div className="App">
                <RouteDeclarations
                    onLogin={onLogin}
                    isLoggedIn={isLoggedIn}
                    isAuthenticated={isAuthenticated}
                    isSavedLoginPresent={true}
                />
            </div>
        </ContextProvider>
    );
};

export default App;
