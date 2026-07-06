import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogOut, FiMenu } from 'react-icons/fi';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          📊 Lab Sistema
        </Link>
        
        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <FiMenu />
        </button>

        <div className={`navbar-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <Link to="/documents" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
            📄 Documentos
          </Link>
          <Link to="/quality" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
            ✅ Calidad
          </Link>
          <Link to="/audit" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
            🔍 Auditoría
          </Link>
        </div>

        <div className="navbar-user">
          <span className="user-info">
            👤 {user?.nombre} ({user?.role})
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
