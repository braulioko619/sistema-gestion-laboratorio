import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Documents from './pages/Documents';
import Quality from './pages/Quality';
import Audit from './pages/Audit';
import './index.css';

function App() {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Verificar conexión con el backend
    const checkHealth = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health');
        if (response.ok) {
          console.log('✓ Backend conectado');
        }
      } catch (error) {
        console.error('✗ No se puede conectar al backend:', error.message);
      }
    };
    checkHealth();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <Router>
      {user ? (
        <>
          <Navbar />
          <div className="container">
            <Routes>
              <Route path="/documents" element={<Documents />} />
              <Route path="/quality" element={<Quality />} />
              <Route path="/audit" element={<Audit />} />
              <Route path="/" element={<Navigate to="/documents" />} />
            </Routes>
          </div>
        </>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
