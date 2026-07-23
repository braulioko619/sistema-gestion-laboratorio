import React, { useState, useEffect, useCallback } from 'react';
import { internalAuditsAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './InternalAudits.css';

const ESTADOS = {
  planificada: 'Planificada',
  en_curso: 'En curso',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

const TIPOS_HALLAZGO = {
  no_conformidad: 'No conformidad',
  observacion: 'Observación',
  oportunidad_mejora: 'Oportunidad de mejora',
};

const FORM_AUDIT_VACIO = {
  alcance: '',
  criterios: '',
  auditor_id: '',
  auditor_externo: '',
  fecha_planificada: '',
};

const FORM_HALLAZGO_VACIO = {
  tipo: 'observacion',
  clausula: '',
  descripcion: '',
  clasificacion: 'menor',
};

function InternalAudits() {
  const { user } = useAuth();
  const [audits, setAudits] = useState([]);
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showFindingForm, setShowFindingForm] = useState(false);
  const [showCloseForm, setShowCloseForm] = useState(false);

  const [formAudit, setFormAudit] = useState(FORM_AUDIT_VACIO);
  const [formHallazgo, setFormHallazgo] = useState(FORM_HALLAZGO_VACIO);
  const [formCierre, setFormCierre] = useState({ fecha_realizacion: '', conclusiones: '' });

  const puedeGestionar = ['administrador', 'jefe_laboratorio', 'personal_calidad'].includes(
    user?.rol
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = filtroEstado ? { estado: filtroEstado } : {};
      const [auditsRes, summaryRes] = await Promise.all([
        internalAuditsAPI.list(params),
        internalAuditsAPI.summary(),
      ]);
      setAudits(auditsRes.data.data);
      setSummary(summaryRes.data.data);
    } catch (err) {
      setError('Error al cargar auditorías internas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filtroEstado]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    usersAPI
      .list()
      .then((res) => setUsers(res.data.data))
      .catch(() => setUsers([]));
  }, []);

  const limpiarPayload = (obj) => {
    const payload = { ...obj };
    Object.keys(payload).forEach((k) => {
      if (payload[k] === '') delete payload[k];
    });
    return payload;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await internalAuditsAPI.create(limpiarPayload(formAudit));
      alert(res.data.message);
      setFormAudit(FORM_AUDIT_VACIO);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al planificar la auditoría');
      console.error(err);
    }
  };

  const openDetail = async (id) => {
    try {
      const res = await internalAuditsAPI.get(id);
      setSelected(res.data.data);
      setShowFindingForm(false);
      setShowCloseForm(false);
      setFormHallazgo(FORM_HALLAZGO_VACIO);
      setFormCierre({
        fecha_realizacion: res.data.data.fecha_realizacion || '',
        conclusiones: res.data.data.conclusiones || '',
      });
    } catch (err) {
      setError('Error al cargar la auditoría');
      console.error(err);
    }
  };

  const handleCreateFinding = async (e) => {
    e.preventDefault();
    try {
      const res = await internalAuditsAPI.createFinding(
        selected.id,
        limpiarPayload(formHallazgo)
      );
      alert(res.data.message);
      openDetail(selected.id);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al registrar el hallazgo');
      console.error(err);
    }
  };

  const handleClose = async (e) => {
    e.preventDefault();
    try {
      const res = await internalAuditsAPI.update(selected.id, {
        ...limpiarPayload(formCierre),
        estado: 'completada',
      });
      alert(res.data.message);
      setSelected(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al completar la auditoría');
      console.error(err);
    }
  };

  const contarHallazgos = (audit, tipo) =>
    (audit.hallazgos || []).filter((h) => h.tipo === tipo).length;

  if (loading && audits.length === 0) {
    return <div className="loader"></div>;
  }

  return (
    <div className="ia-container">
      <div className="ia-header">
        <h1>Auditorías Internas</h1>
        {puedeGestionar && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? '✕ Cancelar' : '➕ Planificar auditoría'}
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger" onClick={() => setError(null)}>
          {error}
        </div>
      )}

      {summary && (
        <div className="ia-summary">
          <div className="ia-summary-card">
            <span className="ia-summary-value">{summary.total}</span>
            <span>Programa {summary.anio}</span>
          </div>
          <div className="ia-summary-card">
            <span className="ia-summary-value">{summary.por_estado.completada}</span>
            <span>Completadas</span>
          </div>
          <div className="ia-summary-card">
            <span className="ia-summary-value">
              {summary.por_estado.planificada + summary.por_estado.en_curso}
            </span>
            <span>Pendientes</span>
          </div>
          <div className="ia-summary-card ia-summary-danger">
            <span className="ia-summary-value">{summary.hallazgos.no_conformidades}</span>
            <span>NC detectadas</span>
          </div>
          <div className="ia-summary-card">
            <span className="ia-summary-value">{summary.hallazgos.observaciones}</span>
            <span>Observaciones</span>
          </div>
        </div>
      )}

      {showForm && (
        <div className="card ia-form">
          <h2>Planificar Auditoría Interna</h2>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Alcance (áreas, procesos, cláusulas): *</label>
              <textarea
                value={formAudit.alcance}
                onChange={(e) => setFormAudit({ ...formAudit, alcance: e.target.value })}
                rows="2"
                placeholder="Ej: Control de documentos (8.3), registros técnicos (7.5), área de fisicoquímica"
                required
              ></textarea>
            </div>
            <div className="form-group">
              <label>Criterios:</label>
              <textarea
                value={formAudit.criterios}
                onChange={(e) => setFormAudit({ ...formAudit, criterios: e.target.value })}
                rows="2"
                placeholder="Ej: ISO/IEC 17025:2017, Manual de Calidad v3, POE-01"
              ></textarea>
            </div>
            <div className="ia-form-grid">
              <div className="form-group">
                <label>Auditor interno:</label>
                <select
                  value={formAudit.auditor_id}
                  onChange={(e) => setFormAudit({ ...formAudit, auditor_id: e.target.value })}
                >
                  <option value="">— Ninguno —</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Auditor externo:</label>
                <input
                  type="text"
                  value={formAudit.auditor_externo}
                  onChange={(e) =>
                    setFormAudit({ ...formAudit, auditor_externo: e.target.value })
                  }
                  placeholder="Nombre del auditor contratado"
                />
              </div>
              <div className="form-group">
                <label>Fecha planificada: *</label>
                <input
                  type="date"
                  value={formAudit.fecha_planificada}
                  onChange={(e) =>
                    setFormAudit({ ...formAudit, fecha_planificada: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <p className="ia-nota">
              Nota (8.8.1): el auditor debe ser independiente de la actividad auditada.
            </p>
            <button type="submit" className="btn-primary">Planificar</button>
          </form>
        </div>
      )}

      <div className="ia-filters">
        <label>Filtrar por estado: </label>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="">Todas</option>
          {Object.entries(ESTADOS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {audits.length === 0 ? (
        <p>No hay auditorías registradas</p>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Alcance</th>
                <th>Auditor</th>
                <th>Planificada</th>
                <th>Realizada</th>
                <th>Estado</th>
                <th>Hallazgos (NC/Obs/OM)</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((a) => (
                <tr key={a.id} onClick={() => openDetail(a.id)} className="ia-row">
                  <td><strong>{a.codigo}</strong></td>
                  <td className="ia-alcance">{a.alcance}</td>
                  <td>{a.auditor?.nombre || a.auditor_externo || '—'}</td>
                  <td>{a.fecha_planificada}</td>
                  <td>{a.fecha_realizacion || '—'}</td>
                  <td>
                    <span className={`badge badge-ia-${a.estado}`}>{ESTADOS[a.estado]}</span>
                  </td>
                  <td>
                    {contarHallazgos(a, 'no_conformidad')} / {contarHallazgos(a, 'observacion')} /{' '}
                    {contarHallazgos(a, 'oportunidad_mejora')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="ia-modal-overlay" onClick={() => setSelected(null)}>
          <div className="ia-modal card" onClick={(e) => e.stopPropagation()}>
            <div className="ia-modal-header">
              <h2>{selected.codigo}</h2>
              <button className="ia-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            <p><strong>Alcance:</strong> {selected.alcance}</p>
            {selected.criterios && <p><strong>Criterios:</strong> {selected.criterios}</p>}
            <p>
              <strong>Auditor:</strong>{' '}
              {selected.auditor?.nombre || selected.auditor_externo || '—'}
              {' · '}
              <strong>Estado:</strong>{' '}
              <span className={`badge badge-ia-${selected.estado}`}>
                {ESTADOS[selected.estado]}
              </span>
            </p>
            {selected.conclusiones && (
              <p className="ia-conclusiones">
                <strong>Conclusiones:</strong> {selected.conclusiones}
              </p>
            )}

            <div className="ia-section-header">
              <h3>Hallazgos</h3>
              {puedeGestionar && !['completada', 'cancelada'].includes(selected.estado) && (
                <div className="ia-actions">
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setShowFindingForm(!showFindingForm);
                      setShowCloseForm(false);
                    }}
                  >
                    {showFindingForm ? '✕ Cancelar' : '➕ Hallazgo'}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setShowCloseForm(!showCloseForm);
                      setShowFindingForm(false);
                    }}
                  >
                    {showCloseForm ? '✕ Cancelar' : '✔ Completar auditoría'}
                  </button>
                </div>
              )}
            </div>

            {showFindingForm && (
              <form onSubmit={handleCreateFinding} className="ia-finding-form">
                <div className="ia-form-grid">
                  <div className="form-group">
                    <label>Tipo: *</label>
                    <select
                      value={formHallazgo.tipo}
                      onChange={(e) =>
                        setFormHallazgo({ ...formHallazgo, tipo: e.target.value })
                      }
                      required
                    >
                      {Object.entries(TIPOS_HALLAZGO).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Cláusula afectada:</label>
                    <input
                      type="text"
                      value={formHallazgo.clausula}
                      onChange={(e) =>
                        setFormHallazgo({ ...formHallazgo, clausula: e.target.value })
                      }
                      placeholder="Ej: 6.4.3"
                    />
                  </div>
                  {formHallazgo.tipo === 'no_conformidad' && (
                    <div className="form-group">
                      <label>Clasificación de la NC:</label>
                      <select
                        value={formHallazgo.clasificacion}
                        onChange={(e) =>
                          setFormHallazgo({ ...formHallazgo, clasificacion: e.target.value })
                        }
                      >
                        <option value="menor">Menor</option>
                        <option value="mayor">Mayor</option>
                        <option value="critica">Crítica</option>
                      </select>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Descripción: *</label>
                  <textarea
                    value={formHallazgo.descripcion}
                    onChange={(e) =>
                      setFormHallazgo({ ...formHallazgo, descripcion: e.target.value })
                    }
                    rows="3"
                    required
                  ></textarea>
                </div>
                {formHallazgo.tipo === 'no_conformidad' && (
                  <p className="ia-nota">Se generará una NC vinculada automáticamente.</p>
                )}
                <button type="submit" className="btn-primary">Registrar hallazgo</button>
              </form>
            )}

            {showCloseForm && (
              <form onSubmit={handleClose} className="ia-finding-form">
                <div className="form-group">
                  <label>Fecha de realización: *</label>
                  <input
                    type="date"
                    value={formCierre.fecha_realizacion}
                    onChange={(e) =>
                      setFormCierre({ ...formCierre, fecha_realizacion: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Conclusiones: *</label>
                  <textarea
                    value={formCierre.conclusiones}
                    onChange={(e) =>
                      setFormCierre({ ...formCierre, conclusiones: e.target.value })
                    }
                    rows="3"
                    required
                  ></textarea>
                </div>
                <button type="submit" className="btn-primary">Completar auditoría</button>
              </form>
            )}

            {(!selected.hallazgos || selected.hallazgos.length === 0) ? (
              <p>Sin hallazgos registrados</p>
            ) : (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Cláusula</th>
                      <th>Descripción</th>
                      <th>NC vinculada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.hallazgos.map((h) => (
                      <tr key={h.id}>
                        <td>
                          <span className={`badge badge-hallazgo-${h.tipo}`}>
                            {TIPOS_HALLAZGO[h.tipo]}
                          </span>
                        </td>
                        <td>{h.clausula || '—'}</td>
                        <td className="ia-alcance">{h.descripcion}</td>
                        <td>
                          {h.no_conformidad ? (
                            <span>
                              {h.no_conformidad.codigo}{' '}
                              <span className={`badge badge-nc-${h.no_conformidad.estado}`}>
                                {h.no_conformidad.estado}
                              </span>
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default InternalAudits;
