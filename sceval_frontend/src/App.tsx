import React from 'react';
import RouteDeclarations from './routes/RouteDeclarations';
import { Route } from 'react-router-dom';
import { ContextProvider } from './context/Context';
import './css/App.css';

const App: React.FC = () => {
  return (
    <ContextProvider>
      <div className="App">
        <Route>
          <RouteDeclarations
            isAdmin={true}
            isLoggedIn={true}
            isSavedLoginPresent={true}
          />
        </Route>
      </div>
    </ContextProvider>
  );
};

export default App;
