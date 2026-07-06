import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('admin@laboratorio.com');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/documents');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>📊 Sistema de Gestión de Laboratorio</h1>
        <p className="subtitle">ISO/IEC 17025 - ISO 10720</p>
        
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Tu contraseña"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-login">
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="test-credentials">
          <h4>Credenciales de Prueba:</h4>
          <p><strong>Admin:</strong> admin@laboratorio.com / Admin@123</p>
          <p><strong>Jefe:</strong> jefe@laboratorio.com / Jefe@123</p>
          <p><strong>Supervisor:</strong> supervisor@laboratorio.com / Super@123</p>
          <p><strong>Calidad:</strong> calidad@laboratorio.com / Calidad@123</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
