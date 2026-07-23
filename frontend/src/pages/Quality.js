import React, { useState, useEffect } from 'react';
import { qualityAPI } from '../services/api';
import './Quality.css';

function Quality() {
  const [records, setRecords] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    tipo_indicador: '',
    valor: '',
    notas: '',
  });
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recordsRes, indicatorsRes] = await Promise.all([
        qualityAPI.records({}),
        qualityAPI.indicators(),
      ]);
      setRecords(recordsRes.data.data);
      setIndicators(indicatorsRes.data.data);
    } catch (err) {
      setError('Error al cargar registros de calidad');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateRecord = async (e) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => payload.append(key, value));
      files.forEach(file => payload.append('archivos', file));
      await qualityAPI.createRecord(payload);
      setFormData({ tipo_indicador: '', valor: '', notas: '' });
      setFiles([]);
      setShowForm(false);
      fetchData();
      alert('Registro de calidad creado exitosamente');
    } catch (err) {
      setError('Error al crear registro');
      console.error(err);
    }
  };

  const handleDownloadAttachment = async (recordId, attachment) => {
    try {
      const response = await qualityAPI.downloadAttachment(recordId, attachment.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.nombre_original;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(`No se pudo descargar ${attachment.nombre_original}`);
    }
  };

  if (loading && records.length === 0) {
    return <div className="loader"></div>;
  }

  return (
    <div className="quality-container">
      <div className="quality-header">
        <h1>Control de Calidad</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? '✕ Cancelar' : '➕ Nuevo Registro'}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {showForm && (
        <div className="card quality-form">
          <h2>Registrar Indicador de Calidad</h2>
          <form onSubmit={handleCreateRecord}>
            <div className="form-group">
              <label>Indicador:</label>
              <select
                name="tipo_indicador"
                value={formData.tipo_indicador}
                onChange={handleInputChange}
                required
              >
                <option value="">Selecciona un indicador</option>
                {indicators.map(ind => (
                  <option key={ind.id} value={ind.id}>
                    {ind.nombre} ({ind.unidad})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Valor:</label>
              <input
                type="number"
                step="0.01"
                name="valor"
                value={formData.valor}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Notas:</label>
              <textarea
                name="notas"
                value={formData.notas}
                onChange={handleInputChange}
                rows="3"
              ></textarea>
            </div>

            <div className="form-group">
              <label>Archivos de respaldo (opcional):</label>
              <input
                type="file"
                multiple
                accept=".pdf,.csv,.txt,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
              />
              <small>Hasta 5 archivos de 10 MB cada uno: PDF, imagen, CSV, TXT, Word o Excel.</small>
              {files.length > 0 && <small>{files.length} archivo(s) seleccionado(s).</small>}
            </div>

            <button type="submit" className="btn-primary">Registrar</button>
          </form>
        </div>
      )}

      <div className="indicators-grid">
        <h2>Indicadores Disponibles</h2>
        <div className="indicators-list">
          {indicators.map(ind => (
            <div key={ind.id} className="indicator-card">
              <h3>{ind.nombre}</h3>
              <p>Unidad: <strong>{ind.unidad}</strong></p>
              <p>Rango: {ind.limites.minimo} - {ind.limites.maximo}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="records-section">
        <h2>Registros Recientes</h2>
        {records.length === 0 ? (
          <p>No hay registros de calidad</p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Indicador</th>
                  <th>Valor</th>
                  <th>Estado</th>
                  <th>Registrado por</th>
                  <th>Fecha</th>
                  <th>Archivos</th>
                </tr>
              </thead>
              <tbody>
                {records.map(record => (
                  <tr key={record.id}>
                    <td>{record.tipo_indicador}</td>
                    <td>{record.valor}</td>
                    <td>
                      <span className={`badge badge-${record.estado_cumplimiento}`}>
                        {record.estado_cumplimiento}
                      </span>
                    </td>
                    <td>{record.registrador?.nombre || record.registrado_por}</td>
                    <td>{new Date(record.createdAt).toLocaleDateString()}</td>
                    <td>
                      {record.adjuntos?.length ? record.adjuntos.map(attachment => (
                        <button
                          key={attachment.id}
                          type="button"
                          className="attachment-link"
                          onClick={() => handleDownloadAttachment(record.id, attachment)}
                        >
                          {attachment.nombre_original}
                        </button>
                      )) : 'Sin adjuntos'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Quality;
