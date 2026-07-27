import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot, ReferenceLine,
} from 'recharts';
import { equipmentAPI, usersAPI } from '../services/api';
import './Equipment.css';

const ESTADOS = {
  operativo: 'Operativo',
  en_calibracion: 'En calibración',
  en_mantenimiento: 'En mantenimiento',
  fuera_servicio: 'Fuera de servicio',
  dado_de_baja: 'Dado de baja',
};

const TIPOS_EVENTO = {
  calibracion: 'Calibración',
  mantenimiento: 'Mantenimiento',
  verificacion_intermedia: 'Verificación intermedia',
};

// Tarea 3.5: etiquetas de los tipos que genera el job diario de alertas de
// estabilidad (StabilityAlertService).
const TIPOS_ALERTA_ESTABILIDAD = {
  vencimiento_calibracion: 'Calibración por vencer/vencida',
  vencimiento_mantenimiento: 'Mantenimiento por vencer/vencido',
  vencimiento_verificacion: 'Verificación por vencer/vencida',
  deriva: 'Deriva proyectada fuera de tolerancia',
  incertidumbre_creciente: 'Incertidumbre creciente',
};

const FORM_EQUIPO_VACIO = {
  codigo: '',
  nombre: '',
  marca: '',
  modelo: '',
  numero_serie: '',
  ubicacion: '',
  rango: '',
  resolucion: '',
  magnitud: '',
  norma: '',
  protocolo: '',
  hoja_de_vida: '',
  responsable_id: '',
  fecha_ingreso: '',
  observaciones: '',
  error_maximo_permitido: '',
};

const FORM_EVENTO_VACIO = {
  tipo: 'calibracion',
  fecha_realizacion: '',
  proveedor: '',
  certificado_numero: '',
  trazabilidad: '',
  resultado: '',
  proxima_fecha: '',
  observaciones: '',
};

const MS_POR_DIA = 24 * 60 * 60 * 1000;

// Arma el dataset del gráfico (tarea 3.4) a partir de la respuesta del
// análisis de deriva: los valores certificados reales (serie "valor") y,
// si hay suficientes datos, la recta de tendencia calculada por el backend
// (serie "tendencia", evaluada en cada fecha real y en la fecha proyectada)
// más el punto proyectado como marcador aparte.
function construirDatosGrafico(analisisPunto) {
  const puntos = analisisPunto.historial.map((h) => ({
    fecha: h.fecha_calibracion,
    valor: h.valor_certificado,
  }));

  if (!analisisPunto.suficientes_datos || !analisisPunto.proyeccion) {
    return { datos: puntos, proyeccion: null };
  }

  const fechaBaseMs = new Date(analisisPunto.historial[0].fecha_calibracion).getTime();
  const conTendencia = puntos.map((p) => ({
    ...p,
    tendencia: analisisPunto.intercepto + analisisPunto.pendiente * ((new Date(p.fecha).getTime() - fechaBaseMs) / MS_POR_DIA),
  }));

  const xProyeccion = (new Date(analisisPunto.proyeccion.fecha).getTime() - fechaBaseMs) / MS_POR_DIA;
  conTendencia.push({
    fecha: analisisPunto.proyeccion.fecha,
    tendencia: analisisPunto.intercepto + analisisPunto.pendiente * xProyeccion,
  });

  return { datos: conTendencia, proyeccion: analisisPunto.proyeccion };
}

function Equipment() {
  const [equipos, setEquipos] = useState([]);
  const [alertas, setAlertas] = useState(null);
  const [alertasEstabilidad, setAlertasEstabilidad] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);

  const [formEquipo, setFormEquipo] = useState(FORM_EQUIPO_VACIO);
  const [formEvento, setFormEvento] = useState(FORM_EVENTO_VACIO);
  const [deriva, setDeriva] = useState(null);
  const [derivaError, setDerivaError] = useState(null);
  const [cartaControl, setCartaControl] = useState(null);
  const [cartaControlError, setCartaControlError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = filtroEstado ? { estado: filtroEstado } : {};
      const [eqRes, alertRes, estabilidadRes] = await Promise.all([
        equipmentAPI.list(params),
        equipmentAPI.alerts(),
        equipmentAPI.stabilityAlerts(),
      ]);
      setEquipos(eqRes.data.data);
      setAlertas(alertRes.data.data);
      setAlertasEstabilidad(estabilidadRes.data.data);
    } catch (err) {
      setError('Error al cargar equipos');
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

  const handleCreateEquipo = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formEquipo };
      Object.keys(payload).forEach((k) => {
        if (payload[k] === '') delete payload[k];
      });
      const res = await equipmentAPI.create(payload);
      alert(res.data.message);
      setFormEquipo(FORM_EQUIPO_VACIO);
      setShowForm(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Error al registrar el equipo';
      setError(msg);
      console.error(err);
    }
  };

  const openDetail = async (equipoId) => {
    try {
      const res = await equipmentAPI.get(equipoId);
      setSelected(res.data.data);
      setShowEventForm(false);
      setFormEvento(FORM_EVENTO_VACIO);
      setDeriva(null);
      setDerivaError(null);
      setCartaControl(null);
      setCartaControlError(null);
    } catch (err) {
      setError('Error al cargar el detalle del equipo');
      console.error(err);
    }
  };

  // Análisis de deriva (tarea 3.4): se pide aparte del detalle porque
  // implica una consulta y un cálculo propios (regresión por punto), no es
  // parte del registro simple del equipo.
  useEffect(() => {
    if (!selected) return;
    equipmentAPI
      .driftAnalysis(selected.id)
      .then((res) => setDeriva(res.data.data))
      .catch(() => setDerivaError('Error al calcular el análisis de deriva'));
  }, [selected]);

  // Carta de control (tarea 4.4): segunda vista de estabilidad, independiente
  // de la deriva — mismo criterio de "consulta aparte" que el efecto de arriba.
  useEffect(() => {
    if (!selected) return;
    equipmentAPI
      .controlChart(selected.id)
      .then((res) => setCartaControl(res.data.data))
      .catch(() => setCartaControlError('Error al calcular la carta de control'));
  }, [selected]);

  const handleCreateEvento = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formEvento };
      Object.keys(payload).forEach((k) => {
        if (payload[k] === '') delete payload[k];
      });
      const res = await equipmentAPI.createEvent(selected.id, payload);
      alert(res.data.message);
      openDetail(selected.id);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Error al registrar el evento';
      setError(msg);
      console.error(err);
    }
  };

  const hoy = new Date().toISOString().split('T')[0];

  const claseVencimiento = (fecha) => {
    if (!fecha) return '';
    if (fecha < hoy) return 'eq-fecha-vencida';
    const limite = new Date();
    limite.setDate(limite.getDate() + 60);
    if (fecha <= limite.toISOString().split('T')[0]) return 'eq-fecha-proxima';
    return '';
  };

  if (loading && equipos.length === 0) {
    return <div className="loader"></div>;
  }

  return (
    <div className="eq-container">
      <div className="eq-header">
        <h1>Equipos</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? '✕ Cancelar' : '➕ Nuevo Equipo'}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" onClick={() => setError(null)}>
          {error}
        </div>
      )}

      {alertas && alertas.total > 0 && (
        <div className="eq-alertas card">
          <h2>
            🔔 Alertas ({alertas.vencidas} vencidas, {alertas.por_vencer} por vencer en{' '}
            {alertas.dias_anticipacion} días)
          </h2>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Equipo</th>
                  <th>Tipo</th>
                  <th>Fecha programada</th>
                  <th>Situación</th>
                  <th>Responsable</th>
                </tr>
              </thead>
              <tbody>
                {alertas.alertas.map((a, i) => (
                  <tr key={i} className="eq-row" onClick={() => openDetail(a.equipo_id)}>
                    <td><strong>{a.codigo}</strong> — {a.nombre}</td>
                    <td>{TIPOS_EVENTO[a.tipo]}</td>
                    <td className={a.vencido ? 'eq-fecha-vencida' : 'eq-fecha-proxima'}>
                      {a.fecha_programada}
                    </td>
                    <td>
                      <span className={`badge ${a.vencido ? 'badge-eq-vencido' : 'badge-eq-proximo'}`}>
                        {a.vencido ? 'VENCIDO' : 'Por vencer'}
                      </span>
                    </td>
                    <td>{a.responsable || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {alertasEstabilidad.length > 0 && (
        <div className="eq-alertas card">
          <h2>⚠️ Alertas de estabilidad ({alertasEstabilidad.length})</h2>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Patrón</th>
                  <th>Tipo</th>
                  <th>Punto</th>
                  <th>Mensaje</th>
                  <th>Detectada desde</th>
                </tr>
              </thead>
              <tbody>
                {alertasEstabilidad.map((a) => (
                  <tr key={a.id} className="eq-row" onClick={() => openDetail(a.equipment_id)}>
                    <td><strong>{a.equipo?.codigo}</strong> — {a.equipo?.nombre}</td>
                    <td>{TIPOS_ALERTA_ESTABILIDAD[a.tipo] || a.tipo}</td>
                    <td>{a.punto_medicion || '—'}</td>
                    <td>{a.mensaje}</td>
                    <td>{a.primera_deteccion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="card eq-form">
          <h2>Registrar Equipo</h2>
          <form onSubmit={handleCreateEquipo}>
            <div className="eq-form-grid">
              <div className="form-group">
                <label>Código interno: *</label>
                <input
                  type="text"
                  value={formEquipo.codigo}
                  onChange={(e) => setFormEquipo({ ...formEquipo, codigo: e.target.value })}
                  placeholder="Ej: BAL-001"
                  required
                />
              </div>
              <div className="form-group">
                <label>Nombre: *</label>
                <input
                  type="text"
                  value={formEquipo.nombre}
                  onChange={(e) => setFormEquipo({ ...formEquipo, nombre: e.target.value })}
                  placeholder="Ej: Balanza analítica"
                  required
                />
              </div>
              <div className="form-group">
                <label>Marca:</label>
                <input
                  type="text"
                  value={formEquipo.marca}
                  onChange={(e) => setFormEquipo({ ...formEquipo, marca: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Modelo:</label>
                <input
                  type="text"
                  value={formEquipo.modelo}
                  onChange={(e) => setFormEquipo({ ...formEquipo, modelo: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>N° de serie:</label>
                <input
                  type="text"
                  value={formEquipo.numero_serie}
                  onChange={(e) =>
                    setFormEquipo({ ...formEquipo, numero_serie: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Ubicación:</label>
                <input
                  type="text"
                  value={formEquipo.ubicacion}
                  onChange={(e) => setFormEquipo({ ...formEquipo, ubicacion: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Rango:</label>
                <input
                  type="text"
                  value={formEquipo.rango}
                  onChange={(e) => setFormEquipo({ ...formEquipo, rango: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Resolución:</label>
                <input
                  type="text"
                  value={formEquipo.resolucion}
                  onChange={(e) => setFormEquipo({ ...formEquipo, resolucion: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Magnitud:</label>
                <input
                  type="text"
                  value={formEquipo.magnitud}
                  onChange={(e) => setFormEquipo({ ...formEquipo, magnitud: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Norma:</label>
                <input
                  type="text"
                  value={formEquipo.norma}
                  onChange={(e) => setFormEquipo({ ...formEquipo, norma: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Protocolo:</label>
                <input
                  type="text"
                  value={formEquipo.protocolo}
                  onChange={(e) => setFormEquipo({ ...formEquipo, protocolo: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Hoja de vida:</label>
                <input
                  type="text"
                  value={formEquipo.hoja_de_vida}
                  onChange={(e) => setFormEquipo({ ...formEquipo, hoja_de_vida: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Error máximo permitido:</label>
                <input
                  type="number"
                  step="any"
                  value={formEquipo.error_maximo_permitido}
                  onChange={(e) => setFormEquipo({ ...formEquipo, error_maximo_permitido: e.target.value })}
                  placeholder="Misma unidad que sus puntos calibrados"
                />
              </div>
              <div className="form-group">
                <label>Responsable:</label>
                <select
                  value={formEquipo.responsable_id}
                  onChange={(e) =>
                    setFormEquipo({ ...formEquipo, responsable_id: e.target.value })
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
                <label>Fecha de ingreso:</label>
                <input
                  type="date"
                  value={formEquipo.fecha_ingreso}
                  onChange={(e) =>
                    setFormEquipo({ ...formEquipo, fecha_ingreso: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="form-group">
              <label>Observaciones:</label>
              <textarea
                value={formEquipo.observaciones}
                onChange={(e) =>
                  setFormEquipo({ ...formEquipo, observaciones: e.target.value })
                }
                rows="2"
              ></textarea>
            </div>
            <button type="submit" className="btn-primary">Registrar</button>
          </form>
        </div>
      )}

      <div className="eq-filters">
        <label>Filtrar por estado: </label>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="">Todos</option>
          {Object.entries(ESTADOS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {equipos.length === 0 ? (
        <p>No hay equipos registrados</p>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Próx. calibración</th>
                <th>Próx. mantenimiento</th>
                <th>Ubicación</th>
                <th>Responsable</th>
              </tr>
            </thead>
            <tbody>
              {equipos.map((eq) => (
                <tr key={eq.id} onClick={() => openDetail(eq.id)} className="eq-row">
                  <td><strong>{eq.codigo}</strong></td>
                  <td>{eq.nombre}</td>
                  <td>
                    <span className={`badge badge-eq-${eq.estado}`}>
                      {ESTADOS[eq.estado]}
                    </span>
                  </td>
                  <td className={claseVencimiento(eq.proxima_calibracion)}>
                    {eq.proxima_calibracion || '—'}
                  </td>
                  <td className={claseVencimiento(eq.proximo_mantenimiento)}>
                    {eq.proximo_mantenimiento || '—'}
                  </td>
                  <td>{eq.ubicacion || '—'}</td>
                  <td>{eq.responsable?.nombre || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="eq-modal-overlay" onClick={() => setSelected(null)}>
          <div className="eq-modal card" onClick={(e) => e.stopPropagation()}>
            <div className="eq-modal-header">
              <h2>{selected.codigo} — {selected.nombre}</h2>
              <button className="eq-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="eq-detail-grid">
              <p><strong>Estado:</strong>{' '}
                <span className={`badge badge-eq-${selected.estado}`}>
                  {ESTADOS[selected.estado]}
                </span>
              </p>
              <p><strong>Marca/Modelo:</strong> {selected.marca || '—'} / {selected.modelo || '—'}</p>
              <p><strong>N° serie:</strong> {selected.numero_serie || '—'}</p>
              <p><strong>Ubicación:</strong> {selected.ubicacion || '—'}</p>
              <p><strong>Rango:</strong> {selected.rango || '—'}</p>
              <p><strong>Resolución:</strong> {selected.resolucion || '—'}</p>
              <p><strong>Magnitud:</strong> {selected.magnitud || '—'}</p>
              <p><strong>Norma:</strong> {selected.norma || '—'}</p>
              <p><strong>Protocolo:</strong> {selected.protocolo || '—'}</p>
              <p><strong>Hoja de vida:</strong> {selected.hoja_de_vida || '—'}</p>
              <p><strong>Error máximo permitido:</strong> {selected.error_maximo_permitido ?? '—'}</p>
              <p><strong>Responsable:</strong> {selected.responsable?.nombre || '—'}</p>
              <p><strong>Ingreso:</strong> {selected.fecha_ingreso || '—'}</p>
              <p className={claseVencimiento(selected.proxima_calibracion)}>
                <strong>Próx. calibración:</strong> {selected.proxima_calibracion || '—'}
              </p>
              <p className={claseVencimiento(selected.proximo_mantenimiento)}>
                <strong>Próx. mantenimiento:</strong> {selected.proximo_mantenimiento || '—'}
              </p>
            </div>

            <div className="eq-eventos-header">
              <h3>Historial (6.4.13)</h3>
              <button
                className="btn-primary"
                onClick={() => setShowEventForm(!showEventForm)}
              >
                {showEventForm ? '✕ Cancelar' : '➕ Registrar evento'}
              </button>
            </div>

            {showEventForm && (
              <form onSubmit={handleCreateEvento} className="eq-evento-form">
                <div className="eq-form-grid">
                  <div className="form-group">
                    <label>Tipo: *</label>
                    <select
                      value={formEvento.tipo}
                      onChange={(e) => setFormEvento({ ...formEvento, tipo: e.target.value })}
                      required
                    >
                      {Object.entries(TIPOS_EVENTO).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Fecha de realización: *</label>
                    <input
                      type="date"
                      value={formEvento.fecha_realizacion}
                      onChange={(e) =>
                        setFormEvento({ ...formEvento, fecha_realizacion: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Proveedor / ejecutor:</label>
                    <input
                      type="text"
                      value={formEvento.proveedor}
                      onChange={(e) =>
                        setFormEvento({ ...formEvento, proveedor: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>N° certificado:</label>
                    <input
                      type="text"
                      value={formEvento.certificado_numero}
                      onChange={(e) =>
                        setFormEvento({ ...formEvento, certificado_numero: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Resultado:</label>
                    <select
                      value={formEvento.resultado}
                      onChange={(e) =>
                        setFormEvento({ ...formEvento, resultado: e.target.value })
                      }
                    >
                      <option value="">— Sin resultado —</option>
                      <option value="conforme">Conforme</option>
                      <option value="no_conforme">No conforme (genera NC)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Próxima fecha programada:</label>
                    <input
                      type="date"
                      value={formEvento.proxima_fecha}
                      onChange={(e) =>
                        setFormEvento({ ...formEvento, proxima_fecha: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Trazabilidad del patrón (6.5):</label>
                  <textarea
                    value={formEvento.trazabilidad}
                    onChange={(e) =>
                      setFormEvento({ ...formEvento, trazabilidad: e.target.value })
                    }
                    rows="2"
                    placeholder="Patrón utilizado, laboratorio de calibración, cadena de trazabilidad al SI"
                  ></textarea>
                </div>
                <div className="form-group">
                  <label>Observaciones:</label>
                  <textarea
                    value={formEvento.observaciones}
                    onChange={(e) =>
                      setFormEvento({ ...formEvento, observaciones: e.target.value })
                    }
                    rows="2"
                  ></textarea>
                </div>
                <button type="submit" className="btn-primary">Guardar evento</button>
              </form>
            )}

            {(!selected.eventos || selected.eventos.length === 0) ? (
              <p>Sin eventos registrados</p>
            ) : (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Fecha</th>
                      <th>Proveedor</th>
                      <th>Certificado</th>
                      <th>Resultado</th>
                      <th>Próxima</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.eventos.map((ev) => (
                      <tr key={ev.id}>
                        <td>{TIPOS_EVENTO[ev.tipo]}</td>
                        <td>{ev.fecha_realizacion}</td>
                        <td>{ev.proveedor || '—'}</td>
                        <td>{ev.certificado_numero || '—'}</td>
                        <td>
                          {ev.resultado ? (
                            <span className={`badge badge-${ev.resultado}`}>
                              {ev.resultado}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>{ev.proxima_fecha || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h3>Análisis de deriva (Historial_Patrones)</h3>
            {derivaError && <p className="eq-fecha-vencida">{derivaError}</p>}
            {!deriva ? (
              <p>Calculando…</p>
            ) : deriva.length === 0 ? (
              <p>Sin historial de calibración registrado para este patrón todavía.</p>
            ) : (
              deriva.map((analisisPunto) => {
                const { datos, proyeccion } = construirDatosGrafico(analisisPunto);
                return (
                  <div key={analisisPunto.punto_medicion} className="eq-deriva-punto">
                    <h4>Punto: {analisisPunto.punto_medicion}</h4>
                    {!analisisPunto.suficientes_datos ? (
                      <p>{analisisPunto.motivo_insuficiente}</p>
                    ) : (
                      <>
                        <div style={{ width: '100%', height: 260 }}>
                          <ResponsiveContainer>
                            <LineChart data={datos}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="fecha" />
                              <YAxis domain={['auto', 'auto']} />
                              <Tooltip />
                              <Legend />
                              <Line type="monotone" dataKey="valor" name="Valor certificado" stroke="#00857d" dot connectNulls={false} />
                              <Line type="monotone" dataKey="tendencia" name="Tendencia (regresión)" stroke="#b9770e" strokeDasharray="5 5" dot={false} />
                              {proyeccion && (
                                <ReferenceDot
                                  x={proyeccion.fecha}
                                  y={proyeccion.valor_proyectado}
                                  r={5}
                                  fill="#c0392b"
                                  stroke="none"
                                  label={{ value: 'Proyección', position: 'top', fill: '#c0392b', fontSize: 11 }}
                                />
                              )}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <p>
                          Pendiente: {analisisPunto.pendiente.toFixed(8)} {analisisPunto.historial[0].unidad}/día
                          {proyeccion && (
                            <> — Proyección al {proyeccion.fecha}: {proyeccion.valor_proyectado.toFixed(6)} {analisisPunto.historial[0].unidad}</>
                          )}
                        </p>
                        {analisisPunto.alerta_error_maximo && (
                          <p className={analisisPunto.alerta_error_maximo.supera ? 'eq-fecha-vencida' : ''}>
                            {analisisPunto.alerta_error_maximo.supera ? '⚠️ ' : '✓ '}
                            {analisisPunto.alerta_error_maximo.motivo}
                          </p>
                        )}
                      </>
                    )}
                    {analisisPunto.alerta_incertidumbre_creciente.creciente && (
                      <p className="eq-fecha-proxima">⚠️ {analisisPunto.alerta_incertidumbre_creciente.motivo}</p>
                    )}
                  </div>
                );
              })
            )}

            <h3>Carta de control (segunda vista de estabilidad)</h3>
            {cartaControlError && <p className="eq-fecha-vencida">{cartaControlError}</p>}
            {!cartaControl ? (
              <p>Calculando…</p>
            ) : cartaControl.length === 0 ? (
              <p>Sin historial de calibración registrado para este patrón todavía.</p>
            ) : (
              cartaControl.map((analisisPunto) => (
                <div key={analisisPunto.punto_medicion} className="eq-deriva-punto">
                  <h4>Punto: {analisisPunto.punto_medicion}</h4>
                  {!analisisPunto.suficientes_datos ? (
                    <p>{analisisPunto.motivo_insuficiente}</p>
                  ) : (
                    <>
                      <div style={{ width: '100%', height: 260 }}>
                        <ResponsiveContainer>
                          <LineChart data={analisisPunto.historial}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="fecha_calibracion" />
                            <YAxis domain={['auto', 'auto']} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="valor_certificado" name="Valor certificado" stroke="#00857d" dot />
                            <ReferenceLine y={analisisPunto.limites.media} stroke="#555" strokeDasharray="3 3" label="Media" />
                            <ReferenceLine y={analisisPunto.limites.limite_superior} stroke="#c0392b" strokeDasharray="5 5" label="LCS" />
                            <ReferenceLine y={analisisPunto.limites.limite_inferior} stroke="#c0392b" strokeDasharray="5 5" label="LCI" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <p>
                        Media: {analisisPunto.limites.media.toFixed(6)} — Límites de control: [{analisisPunto.limites.limite_inferior.toFixed(6)}, {analisisPunto.limites.limite_superior.toFixed(6)}]
                      </p>
                      {analisisPunto.puntos_fuera_de_control.length > 0 && (
                        <p className="eq-fecha-vencida">
                          ⚠️ {analisisPunto.puntos_fuera_de_control.length} punto(s) fuera de control: {analisisPunto.puntos_fuera_de_control.map((p) => `${p.fecha_calibracion} (${p.valor_certificado})`).join(', ')}
                        </p>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Equipment;
