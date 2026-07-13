import React, { useState, useEffect } from 'react';
import { personnelAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Personnel.css';

const TIPOS_REGISTRO = {
  formacion_academica: 'Formación académica',
  capacitacion: 'Capacitación',
  experiencia: 'Experiencia',
  evaluacion_competencia: 'Evaluación de competencia',
};

const FORM_REGISTRO_VACIO = {
  tipo: 'capacitacion',
  descripcion: '',
  institucion: '',
  fecha: '',
  fecha_vencimiento: '',
  referencia_certificado: '',
  resultado: '',
  observaciones: '',
};

const FORM_AUTH_VACIO = {
  actividad: '',
  alcance: '',
  fecha_autorizacion: '',
  fecha_vencimiento: '',
  observaciones: '',
};

function Personnel() {
  const { user } = useAuth();
  const [personal, setPersonal] = useState([]);
  const [alertas, setAlertas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [formRegistro, setFormRegistro] = useState(FORM_REGISTRO_VACIO);
  const [formAuth, setFormAuth] = useState(FORM_AUTH_VACIO);

  const puedeEditar = ['administrador', 'jefe_laboratorio'].includes(user?.role);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [personalRes, alertasRes] = await Promise.all([
        personnelAPI.list(),
        personnelAPI.alerts(),
      ]);
      setPersonal(personalRes.data.data);
      setAlertas(alertasRes.data.data);
    } catch (err) {
      const msg =
        err.response?.status === 403
          ? 'No tienes permisos para ver los expedientes del personal'
          : 'Error al cargar el personal';
      setError(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDetail = async (userId) => {
    try {
      const res = await personnelAPI.get(userId);
      setSelected(res.data.data);
      setShowRecordForm(false);
      setShowAuthForm(false);
      setFormRegistro(FORM_REGISTRO_VACIO);
      setFormAuth(FORM_AUTH_VACIO);
    } catch (err) {
      setError('Error al cargar el expediente');
      console.error(err);
    }
  };

  const limpiarPayload = (obj) => {
    const payload = { ...obj };
    Object.keys(payload).forEach((k) => {
      if (payload[k] === '') delete payload[k];
    });
    return payload;
  };

  const handleCreateRegistro = async (e) => {
    e.preventDefault();
    try {
      const res = await personnelAPI.createRecord(
        selected.usuario.id,
        limpiarPayload(formRegistro)
      );
      alert(res.data.message);
      openDetail(selected.usuario.id);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al agregar el registro');
      console.error(err);
    }
  };

  const handleCreateAuth = async (e) => {
    e.preventDefault();
    try {
      const res = await personnelAPI.createAuthorization(
        selected.usuario.id,
        limpiarPayload(formAuth)
      );
      alert(res.data.message);
      openDetail(selected.usuario.id);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al otorgar la autorización');
      console.error(err);
    }
  };

  const handleRevoke = async (authId) => {
    const motivo = window.prompt('Motivo de la revocación:');
    if (motivo === null) return;
    try {
      const res = await personnelAPI.revokeAuthorization(authId, {
        observaciones: motivo || undefined,
      });
      alert(res.data.message);
      openDetail(selected.usuario.id);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al revocar');
      console.error(err);
    }
  };

  if (loading && personal.length === 0 && !error) {
    return <div className="loader"></div>;
  }

  return (
    <div className="pers-container">
      <div className="pers-header">
        <h1>👥 Personal y Competencias</h1>
      </div>

      {error && (
        <div className="alert alert-danger" onClick={() => setError(null)}>
          {error}
        </div>
      )}

      {alertas && (alertas.total > 0 || alertas.sin_evaluacion_competencia.length > 0) && (
        <div className="pers-alertas card">
          <h2>🔔 Alertas de competencia</h2>
          {alertas.sin_evaluacion_competencia.length > 0 && (
            <p className="pers-alerta-eval">
              ⚠️ Sin evaluación de competencia registrada:{' '}
              {alertas.sin_evaluacion_competencia.map((p) => p.nombre).join(', ')}
            </p>
          )}
          {alertas.alertas.length > 0 && (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Persona</th>
                    <th>Tipo</th>
                    <th>Detalle</th>
                    <th>Vence</th>
                    <th>Situación</th>
                  </tr>
                </thead>
                <tbody>
                  {alertas.alertas.map((a, i) => (
                    <tr key={i} className="pers-row" onClick={() => openDetail(a.user_id)}>
                      <td>{a.persona}</td>
                      <td>{TIPOS_REGISTRO[a.tipo] || 'Autorización'}</td>
                      <td className="pers-detalle">{a.detalle}</td>
                      <td>{a.fecha_vencimiento}</td>
                      <td>
                        <span className={`badge ${a.vencido ? 'badge-pers-vencido' : 'badge-pers-proximo'}`}>
                          {a.vencido ? 'VENCIDO' : 'Por vencer'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {personal.length === 0 ? (
        !error && <p>No hay personal registrado</p>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Registros</th>
                <th>Eval. competencia</th>
                <th>Autorizaciones vigentes</th>
              </tr>
            </thead>
            <tbody>
              {personal.map((p) => (
                <tr key={p.id} onClick={() => openDetail(p.id)} className="pers-row">
                  <td>
                    <strong>{p.nombre} {p.apellido || ''}</strong>
                    <div className="pers-email">{p.email}</div>
                  </td>
                  <td>{p.rol || '—'}</td>
                  <td>{p.registros}</td>
                  <td>
                    {p.sin_evaluacion ? (
                      <span className="badge badge-pers-vencido">Sin evaluación</span>
                    ) : (
                      p.evaluaciones_competencia
                    )}
                  </td>
                  <td>{p.autorizaciones_vigentes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="pers-modal-overlay" onClick={() => setSelected(null)}>
          <div className="pers-modal card" onClick={(e) => e.stopPropagation()}>
            <div className="pers-modal-header">
              <h2>
                {selected.usuario.nombre} {selected.usuario.apellido || ''}
                <span className="pers-rol"> — {selected.usuario.rol?.nombre}</span>
              </h2>
              <button className="pers-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="pers-section-header">
              <h3>Expediente (6.2.5)</h3>
              {puedeEditar && (
                <button className="btn-primary" onClick={() => setShowRecordForm(!showRecordForm)}>
                  {showRecordForm ? '✕ Cancelar' : '➕ Agregar registro'}
                </button>
              )}
            </div>

            {showRecordForm && (
              <form onSubmit={handleCreateRegistro} className="pers-form">
                <div className="pers-form-grid">
                  <div className="form-group">
                    <label>Tipo: *</label>
                    <select
                      value={formRegistro.tipo}
                      onChange={(e) => setFormRegistro({ ...formRegistro, tipo: e.target.value })}
                      required
                    >
                      {Object.entries(TIPOS_REGISTRO).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Fecha: *</label>
                    <input
                      type="date"
                      value={formRegistro.fecha}
                      onChange={(e) => setFormRegistro({ ...formRegistro, fecha: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Institución / proveedor:</label>
                    <input
                      type="text"
                      value={formRegistro.institucion}
                      onChange={(e) =>
                        setFormRegistro({ ...formRegistro, institucion: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Vencimiento (si aplica):</label>
                    <input
                      type="date"
                      value={formRegistro.fecha_vencimiento}
                      onChange={(e) =>
                        setFormRegistro({ ...formRegistro, fecha_vencimiento: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Ref. certificado:</label>
                    <input
                      type="text"
                      value={formRegistro.referencia_certificado}
                      onChange={(e) =>
                        setFormRegistro({ ...formRegistro, referencia_certificado: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Resultado:</label>
                    <select
                      value={formRegistro.resultado}
                      onChange={(e) =>
                        setFormRegistro({ ...formRegistro, resultado: e.target.value })
                      }
                    >
                      <option value="">— No aplica —</option>
                      <option value="aprobado">Aprobado</option>
                      <option value="reprobado">Reprobado</option>
                      <option value="pendiente">Pendiente</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Descripción: *</label>
                  <textarea
                    value={formRegistro.descripcion}
                    onChange={(e) =>
                      setFormRegistro({ ...formRegistro, descripcion: e.target.value })
                    }
                    rows="2"
                    required
                  ></textarea>
                </div>
                <button type="submit" className="btn-primary">Guardar</button>
              </form>
            )}

            {selected.registros.length === 0 ? (
              <p>Sin registros en el expediente</p>
            ) : (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Descripción</th>
                      <th>Institución</th>
                      <th>Fecha</th>
                      <th>Vence</th>
                      <th>Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.registros.map((r) => (
                      <tr key={r.id}>
                        <td>{TIPOS_REGISTRO[r.tipo]}</td>
                        <td className="pers-detalle">{r.descripcion}</td>
                        <td>{r.institucion || '—'}</td>
                        <td>{r.fecha}</td>
                        <td>{r.fecha_vencimiento || '—'}</td>
                        <td>{r.resultado || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pers-section-header">
              <h3>Autorizaciones (6.2.6)</h3>
              {puedeEditar && (
                <button className="btn-primary" onClick={() => setShowAuthForm(!showAuthForm)}>
                  {showAuthForm ? '✕ Cancelar' : '➕ Otorgar autorización'}
                </button>
              )}
            </div>

            {showAuthForm && (
              <form onSubmit={handleCreateAuth} className="pers-form">
                <div className="pers-form-grid">
                  <div className="form-group">
                    <label>Actividad / método: *</label>
                    <input
                      type="text"
                      value={formAuth.actividad}
                      onChange={(e) => setFormAuth({ ...formAuth, actividad: e.target.value })}
                      placeholder="Ej: Ensayo de pH según POE-05"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Fecha de autorización: *</label>
                    <input
                      type="date"
                      value={formAuth.fecha_autorizacion}
                      onChange={(e) =>
                        setFormAuth({ ...formAuth, fecha_autorizacion: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Vencimiento (si aplica):</label>
                    <input
                      type="date"
                      value={formAuth.fecha_vencimiento}
                      onChange={(e) =>
                        setFormAuth({ ...formAuth, fecha_vencimiento: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Alcance / limitaciones:</label>
                  <textarea
                    value={formAuth.alcance}
                    onChange={(e) => setFormAuth({ ...formAuth, alcance: e.target.value })}
                    rows="2"
                  ></textarea>
                </div>
                <button type="submit" className="btn-primary">Otorgar</button>
              </form>
            )}

            {selected.autorizaciones.length === 0 ? (
              <p>Sin autorizaciones</p>
            ) : (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Actividad</th>
                      <th>Autorizó</th>
                      <th>Fecha</th>
                      <th>Vence</th>
                      <th>Estado</th>
                      {puedeEditar && <th></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {selected.autorizaciones.map((a) => (
                      <tr key={a.id}>
                        <td className="pers-detalle">{a.actividad}</td>
                        <td>{a.autorizador?.nombre || '—'}</td>
                        <td>{a.fecha_autorizacion}</td>
                        <td>{a.fecha_vencimiento || '—'}</td>
                        <td>
                          <span className={`badge badge-auth-${a.estado}`}>{a.estado}</span>
                        </td>
                        {puedeEditar && (
                          <td>
                            {a.estado === 'vigente' && (
                              <button
                                className="pers-btn-revocar"
                                onClick={() => handleRevoke(a.id)}
                              >
                                Revocar
                              </button>
                            )}
                          </td>
                        )}
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

export default Personnel;
