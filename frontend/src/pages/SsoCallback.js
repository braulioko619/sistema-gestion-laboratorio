import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function SsoCallback() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');

    if (!token || !refreshToken) {
      setError('No se recibió un token válido de Microsoft');
      return;
    }

    loginWithToken(token, refreshToken)
      .then(() => navigate('/documents'))
      .catch(() => setError('No se pudo completar el login con Microsoft'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="alert alert-danger">{error}</div>
          <a href="/login">Volver al login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="loader"></div>
        <p>Completando el inicio de sesión con Microsoft...</p>
      </div>
    </div>
  );
}

export default SsoCallback;
