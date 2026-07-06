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
      await qualityAPI.createRecord(formData);
      setFormData({ tipo_indicador: '', valor: '', notas: '' });
      setShowForm(false);
      fetchData();
      alert('Registro de calidad creado exitosamente');
    } catch (err) {
      setError('Error al crear registro');
      console.error(err);
    }
  };

  if (loading && records.length === 0) {
    return <div className="loader"></div>;
  }

  return (
    <div className="quality-container">
      <div className="quality-header">
        <h1>✅ Control de Calidad</h1>
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
                    <td>{record.registrado_por}</td>
                    <td>{new Date(record.created_at).toLocaleDateString()}</td>
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
