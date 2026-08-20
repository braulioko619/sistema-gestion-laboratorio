import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { serviceVisitsAPI, assuranceAPI } from '../services/api';
import './ServiceScheduler.css';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const HORA_INICIO_GRILLA = 8; // 08:00
const HORA_FIN_GRILLA = 20; // 20:00
const PX_POR_HORA = 56;

const ESTADOS_VISITA = {
  programada: 'Programada',
  confirmada: 'Confirmada',
  en_curso: 'En curso',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

const COLORES_TECNICO = ['#00857d', '#2874a6', '#b9770e', '#7d3c98', '#c0392b', '#1e8449', '#a93226', '#117864'];

// Actividades de aseguramiento (§7.7): se programan por fecha, sin hora, así
// que en la agenda van en una franja de "todo el día" sobre la grilla horaria.
// Se gestionan en la pestaña Aseguramiento; aquí solo se muestran.
const TIPOS_ASEGURAMIENTO = {
  control_patron: 'Control con patrón',
  repetibilidad: 'Repetibilidad',
  carta_control: 'Carta de control',
  verificacion_intermedia: 'Verificación intermedia',
  recalibracion_item: 'Recalibración de ítem',
  ensayo_aptitud: 'Ensayo de aptitud',
  intercomparacion: 'Intercomparación',
  revision_resultados: 'Revisión de resultados',
  correlacion_resultados: 'Correlación de resultados',
  auditoria_tecnica: 'Auditoría técnica',
  testificacion: 'Testificación',
};

const ESTADOS_ASEGURAMIENTO = {
  planificada: 'Planificada',
  en_ejecucion: 'En ejecución',
  ejecutada: 'Ejecutada',
  cancelada: 'Cancelada',
};

const RESULTADOS_ASEGURAMIENTO = {
  pendiente: 'Pendiente',
  conforme: 'Conforme',
  no_conforme: 'No conforme',
  no_concluyente: 'No concluyente',
};

const FORM_VISITA_VACIO = {
  tecnico_id: '',
  work_order_id: '',
  motivo: '',
  fecha: '',
  hora_inicio: '',
  hora_fin: '',
  lugar: '',
  modalidad: 'terreno',
  distancia_km: '',
  tiempo_traslado_horas: '',
  comentarios: '',
  estado: 'programada',
};

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function toISODate(d) {
  return d.toISOString().split('T')[0];
}

function formatRangoSemana(monday) {
  const sunday = addDays(monday, 6);
  const opts = { day: 'numeric', month: 'short' };
  return `${monday.toLocaleDateString('es-CL', opts)} — ${sunday.toLocaleDateString('es-CL', opts)}, ${sunday.getFullYear()}`;
}

function minutosDesdeInicioGrilla(horaStr) {
  if (!horaStr) return null;
  const [h, m] = horaStr.split(':').map(Number);
  return (h * 60 + m) - HORA_INICIO_GRILLA * 60;
}

function colorTecnico(tecnicoId, tecnicos) {
  if (!tecnicoId) return '#888';
  const idx = tecnicos.findIndex((t) => t.id === tecnicoId);
  return COLORES_TECNICO[(idx >= 0 ? idx : 0) % COLORES_TECNICO.length];
}

// Calendarización de servicios: agenda semanal donde se asigna técnico,
// horario, OT (opcional) y comentarios, más los campos necesarios para
// planificar el traslado (lugar, distancia, tiempo estimado).
function ServiceScheduler({ users, ordenes, puedeGestionar }) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [visitas, setVisitas] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [verAseguramiento, setVerAseguramiento] = useState(true);
  const [detalleActividad, setDetalleActividad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroTecnico, setFiltroTecnico] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formVisita, setFormVisita] = useState(FORM_VISITA_VACIO);
  const [detalle, setDetalle] = useState(null);

  const dias = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const horas = useMemo(() => Array.from({ length: HORA_FIN_GRILLA - HORA_INICIO_GRILLA }, (_, i) => HORA_INICIO_GRILLA + i), []);
  const alturaGrilla = (HORA_FIN_GRILLA - HORA_INICIO_GRILLA) * PX_POR_HORA;

  const fetchVisitas = useCallback(async () => {
    try {
      setLoading(true);
      const params = { desde: toISODate(weekStart), hasta: toISODate(addDays(weekStart, 6)) };
      if (filtroTecnico) params.tecnico_id = filtroTecnico;
      const res = await serviceVisitsAPI.list(params);
      setVisitas(res.data.data);
    } catch (err) {
      setError('Error al cargar los servicios agendados');
    } finally {
      setLoading(false);
    }
  }, [weekStart, filtroTecnico]);

  // Actividades de aseguramiento de la misma semana. Si la consulta falla, la
  // agenda de servicios sigue funcionando igual.
  const fetchActividades = useCallback(async () => {
    try {
      const res = await assuranceAPI.list({
        desde: toISODate(weekStart),
        hasta: toISODate(addDays(weekStart, 6)),
      });
      setActividades(res.data.data);
    } catch (err) {
      setActividades([]);
    }
  }, [weekStart]);

  useEffect(() => {
    fetchVisitas();
  }, [fetchVisitas]);

  useEffect(() => {
    fetchActividades();
  }, [fetchActividades]);

  const visitasPorDia = (fechaISO) => visitas.filter((v) => v.fecha === fechaISO);

  const actividadesPorDia = (fechaISO) => (
    verAseguramiento ? actividades.filter((a) => a.fecha_planificada === fechaISO) : []
  );

  const hoyISO = toISODate(new Date());
  const actividadVencida = (a) => (
    a.fecha_planificada < hoyISO && !['ejecutada', 'cancelada'].includes(a.estado)
  );

  const resetForm = () => {
    setFormVisita(FORM_VISITA_VACIO);
    setEditingId(null);
    setShowForm(false);
  };

  const abrirNuevo = (fechaISO) => {
    setFormVisita({ ...FORM_VISITA_VACIO, fecha: fechaISO || '' });
    setEditingId(null);
    setShowForm(true);
    setDetalle(null);
  };

  const abrirEdicion = (v) => {
    setFormVisita({
      tecnico_id: v.tecnico_id || '',
      work_order_id: v.work_order_id || '',
      motivo: v.motivo || '',
      fecha: v.fecha,
      hora_inicio: (v.hora_inicio || '').slice(0, 5),
      hora_fin: (v.hora_fin || '').slice(0, 5),
      lugar: v.lugar || '',
      modalidad: v.modalidad || 'terreno',
      distancia_km: v.distancia_km || '',
      tiempo_traslado_horas: v.tiempo_traslado_horas || '',
      comentarios: v.comentarios || '',
      estado: v.estado,
    });
    setEditingId(v.id);
    setShowForm(true);
    setDetalle(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formVisita };
      Object.keys(payload).forEach((k) => { if (payload[k] === '') payload[k] = null; });
      if (editingId) {
        await serviceVisitsAPI.update(editingId, payload);
      } else {
        await serviceVisitsAPI.create(payload);
      }
      resetForm();
      fetchVisitas();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al guardar el servicio agendado');
    }
  };

  const handleCambiarEstadoRapido = async (id, estado) => {
    try {
      await serviceVisitsAPI.update(id, { estado });
      fetchVisitas();
      setDetalle(null);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al cambiar el estado del servicio');
    }
  };

  if (loading && visitas.length === 0) {
    return <div className="loader"></div>;
  }

  return (
    <div className="sched-container">
      {error && (
        <div className="alert alert-danger" onClick={() => setError(null)}>{error}</div>
      )}

      <div className="sched-toolbar">
        <div className="sched-nav">
          <button className="btn-secondary" onClick={() => setWeekStart(addDays(weekStart, -7))}>◀ Semana anterior</button>
          <strong>{formatRangoSemana(weekStart)}</strong>
          <button className="btn-secondary" onClick={() => setWeekStart(getMonday(new Date()))}>Hoy</button>
          <button className="btn-secondary" onClick={() => setWeekStart(addDays(weekStart, 7))}>Semana siguiente ▶</button>
        </div>
        <div className="sched-filtros">
          <label>Técnico: </label>
          <select value={filtroTecnico} onChange={(e) => setFiltroTecnico(e.target.value)}>
            <option value="">— Todos —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </select>
          {puedeGestionar && (
            <button className="btn-primary" onClick={() => abrirNuevo('')}>➕ Agendar servicio</button>
          )}
        </div>
      </div>

      <div className="sched-legend">
        {users.slice(0, 8).map((u) => (
          <span key={u.id} className="sched-legend-item">
            <span className="sched-legend-dot" style={{ background: colorTecnico(u.id, users) }}></span>{u.nombre}
          </span>
        ))}
        <label className="sched-legend-item sched-legend-toggle">
          <input
            type="checkbox"
            checked={verAseguramiento}
            onChange={(e) => setVerAseguramiento(e.target.checked)}
          />
          Mostrar aseguramiento ({actividades.length})
        </label>
      </div>

      <div className="sched-grid-wrapper">
        <div className="sched-grid" style={{ gridTemplateColumns: `60px repeat(7, 1fr)` }}>
          <div className="sched-corner"></div>
          {dias.map((d, i) => (
            <div key={i} className="sched-day-header">
              <div>{DIAS[i]}</div>
              <div className="sched-day-fecha">{d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</div>
              {puedeGestionar && (
                <button type="button" className="sched-link-btn" onClick={() => abrirNuevo(toISODate(d))}>+ agendar</button>
              )}
            </div>
          ))}

          {/* Franja de todo el día: actividades de aseguramiento (sin hora). */}
          {verAseguramiento && (
            <>
              {/* La columna de horas mide 60 px: "Aseguramiento" completo no cabe. */}
              <div className="sched-allday-label" title="Actividades de aseguramiento (§7.7)">Aseg.</div>
              {dias.map((d, i) => {
                const fechaISO = toISODate(d);
                const delDia = actividadesPorDia(fechaISO);
                return (
                  <div key={`aseg-${i}`} className="sched-allday-cell">
                    {delDia.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        className={`sched-aseg sched-aseg-${a.resultado}${actividadVencida(a) ? ' sched-aseg-vencida' : ''}`}
                        onClick={() => setDetalleActividad(a)}
                        title={`${a.codigo} · ${TIPOS_ASEGURAMIENTO[a.tipo] || a.tipo}`}
                      >
                        <strong>{a.codigo}</strong>
                        <span className="sched-aseg-tipo">{TIPOS_ASEGURAMIENTO[a.tipo] || a.tipo}</span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </>
          )}

          <div className="sched-hours-col" style={{ height: alturaGrilla }}>
            {horas.map((h) => (
              <div key={h} className="sched-hour-label" style={{ height: PX_POR_HORA }}>{h}:00</div>
            ))}
          </div>

          {dias.map((d, i) => {
            const fechaISO = toISODate(d);
            const visitasDia = visitasPorDia(fechaISO);
            return (
              <div key={i} className="sched-day-body" style={{ height: alturaGrilla }}>
                {horas.map((h) => (
                  <div key={h} className="sched-hour-line" style={{ height: PX_POR_HORA }}></div>
                ))}
                {visitasDia.map((v) => {
                  const top = minutosDesdeInicioGrilla((v.hora_inicio || '').slice(0, 5));
                  const finMin = v.hora_fin ? minutosDesdeInicioGrilla(v.hora_fin.slice(0, 5)) : (top !== null ? top + 60 : null);
                  if (top === null || finMin === null) return null;
                  const topPx = Math.max(0, (top / 60) * PX_POR_HORA);
                  const heightPx = Math.max(18, ((finMin - top) / 60) * PX_POR_HORA);
                  return (
                    <div
                      key={v.id}
                      className={`sched-visit sched-visit-${v.estado}`}
                      style={{ top: topPx, height: heightPx, borderLeftColor: colorTecnico(v.tecnico_id, users) }}
                      onClick={() => setDetalle(v)}
                    >
                      <strong>{(v.hora_inicio || '').slice(0, 5)}</strong> {v.tecnico?.nombre || 'Sin técnico'}
                      <div className="sched-visit-desc">{v.ordenTrabajo?.codigo || v.motivo || '—'}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {showForm && (
        <div className="sched-modal-overlay" onClick={resetForm}>
          <div className="sched-modal card" onClick={(e) => e.stopPropagation()}>
            <div className="sched-modal-header">
              <h2>{editingId ? 'Editar servicio agendado' : 'Agendar servicio'}</h2>
              <button className="cal-close" onClick={resetForm}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="cal-form-grid">
                <div className="form-group">
                  <label>Técnico: *</label>
                  <select value={formVisita.tecnico_id} onChange={(e) => setFormVisita({ ...formVisita, tecnico_id: e.target.value })} required>
                    <option value="">— Selecciona —</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Orden de trabajo:</label>
                  <select value={formVisita.work_order_id} onChange={(e) => setFormVisita({ ...formVisita, work_order_id: e.target.value })}>
                    <option value="">— Ninguna / por definir —</option>
                    {ordenes.map((ot) => (
                      <option key={ot.id} value={ot.id}>{ot.codigo} — {ot.cliente?.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Fecha: *</label>
                  <input type="date" value={formVisita.fecha} onChange={(e) => setFormVisita({ ...formVisita, fecha: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Hora inicio: *</label>
                  <input type="time" value={formVisita.hora_inicio} onChange={(e) => setFormVisita({ ...formVisita, hora_inicio: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Hora fin:</label>
                  <input type="time" value={formVisita.hora_fin} onChange={(e) => setFormVisita({ ...formVisita, hora_fin: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Modalidad:</label>
                  <select value={formVisita.modalidad} onChange={(e) => setFormVisita({ ...formVisita, modalidad: e.target.value })}>
                    <option value="terreno">Terreno</option>
                    <option value="laboratorio">Laboratorio</option>
                  </select>
                </div>
                {editingId && (
                  <div className="form-group">
                    <label>Estado:</label>
                    <select value={formVisita.estado} onChange={(e) => setFormVisita({ ...formVisita, estado: e.target.value })}>
                      {Object.entries(ESTADOS_VISITA).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {!formVisita.work_order_id && (
                <div className="form-group">
                  <label>Motivo del servicio (obligatorio si no hay OT): *</label>
                  <input type="text" value={formVisita.motivo} onChange={(e) => setFormVisita({ ...formVisita, motivo: e.target.value })} placeholder="Ej: Visita de coordinación con Cliente XYZ" required={!formVisita.work_order_id} />
                </div>
              )}

              <h3>Planificación del traslado</h3>
              <div className="cal-form-grid">
                <div className="form-group">
                  <label>Lugar / dirección:</label>
                  <input type="text" value={formVisita.lugar} onChange={(e) => setFormVisita({ ...formVisita, lugar: e.target.value })} placeholder="Dirección donde se presta el servicio" />
                </div>
                <div className="form-group">
                  <label>Distancia estimada (km, ida y vuelta):</label>
                  <input type="number" min="0" step="0.1" value={formVisita.distancia_km} onChange={(e) => setFormVisita({ ...formVisita, distancia_km: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Tiempo de traslado estimado (horas):</label>
                  <input type="number" min="0" step="0.1" value={formVisita.tiempo_traslado_horas} onChange={(e) => setFormVisita({ ...formVisita, tiempo_traslado_horas: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label>Comentarios:</label>
                <textarea value={formVisita.comentarios} onChange={(e) => setFormVisita({ ...formVisita, comentarios: e.target.value })} rows="2"></textarea>
              </div>

              <button type="submit" className="btn-primary">{editingId ? 'Guardar cambios' : 'Agendar'}</button>
            </form>
          </div>
        </div>
      )}

      {detalle && (
        <div className="sched-modal-overlay" onClick={() => setDetalle(null)}>
          <div className="sched-modal card" onClick={(e) => e.stopPropagation()}>
            <div className="sched-modal-header">
              <h2>Servicio agendado</h2>
              <button className="cal-close" onClick={() => setDetalle(null)}>✕</button>
            </div>
            <p><strong>Fecha:</strong> {detalle.fecha} · {(detalle.hora_inicio || '').slice(0, 5)}{detalle.hora_fin ? ` – ${detalle.hora_fin.slice(0, 5)}` : ''}</p>
            <p><strong>Técnico:</strong> {detalle.tecnico?.nombre || '—'}</p>
            <p><strong>OT:</strong> {detalle.ordenTrabajo?.codigo || '—'} {!detalle.ordenTrabajo && detalle.motivo && <>— {detalle.motivo}</>}</p>
            <p><strong>Cliente:</strong> {detalle.cliente?.nombre || '—'}</p>
            <p><strong>Modalidad:</strong> {detalle.modalidad === 'terreno' ? 'Terreno' : 'Laboratorio'}</p>
            {(detalle.lugar || detalle.distancia_km || detalle.tiempo_traslado_horas) && (
              <p>
                <strong>Traslado:</strong> {detalle.lugar || '—'}
                {detalle.distancia_km ? ` · ${detalle.distancia_km} km` : ''}
                {detalle.tiempo_traslado_horas ? ` · ${detalle.tiempo_traslado_horas} h` : ''}
              </p>
            )}
            {detalle.comentarios && <p><strong>Comentarios:</strong> {detalle.comentarios}</p>}
            <p><strong>Estado:</strong> <span className={`badge sched-badge-${detalle.estado}`}>{ESTADOS_VISITA[detalle.estado]}</span></p>

            {puedeGestionar && (
              <div className="cal-estado-actions">
                <button className="btn-secondary" onClick={() => abrirEdicion(detalle)}>✏️ Editar</button>{' '}
                <label>Cambiar estado: </label>
                <select value={detalle.estado} onChange={(e) => handleCambiarEstadoRapido(detalle.id, e.target.value)}>
                  {Object.entries(ESTADOS_VISITA).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detalle de una actividad de aseguramiento. Solo lectura: se edita en
          la pestaña Aseguramiento, que es donde vive el módulo. */}
      {detalleActividad && (
        <div className="sched-modal-overlay" onClick={() => setDetalleActividad(null)}>
          <div className="sched-modal card" onClick={(e) => e.stopPropagation()}>
            <div className="sched-modal-header">
              <h2>{detalleActividad.codigo}</h2>
              <button className="sched-close" onClick={() => setDetalleActividad(null)}>✕</button>
            </div>

            <div className="cal-detail-grid">
              <p><strong>Actividad:</strong> {TIPOS_ASEGURAMIENTO[detalleActividad.tipo] || detalleActividad.tipo}</p>
              <p><strong>Alcance:</strong> {detalleActividad.alcance}</p>
              <p><strong>Magnitud:</strong> {detalleActividad.magnitud || '—'}</p>
              <p><strong>Responsable:</strong> {detalleActividad.responsable?.nombre || '—'}</p>
              <p><strong>Planificada:</strong> {detalleActividad.fecha_planificada}</p>
              <p><strong>Ejecutada:</strong> {detalleActividad.fecha_ejecucion || '—'}</p>
              <p><strong>Estado:</strong> {ESTADOS_ASEGURAMIENTO[detalleActividad.estado]}</p>
              <p><strong>Resultado:</strong> {RESULTADOS_ASEGURAMIENTO[detalleActividad.resultado]}</p>
            </div>

            {actividadVencida(detalleActividad) && (
              <div className="alert alert-danger">
                La fecha planificada ya pasó y la actividad sigue sin ejecutarse.
              </div>
            )}

            <p className="sched-aseg-nota">
              Esta actividad se gestiona en la pestaña <strong>Aseguramiento</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiceScheduler;
