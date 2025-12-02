import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, UserContext } from './contexts/AuthContext';
import { useContext } from 'react';

import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Conquistas from './pages/Conquistas';
import Passe from './pages/Passe';
import Perfil from './pages/Perfil';

function PrivateRoute({ children }) {
  const { user } = useContext(UserContext);
  
  return user ? children : <Navigate to="/" />;
}

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <div className="app-container bg-gray-100 min-h-screen text-gray-800 font-sans">
          
          <Header />

          <div className="content-area">
            <Routes>
              <Route path="/" element={<Login />} />

              <Route path="/dashboard" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              
             
              
              <Route path="/conquistas" element={
                <PrivateRoute>
                  <Conquistas />
                </PrivateRoute>
              } />
              
              <Route path="/passe" element={
                <PrivateRoute>
                  <Passe />
                </PrivateRoute>
              } />
              
              <Route path="/perfil" element={
                <PrivateRoute>
                  <Perfil />
                </PrivateRoute>
              } />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;