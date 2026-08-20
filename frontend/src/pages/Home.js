import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import {
  FiFileText, FiCheckCircle, FiAlertTriangle, FiUsers, FiClipboard, FiSearch,
  FiActivity, FiTool, FiArrowRight, FiInfo, FiX, FiClock, FiTrendingUp,
  FiBriefcase, FiLayers,
} from 'react-icons/fi';
import lenorMark from '../assets/lenor-mark.svg';
import './Home.css';

const lenorLogo = `${process.env.PUBLIC_URL}/Lenor_LogotipoVertical_ColorPositivo.png`;

// Cada área del sistema, con el detalle que se muestra en su cuadro de diálogo.
const AREAS = [
  {
    to: '/documents',
    label: 'Documentos',
    description: 'Gestión documental del sistema de calidad',
    icon: FiFileText,
    accent: '#0f5f57',
    chips: ['Versiones', 'Publicación', 'Autorizaciones'],
    highlights: [
      'Creación de documentos con control de versiones',
      'Publicación y control de vigencia',
      'Autorizaciones de acceso por usuario',
      'Descarga de los adjuntos asociados',
    ],
  },
  {
    to: '/quality',
    label: 'Calidad',
    description: 'Indicadores y registros de calidad',
    icon: FiCheckCircle,
    accent: '#00857d',
    chips: ['Indicadores', 'Registros'],
    highlights: [
      'Registro de indicadores de calidad',
      'Indicadores disponibles con unidad y límites',
      'Registros recientes con sus adjuntos',
    ],
  },
  {
    to: '/nonconformities',
    label: 'No Conformidades',
    description: 'Registro y tratamiento de no conformidades',
    icon: FiAlertTriangle,
    accent: '#0d7a6d',
    chips: ['Registro', 'Tratamiento', 'Verificación'],
    highlights: [
      'Registro de no conformidades con código correlativo',
      'Seguimiento del tratamiento y las acciones',
      'Verificación de la eficacia de las acciones',
    ],
  },
  {
    to: '/personnel',
    label: 'Personal',
    description: 'Competencias y autorizaciones del personal',
    icon: FiUsers,
    accent: '#12a396',
    chips: ['Competencias', 'Alertas'],
    highlights: [
      'Fichas de personal y sus competencias',
      'Alertas de competencias por vencer',
      'Autorizaciones vigentes por persona',
    ],
  },
  {
    to: '/internal-audits',
    label: 'Auditorías Internas',
    description: 'Planificación y hallazgos de auditoría',
    icon: FiClipboard,
    accent: '#0b3b37',
    chips: ['Planificación', 'Checklist', 'Hallazgos'],
    highlights: [
      'Planificación de auditorías por norma',
      'Plantillas de checklist reutilizables',
      'Hallazgos y su seguimiento hasta el cierre',
    ],
  },
  {
    to: '/audit',
    label: 'Auditoría del Sistema',
    description: 'Trazabilidad de acciones del sistema',
    icon: FiSearch,
    accent: '#06695f',
    chips: ['Trazabilidad', 'Filtros'],
    highlights: [
      'Registro de todas las acciones del sistema',
      'Filtros por usuario, entidad y fecha',
      'Trazabilidad completa para auditorías externas',
    ],
  },
  {
    to: '/calibraciones',
    label: 'Calibraciones',
    description: 'Clientes, instrumentos, equipos patrones, órdenes de trabajo y certificados',
    icon: FiActivity,
    accent: '#19b3a6',
    chips: ['Órdenes de trabajo', 'Certificados', 'Cotizaciones'],
    highlights: [
      'Dashboard del laboratorio y embudo de procesos',
      'Clientes, instrumentos y recepción de muestras',
      'Órdenes de trabajo, certificados y cotizaciones',
      'Calendarización de servicios y equipos patrones',
    ],
  },
  {
    to: '/control-metrologico',
    label: 'Control Metrológico',
    description: 'Hoja de vida, deriva, bitácora y documentación de los equipos de la sede Maipú',
    icon: FiTool,
    accent: '#2c9c7f',
    chips: ['Hoja de vida', 'Deriva', 'Bitácora'],
    highlights: [
      'Hoja de vida e historial de cada equipo',
      'Calibraciones, deriva y alertas de estabilidad',
      'Bitácora, imágenes y documentación asociada',
    ],
  },
];

function saludoSegunHora() {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

// El backend entrega el rol como texto en el login y como objeto en el perfil SSO.
function nombreDelRol(user) {
  if (!user) return null;
  if (typeof user.rol === 'string') return user.rol;
  return user.rol?.nombre || null;
}

function prefiereMenosMovimiento() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Número que sube desde 0 hasta su valor final al aparecer.
function CountUp({ value, duration = 900 }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    if (prefiereMenosMovimiento()) {
      setShown(target);
      return undefined;
    }
    let raf;
    const inicio = performance.now();
    const tick = (ahora) => {
      const p = Math.min((ahora - inicio) / duration, 1);
      setShown(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{shown.toLocaleString('es-CL')}</>;
}

// Cuadro de diálogo con el detalle del área seleccionada.
function AreaDialog({ area, onClose }) {
  const navigate = useNavigate();
  const closeRef = useRef(null);
  const previoRef = useRef(null);

  useEffect(() => {
    previoRef.current = document.activeElement;
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (closeRef.current) closeRef.current.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflowPrevio;
      if (previoRef.current && previoRef.current.focus) previoRef.current.focus();
    };
  }, [onClose]);

  const Icon = area.icon;

  return (
    <div className="home-dialog-overlay" onMouseDown={onClose}>
      <div
        className="home-dialog"
        style={{ '--tile-accent': area.accent }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="home-dialog-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="home-dialog-header">
          <img src={lenorMark} alt="" aria-hidden="true" className="home-dialog-watermark" />
          <button ref={closeRef} className="home-dialog-close" onClick={onClose} aria-label="Cerrar">
            <FiX />
          </button>
          <span className="home-dialog-icon"><Icon /></span>
          <div className="home-dialog-titles">
            <h2 id="home-dialog-title">{area.label}</h2>
            <p>{area.description}</p>
          </div>
        </div>

        <div className="home-dialog-body">
          <div className="home-dialog-chips">
            {area.chips.map((chip) => (
              <span key={chip} className="home-chip home-chip-lg">{chip}</span>
            ))}
          </div>

          <h3 className="home-dialog-subtitle">
            <FiLayers /> Qué encontrarás aquí
          </h3>
          <ul className="home-dialog-list">
            {area.highlights.map((item, i) => (
              <li key={item} style={{ '--i': i }}>
                <FiCheckCircle />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="home-dialog-footer">
          <img src={lenorLogo} alt="Lenor" className="home-dialog-logo" />
          <div className="home-dialog-actions">
            <button className="home-btn-ghost" onClick={onClose}>Cerrar</button>
            <button
              className="home-btn-primary"
              onClick={() => { onClose(); navigate(area.to); }}
            >
              Entrar al módulo <FiArrowRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Home() {
  const { user } = useAuth();
  const [filtro, setFiltro] = useState('');
  const [areaActiva, setAreaActiva] = useState(null);
  const [resumen, setResumen] = useState(null);
  const rol = nombreDelRol(user);

  useEffect(() => {
    let vigente = true;
    dashboardAPI.calibraciones()
      .then((res) => { if (vigente) setResumen(res.data.data); })
      .catch(() => { /* el resumen es opcional: si falla, la portada igual funciona */ });
    return () => { vigente = false; };
  }, []);

  const cerrarDialogo = useCallback(() => setAreaActiva(null), []);

  const areasFiltradas = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return AREAS;
    return AREAS.filter((a) => (
      `${a.label} ${a.description} ${a.chips.join(' ')}`.toLowerCase().includes(q)
    ));
  }, [filtro]);

  const stats = resumen ? [
    { key: 'ot', icon: FiClipboard, valor: resumen.ordenes_trabajo?.total || 0, label: 'Órdenes de trabajo' },
    { key: 'vencidas', icon: FiClock, valor: resumen.ordenes_trabajo?.vencidas || 0, label: 'OT vencidas', alerta: (resumen.ordenes_trabajo?.vencidas || 0) > 0 },
    { key: 'cotiz', icon: FiTrendingUp, valor: resumen.cotizaciones?.total || 0, label: 'Cotizaciones' },
    { key: 'clientes', icon: FiBriefcase, valor: resumen.clientes?.activos || 0, label: 'Clientes activos' },
  ] : [];

  return (
    <div className="home-page">
      <section className="home-hero">
        <span className="home-hero-blob home-hero-blob-1" aria-hidden="true" />
        <span className="home-hero-blob home-hero-blob-2" aria-hidden="true" />
        <span className="home-hero-shine" aria-hidden="true" />
        <img src={lenorMark} alt="" aria-hidden="true" className="home-hero-mark" />

        <div className="home-hero-content">
          <span className="home-hero-eyebrow">Sistema de Gestión de Laboratorio</span>
          <h1>
            {saludoSegunHora()}{user?.nombre ? ',' : ''}
            {user?.nombre ? <span className="home-hero-name"> {user.nombre}</span> : null}
          </h1>
          <p className="home-hero-sub">
            Selecciona un área para comenzar a trabajar.
            {rol ? <span className="home-hero-role">{rol}</span> : null}
          </p>

          {stats.length > 0 && (
            <div className="home-stats">
              {stats.map(({ key, icon: StatIcon, valor, label, alerta }, i) => (
                <div
                  key={key}
                  className={`home-stat${alerta ? ' home-stat-alerta' : ''}`}
                  style={{ '--i': i }}
                >
                  <span className="home-stat-icon"><StatIcon /></span>
                  <span className="home-stat-value"><CountUp value={valor} /></span>
                  <span className="home-stat-label">{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="home-hero-logo">
          <img src={lenorLogo} alt="Lenor" />
        </div>
      </section>

      <div className="home-toolbar">
        <div className="home-search">
          <FiSearch />
          <input
            type="text"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar un área del sistema..."
            aria-label="Buscar un área del sistema"
          />
          {filtro && (
            <button className="home-search-clear" onClick={() => setFiltro('')} aria-label="Limpiar búsqueda">
              <FiX />
            </button>
          )}
        </div>
        <span className="home-toolbar-count">
          {areasFiltradas.length} de {AREAS.length} áreas
        </span>
      </div>

      <div className="home-grid">
        {areasFiltradas.map((area, i) => {
          const { to, label, description, icon: Icon, chips } = area;
          return (
            <article
              key={to}
              className="home-tile"
              style={{ '--i': i, '--tile-accent': area.accent }}
            >
              <button
                className="home-tile-info"
                onClick={() => setAreaActiva(area)}
                aria-label={`Ver detalle de ${label}`}
                title={`Ver detalle de ${label}`}
              >
                <FiInfo />
              </button>

              <Link to={to} className="home-tile-link">
                <span className="home-tile-icon"><Icon /></span>
                <span className="home-tile-label">{label}</span>
                <span className="home-tile-description">{description}</span>
                <span className="home-tile-chips">
                  {chips.map((chip) => <span key={chip} className="home-chip">{chip}</span>)}
                </span>
                <span className="home-tile-cta">
                  Abrir <FiArrowRight />
                </span>
              </Link>
            </article>
          );
        })}
      </div>

      {areasFiltradas.length === 0 && (
        <div className="home-empty">
          <FiSearch />
          <p>No hay áreas que coincidan con «{filtro}».</p>
          <button className="home-btn-ghost" onClick={() => setFiltro('')}>Ver todas las áreas</button>
        </div>
      )}

      {areaActiva && <AreaDialog area={areaActiva} onClose={cerrarDialogo} />}
    </div>
  );
}

export default Home;
