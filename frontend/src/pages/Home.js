import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiFileText, FiCheckCircle, FiAlertTriangle, FiUsers, FiClipboard, FiSearch, FiActivity, FiTool } from 'react-icons/fi';
import './Home.css';

const AREAS = [
  { to: '/documents', label: 'Documentos', description: 'Gestión documental del sistema de calidad', icon: FiFileText },
  { to: '/quality', label: 'Calidad', description: 'Indicadores y registros de calidad', icon: FiCheckCircle },
  { to: '/nonconformities', label: 'No Conformidades', description: 'Registro y tratamiento de no conformidades', icon: FiAlertTriangle },
  { to: '/personnel', label: 'Personal', description: 'Competencias y autorizaciones del personal', icon: FiUsers },
  { to: '/internal-audits', label: 'Auditorías Internas', description: 'Planificación y hallazgos de auditoría', icon: FiClipboard },
  { to: '/audit', label: 'Auditoría del Sistema', description: 'Trazabilidad de acciones del sistema', icon: FiSearch },
  { to: '/calibraciones', label: 'Calibraciones', description: 'Clientes, instrumentos, equipos patrones, órdenes de trabajo y certificados', icon: FiActivity },
  { to: '/control-metrologico', label: 'Control Metrológico', description: 'Hoja de vida, deriva, bitácora y documentación de los equipos de la sede Maipú', icon: FiTool },
];

function Home() {
  const { user } = useAuth();

  return (
    <div className="home-container">
      <div className="home-intro">
        <h1>Bienvenido{user?.nombre ? `, ${user.nombre}` : ''}</h1>
        <p>Selecciona un área para comenzar a trabajar.</p>
      </div>

      <div className="home-grid">
        {AREAS.map(({ to, label, description, icon: Icon }) => (
          <Link to={to} key={to} className="home-tile">
            <span className="home-tile-icon">
              <Icon />
            </span>
            <span className="home-tile-label">{label}</span>
            <span className="home-tile-description">{description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Home;
