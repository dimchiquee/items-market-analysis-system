import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Callback from './pages/Callback';
import Dashboard from './pages/Dashboard';
import PopularPage from './pages/PopularPage';
import SearchPage from './pages/SearchPage';
import FavoritesPage from './pages/FavoritesPage';
import { useEffect, useState } from 'react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('auth_token'));

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    setIsAuthenticated(!!token);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/callback" element={<Callback setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} />
        <Route path="/popular" element={<PopularPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/favorites" element={isAuthenticated ? <FavoritesPage /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;