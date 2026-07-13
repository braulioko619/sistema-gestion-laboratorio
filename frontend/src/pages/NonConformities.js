import React, { useState, useEffect, useCallback } from 'react';
import { nonConformitiesAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './NonConformities.css';

const ESTADOS = {
  abierta: 'Abierta',
  en_tratamiento: 'En tratamiento',
  en_verificacion: 'En verificación',
  cerrada: 'Cerrada',
};

const FUENTES = {
  registro_calidad: 'Registro de calidad',
  auditoria_interna: 'Auditoría interna',
  queja_cliente: 'Queja de cliente',
  proveedor: 'Proveedor',
  equipo: 'Equipo (calibración/mantenimiento)',
  otro: 'Otro',
};

const DECISIONES = {
  continuar: 'Continuar el trabajo',
  suspender: 'Suspender el trabajo',
  repetir: 'Repetir el trabajo',
  notificar_cliente: 'Notificar al cliente',
};

function NonConformities() {
  const { user } = useAuth();
  const [ncs, setNcs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);

  const [formData, setFormData] = useState({
    descripcion: '',
    fuente: 'otro',
    clasificacion: 'menor',
    correccion_inmediata: '',
    decision_trabajo: '',
  });

  const [treatData, setTreatData] = useState({});
  const [verifyData, setVerifyData] = useState({ verificacion_eficacia: '', eficaz: '' });

  const puedeVerificar = ['administrador', 'jefe_laboratorio', 'personal_calidad'].includes(
    user?.role
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = filtroEstado ? { estado: filtroEstado } : {};
      const [ncsRes, summaryRes] = await Promise.all([
        nonConformitiesAPI.list(params),
        nonConformitiesAPI.summary(),
      ]);
      setNcs(ncsRes.data.data);
      setSummary(summaryRes.data.data);
    } catch (err) {
      setError('Error al cargar no conformidades');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filtroEstado]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // La lista de usuarios solo está disponible para algunos roles
    usersAPI
      .list()
      .then((res) => setUsers(res.data.data))
      .catch(() => setUsers([]));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.decision_trabajo) delete payload.decision_trabajo;
      const res = await nonConformitiesAPI.create(payload);
      alert(res.data.message);
      setFormData({
        descripcion: '',
        fuente: 'otro',
        clasificacion: 'menor',
        correccion_inmediata: '',
        decision_trabajo: '',
      });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError('Error al registrar la no conformidad');
      console.error(err);
    }
  };

  const openDetail = (nc) => {
    setSelected(nc);
    setTreatData({
      analisis_causa_raiz: nc.analisis_causa_raiz || '',
      accion_correctiva: nc.accion_correctiva || '',
      responsable_id: nc.responsable_id || '',
      fecha_compromiso: nc.fecha_compromiso || '',
      correccion_inmediata: nc.correccion_inmediata || '',
      decision_trabajo: nc.decision_trabajo || '',
    });
    setVerifyData({ verificacion_eficacia: '', eficaz: '' });
  };

  const handleTreat = async (e, enviarAVerificacion = false) => {
    e.preventDefault();
    try {
      const payload = { ...treatData };
      Object.keys(payload).forEach((k) => {
        if (payload[k] === '') delete payload[k];
      });
      if (enviarAVerificacion) payload.estado = 'en_verificacion';
      const res = await nonConformitiesAPI.update(selected.id, payload);
      alert(res.data.message);
      setSelected(null);
      fetchData();
    } catch (err) {
      setError('Error al actualizar la no conformidad');
      console.error(err);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const res = await nonConformitiesAPI.verify(selected.id, {
        verificacion_eficacia: verifyData.verificacion_eficacia,
        eficaz: verifyData.eficaz === 'true',
      });
      alert(res.data.message);
      setSelected(null);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Error al verificar la no conformidad';
      setError(msg);
      console.error(err);
    }
  };

  if (loading && ncs.length === 0) {
    return <div className="loader"></div>;
  }

  return (
    <div className="nc-container">
      <div className="nc-header">
        <h1>⚠️ No Conformidades</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? '✕ Cancelar' : '➕ Nueva NC'}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" onClick={() => setError(null)}>
          {error}
        </div>
      )}

      {summary && (
        <div className="nc-summary">
          <div className="nc-summary-card">
            <span className="nc-summary-value">{summary.por_estado.abierta}</span>
            <span>Abiertas</span>
          </div>
          <div className="nc-summary-card">
            <span className="nc-summary-value">{summary.por_estado.en_tratamiento}</span>
            <span>En tratamiento</span>
          </div>
          <div className="nc-summary-card">
            <span className="nc-summary-value">{summary.por_estado.en_verificacion}</span>
            <span>En verificación</span>
          </div>
          <div className="nc-summary-card nc-summary-danger">
            <span className="nc-summary-value">{summary.vencidas}</span>
            <span>Vencidas</span>
          </div>
          <div className="nc-summary-card">
            <span className="nc-summary-value">
              {summary.tiempo_medio_cierre_dias ?? '—'}
            </span>
            <span>Días prom. cierre</span>
          </div>
        </div>
      )}

      {showForm && (
        <div className="card nc-form">
          <h2>Registrar No Conformidad</h2>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Descripción del hallazgo:</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows="3"
                required
              ></textarea>
            </div>

            <div className="form-group">
              <label>Fuente:</label>
              <select
                value={formData.fuente}
                onChange={(e) => setFormData({ ...formData, fuente: e.target.value })}
              >
                {Object.entries(FUENTES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Clasificación:</label>
              <select
                value={formData.clasificacion}
                onChange={(e) => setFormData({ ...formData, clasificacion: e.target.value })}
              >
                <option value="menor">Menor</option>
                <option value="mayor">Mayor</option>
                <option value="critica">Crítica</option>
              </select>
            </div>

            <div className="form-group">
              <label>Corrección inmediata (si se tomó):</label>
              <textarea
                value={formData.correccion_inmediata}
                onChange={(e) =>
                  setFormData({ ...formData, correccion_inmediata: e.target.value })
                }
                rows="2"
              ></textarea>
            </div>

            <div className="form-group">
              <label>Decisión sobre el trabajo afectado:</label>
              <select
                value={formData.decision_trabajo}
                onChange={(e) => setFormData({ ...formData, decision_trabajo: e.target.value })}
              >
                <option value="">— Sin definir —</option>
                {Object.entries(DECISIONES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn-primary">Registrar</button>
          </form>
        </div>
      )}

      <div className="nc-filters">
        <label>Filtrar por estado: </label>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="">Todas</option>
          {Object.entries(ESTADOS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {ncs.length === 0 ? (
        <p>No hay no conformidades registradas</p>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th>Fuente</th>
                <th>Clasificación</th>
                <th>Estado</th>
                <th>Responsable</th>
                <th>Compromiso</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {ncs.map((nc) => (
                <tr key={nc.id} onClick={() => openDetail(nc)} className="nc-row">
                  <td><strong>{nc.codigo}</strong></td>
                  <td className="nc-desc">{nc.descripcion}</td>
                  <td>{FUENTES[nc.fuente]}</td>
                  <td>
                    <span className={`badge badge-clasif-${nc.clasificacion}`}>
                      {nc.clasificacion}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-nc-${nc.estado}`}>
                      {ESTADOS[nc.estado]}
                    </span>
                  </td>
                  <td>{nc.responsable?.nombre || '—'}</td>
                  <td>{nc.fecha_compromiso || '—'}</td>
                  <td>{new Date(nc.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="nc-modal-overlay" onClick={() => setSelected(null)}>
          <div className="nc-modal card" onClick={(e) => e.stopPropagation()}>
            <div className="nc-modal-header">
              <h2>{selected.codigo}</h2>
              <button className="nc-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            <p><strong>Descripción:</strong> {selected.descripcion}</p>
            <p>
              <strong>Estado:</strong>{' '}
              <span className={`badge badge-nc-${selected.estado}`}>
                {ESTADOS[selected.estado]}
              </span>
              {' · '}
              <strong>Fuente:</strong> {FUENTES[selected.fuente]}
            </p>
            {selected.registro_origen && (
              <p className="nc-origen">
                Origen: indicador <strong>{selected.registro_origen.tipo_indicador}</strong>{' '}
                = {selected.registro_origen.valor} {selected.registro_origen.unidad}
              </p>
            )}

            {selected.estado !== 'cerrada' && (
              <form onSubmit={(e) => handleTreat(e, false)}>
                <h3>Tratamiento (7.10 / 8.7)</h3>

                <div className="form-group">
                  <label>Corrección inmediata:</label>
                  <textarea
                    value={treatData.correccion_inmediata}
                    onChange={(e) =>
                      setTreatData({ ...treatData, correccion_inmediata: e.target.value })
                    }
                    rows="2"
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Decisión sobre el trabajo:</label>
                  <select
                    value={treatData.decision_trabajo}
                    onChange={(e) =>
                      setTreatData({ ...treatData, decision_trabajo: e.target.value })
                    }
                  >
                    <option value="">— Sin definir —</option>
                    {Object.entries(DECISIONES).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Análisis de causa raíz:</label>
                  <textarea
                    value={treatData.analisis_causa_raiz}
                    onChange={(e) =>
                      setTreatData({ ...treatData, analisis_causa_raiz: e.target.value })
                    }
                    rows="3"
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Acción correctiva:</label>
                  <textarea
                    value={treatData.accion_correctiva}
                    onChange={(e) =>
                      setTreatData({ ...treatData, accion_correctiva: e.target.value })
                    }
                    rows="3"
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Responsable:</label>
                  <select
                    value={treatData.responsable_id}
                    onChange={(e) =>
                      setTreatData({ ...treatData, responsable_id: e.target.value })
                    }
                  >
                    <option value="">— Sin asignar —</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Fecha compromiso:</label>
                  <input
                    type="date"
                    value={treatData.fecha_compromiso}
                    onChange={(e) =>
                      setTreatData({ ...treatData, fecha_compromiso: e.target.value })
                    }
                  />
                </div>

                <div className="nc-actions">
                  <button type="submit" className="btn-primary">Guardar tratamiento</button>
                  {selected.estado === 'en_tratamiento' && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={(e) => handleTreat(e, true)}
                    >
                      Enviar a verificación
                    </button>
                  )}
                </div>
              </form>
            )}

            {selected.estado !== 'cerrada' && puedeVerificar && (
              <form onSubmit={handleVerify} className="nc-verify">
                <h3>Verificación de eficacia (8.7.1e)</h3>
                <div className="form-group">
                  <label>Evidencia de la verificación:</label>
                  <textarea
                    value={verifyData.verificacion_eficacia}
                    onChange={(e) =>
                      setVerifyData({ ...verifyData, verificacion_eficacia: e.target.value })
                    }
                    rows="2"
                    required
                  ></textarea>
                </div>
                <div className="form-group">
                  <label>¿La acción fue eficaz?</label>
                  <select
                    value={verifyData.eficaz}
                    onChange={(e) => setVerifyData({ ...verifyData, eficaz: e.target.value })}
                    required
                  >
                    <option value="">— Selecciona —</option>
                    <option value="true">Sí — cerrar NC</option>
                    <option value="false">No — volver a tratamiento</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary">Registrar verificación</button>
              </form>
            )}

            {selected.estado === 'cerrada' && (
              <div className="nc-closed-info">
                <h3>Cierre</h3>
                <p><strong>Verificación:</strong> {selected.verificacion_eficacia}</p>
                <p>
                  <strong>Verificado por:</strong> {selected.verificador?.nombre || '—'} el{' '}
                  {selected.fecha_verificacion
                    ? new Date(selected.fecha_verificacion).toLocaleDateString()
                    : '—'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NonConformities;
