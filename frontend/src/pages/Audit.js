import React, { useState, useEffect } from 'react';
import { auditAPI } from '../services/api';
import './Audit.css';

function Audit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    accion: '',
    entidad: '',
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await auditAPI.logs(filters);
      setLogs(response.data.data);
    } catch (err) {
      setError('Error al cargar registros de auditoría');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const downloadReport = async (format) => {
    try {
      const response = await auditAPI.report({ formato: format });
      // Descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_auditoria.${format}`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      alert('Error al descargar reporte');
      console.error(err);
    }
  };

  if (loading && logs.length === 0) {
    return <div className="loader"></div>;
  }

  return (
    <div className="audit-container">
      <div className="audit-header">
        <h1>Auditoría del Sistema</h1>
        <div className="export-buttons">
          <button onClick={() => downloadReport('json')} className="btn-secondary">📥 JSON</button>
          <button onClick={() => downloadReport('csv')} className="btn-secondary">📥 CSV</button>
          <button onClick={() => downloadReport('pdf')} className="btn-secondary">📥 PDF</button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="filters-section card">
        <h3>Filtros</h3>
        <div className="filters-grid">
          <div className="form-group">
            <label>Acción:</label>
            <select name="accion" value={filters.accion} onChange={handleFilterChange}>
              <option value="">Todas las acciones</option>
              <option value="crear">Crear</option>
              <option value="actualizar">Actualizar</option>
              <option value="eliminar">Eliminar</option>
              <option value="publicar">Publicar</option>
            </select>
          </div>

          <div className="form-group">
            <label>Entidad:</label>
            <select name="entidad" value={filters.entidad} onChange={handleFilterChange}>
              <option value="">Todas las entidades</option>
              <option value="document">Documento</option>
              <option value="quality_record">Registro de Calidad</option>
              <option value="user">Usuario</option>
            </select>
          </div>
        </div>
      </div>

      <div className="logs-section card">
        <h2>Registros de Auditoría</h2>
        {logs.length === 0 ? (
          <p>No hay registros de auditoría</p>
        ) : (
          <div className="logs-list">
            {logs.map(log => (
              <div key={log.id} className="log-entry">
                <div className="log-header">
                  <span className="log-action">{log.accion.toUpperCase()}</span>
                  <span className="log-entity">{log.entidad}</span>
                  <span className="log-time">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <div className="log-details">
                  <p><strong>Usuario:</strong> {log.usuario.nombre} ({log.usuario.email})</p>
                  <p><strong>Entidad ID:</strong> {log.entidad_id}</p>
                  {log.cambios_nuevos && (
                    <p><strong>Cambios:</strong> {JSON.stringify(log.cambios_nuevos)}</p>
                  )}
                  {log.ip_address && (
                    <p><strong>IP:</strong> {log.ip_address}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Audit;
