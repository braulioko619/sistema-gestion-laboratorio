import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogOut } from 'react-icons/fi';
import lenorMark from '../assets/lenor-mark.svg';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <img src={lenorMark} alt="Lenor" className="brand-mark" />
          <span className="brand-text">
            LENOR
            <small>Sistema de Gestión de Laboratorio</small>
          </span>
        </Link>

        <div className="navbar-user">
          <span className="user-info">
            {user?.nombre} <span className="user-role">({user?.role})</span>
          </span>
          <button onClick={handleLogout} className="btn-logout">
            <FiLogOut /> Salir
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
