import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { assuranceAPI, equipmentAPI } from '../services/api';
import './Calibraciones.css';

// Aseguramiento de la validez de los resultados (NCh-ISO/IEC 17025 §7.7).
// El apartado cubre cuatro cosas: qué actividades se hacen, cuándo se hacen
// (programación), con qué criterio se declara conforme cada una (método de
// evaluación) y qué evidencia las respalda (registros).

const FAMILIAS = {
  interna: 'Control interno (§7.7.1)',
  externa: 'Interlaboratorio (§7.7.2)',
  revision: 'Revisión de resultados',
  auditoria: 'Auditoría técnica',
};

const TIPOS = {
  control_patron: { label: 'Control con patrón de verificación', familia: 'interna' },
  repetibilidad: { label: 'Repetibilidad / reproducibilidad', familia: 'interna' },
  carta_control: { label: 'Carta de control', familia: 'interna' },
  verificacion_intermedia: { label: 'Verificación intermedia de equipo', familia: 'interna' },
  recalibracion_item: { label: 'Recalibración de ítem retenido', familia: 'interna' },
  ensayo_aptitud: { label: 'Ensayo de aptitud (PT)', familia: 'externa' },
  intercomparacion: { label: 'Comparación interlaboratorio', familia: 'externa' },
  revision_resultados: { label: 'Revisión por segunda persona', familia: 'revision' },
  correlacion_resultados: { label: 'Correlación de resultados', familia: 'revision' },
  auditoria_tecnica: { label: 'Auditoría técnica interna', familia: 'auditoria' },
  testificacion: { label: 'Testificación en el puesto', familia: 'auditoria' },
};

const FRECUENCIAS = {
  unica: 'Única',
  mensual: 'Mensual',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
  bienal: 'Bienal',
};

const ESTADOS = {
  planificada: 'Planificada',
  en_ejecucion: 'En ejecución',
  ejecutada: 'Ejecutada',
  cancelada: 'Cancelada',
};

const RESULTADOS = {
  pendiente: 'Pendiente',
  conforme: 'Conforme',
  no_conforme: 'No conforme',
  no_concluyente: 'No concluyente',
};

// Método con que se evalúa la conformidad. `limite` es el valor por defecto
// contra el que se compara |valor obtenido|; 'emp' no tiene uno universal
// porque depende del instrumento.
const CRITERIOS = {
  numero_en: { label: 'Número En', limite: 1, ayuda: 'Conforme si |En| ≤ 1' },
  z_score: { label: 'z-score', limite: 2, ayuda: 'Conforme si |z| ≤ 2 (2 a 3 cuestionable)' },
  carta_control: { label: 'Límites de carta de control', limite: 3, ayuda: 'Conforme dentro de ±3σ' },
  emp: { label: 'Comparación contra EMP', limite: null, ayuda: 'Conforme si |error| ≤ EMP declarado' },
  otro: { label: 'Otro criterio', limite: null, ayuda: 'Se describe el criterio y se declara el resultado a mano' },
};

const FORM_VACIO = {
  tipo: 'control_patron',
  magnitud: '',
  alcance: '',
  equipment_id: '',
  responsable_id: '',
  frecuencia: 'unica',
  fecha_planificada: new Date().toISOString().split('T')[0],
  criterio: 'numero_en',
  criterio_detalle: '',
  // Prellenado con el límite del criterio inicial, para que coincida con lo
  // que muestra el selector desde el primer momento.
  valor_limite: String(1),
  observaciones: '',
};

const FORM_EVAL_VACIO = {
  fecha_ejecucion: new Date().toISOString().split('T')[0],
  valor_obtenido: '',
  valor_limite: '',
  resultado: 'conforme',
  evaluacion: '',
};

function hoyISO() {
  return new Date().toISOString().split('T')[0];
}

// Una actividad está vencida si pasó su fecha y todavía no se ejecuta.
function estaVencida(a) {
  return a.fecha_planificada < hoyISO() && !['ejecutada', 'cancelada'].includes(a.estado);
}

function AseguramientoPanel({ users = [], puedeGestionar }) {
  const [actividades, setActividades] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const [filtro, setFiltro] = useState({ tipo: '', estado: '', resultado: '' });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);

  const [selected, setSelected] = useState(null);
  const [formEval, setFormEval] = useState(FORM_EVAL_VACIO);
  const [recordFiles, setRecordFiles] = useState(null);
  const [recordDesc, setRecordDesc] = useState('');
  const [visor, setVisor] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filtro.tipo) params.tipo = filtro.tipo;
      if (filtro.estado) params.estado = filtro.estado;
      if (filtro.resultado) params.resultado = filtro.resultado;

      const [listRes, sumRes] = await Promise.all([
        assuranceAPI.list(params),
        assuranceAPI.summary(),
      ]);
      setActividades(listRes.data.data);
      setResumen(sumRes.data.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar las actividades de aseguramiento');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    equipmentAPI.list({ limit: 500 })
      .then((res) => setEquipos(res.data.data || []))
      .catch(() => { /* el selector de equipo es opcional */ });
  }, []);

  // Mantiene sincronizada la actividad abierta en el detalle.
  const refrescarSeleccion = (actualizada) => {
    setActividades((prev) => prev.map((a) => (a.id === actualizada.id ? actualizada : a)));
    setSelected(actualizada);
  };

  const criterioActual = CRITERIOS[form.criterio] || CRITERIOS.otro;

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      Object.keys(payload).forEach((k) => { if (payload[k] === '') delete payload[k]; });
      const res = await assuranceAPI.create(payload);
      setActividades((prev) => [res.data.data, ...prev]);
      setForm(FORM_VACIO);
      setShowForm(false);
      setMensaje(`Actividad ${res.data.data.codigo} programada`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al programar la actividad');
      console.error(err);
    }
  };

  const abrirDetalle = (actividad) => {
    setSelected(actividad);
    setFormEval({
      ...FORM_EVAL_VACIO,
      valor_limite: actividad.valor_limite ?? '',
      resultado: actividad.resultado === 'pendiente' ? 'conforme' : actividad.resultado,
    });
    setRecordFiles(null);
    setRecordDesc('');
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formEval };
      Object.keys(payload).forEach((k) => { if (payload[k] === '') delete payload[k]; });
      const res = await assuranceAPI.evaluate(selected.id, payload);
      refrescarSeleccion(res.data.data);
      setMensaje(res.data.message
        + (res.data.proxima_fecha_sugerida
          ? ` · Próxima ocurrencia sugerida: ${res.data.proxima_fecha_sugerida}`
          : ''));
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al registrar el resultado');
      console.error(err);
    }
  };

  const handleCrearNC = async () => {
    if (!window.confirm('¿Levantar una no conformidad a partir de esta actividad?')) return;
    try {
      const res = await assuranceAPI.createNonConformity(selected.id, {});
      refrescarSeleccion(res.data.data);
      setMensaje(res.data.message);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al crear la no conformidad');
      console.error(err);
    }
  };

  const handleUploadRecords = async (e) => {
    e.preventDefault();
    if (!recordFiles || recordFiles.length === 0) return;
    try {
      const formData = new FormData();
      Array.from(recordFiles).forEach((f) => formData.append('archivos', f));
      if (recordDesc) formData.append('descripcion', recordDesc);
      const res = await assuranceAPI.uploadRecords(selected.id, formData);
      refrescarSeleccion(res.data.data);
      setRecordFiles(null);
      setRecordDesc('');
      e.target.reset();
      setMensaje(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al subir los registros');
      console.error(err);
    }
  };

  const handleDownloadRecord = async (registro) => {
    try {
      const res = await assuranceAPI.downloadRecord(registro.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = registro.nombre_original;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Error al descargar el registro');
      console.error(err);
    }
  };

  const handlePreviewRecord = async (registro) => {
    const esPdf = (registro.tipo_mime || '').includes('pdf');
    const esImagen = (registro.tipo_mime || '').startsWith('image/');
    setVisor({ registro, vista: esPdf ? 'pdf' : esImagen ? 'imagen' : null, url: null, cargando: true });
    try {
      const res = await assuranceAPI.previewRecord(registro.id);
      const blob = new Blob([res.data], { type: registro.tipo_mime || 'application/octet-stream' });
      setVisor({
        registro,
        vista: esPdf ? 'pdf' : esImagen ? 'imagen' : null,
        url: window.URL.createObjectURL(blob),
        cargando: false,
      });
    } catch (err) {
      setVisor(null);
      setError('No se pudo abrir el registro');
      console.error(err);
    }
  };

  const cerrarVisor = () => {
    setVisor((actual) => {
      if (actual?.url) window.URL.revokeObjectURL(actual.url);
      return null;
    });
  };

  // Programa del año agrupado por mes: la vista de "programación".
  const programa = useMemo(() => {
    const meses = {};
    actividades.forEach((a) => {
      const mes = a.fecha_planificada.slice(0, 7);
      if (!meses[mes]) meses[mes] = [];
      meses[mes].push(a);
    });
    return Object.entries(meses).sort(([a], [b]) => b.localeCompare(a));
  }, [actividades]);

  const [vista, setVista] = useState('listado');

  if (loading && actividades.length === 0) return <div className="loader"></div>;

  return (
    <div className="aseg-panel">
      {error && <div className="alert alert-danger" onClick={() => setError(null)}>{error}</div>}
      {mensaje && <div className="alert alert-success" onClick={() => setMensaje(null)}>{mensaje}</div>}

      {resumen && (
        <div className="aseg-resumen">
          <div className="aseg-kpi">
            <span className="aseg-kpi-valor">{resumen.total}</span>
            <span className="aseg-kpi-label">Actividades</span>
          </div>
          <div className="aseg-kpi">
            <span className="aseg-kpi-valor">{resumen.planificadas}</span>
            <span className="aseg-kpi-label">Programadas</span>
          </div>
          <div className={`aseg-kpi${resumen.vencidas > 0 ? ' aseg-kpi-alerta' : ''}`}>
            <span className="aseg-kpi-valor">{resumen.vencidas}</span>
            <span className="aseg-kpi-label">Vencidas</span>
          </div>
          <div className="aseg-kpi">
            <span className="aseg-kpi-valor">{resumen.conformes}</span>
            <span className="aseg-kpi-label">Conformes</span>
          </div>
          <div className={`aseg-kpi${resumen.no_conformes > 0 ? ' aseg-kpi-alerta' : ''}`}>
            <span className="aseg-kpi-valor">{resumen.no_conformes}</span>
            <span className="aseg-kpi-label">No conformes</span>
          </div>
          <div className="aseg-kpi">
            <span className="aseg-kpi-valor">{resumen.no_concluyentes}</span>
            <span className="aseg-kpi-label">No concluyentes</span>
          </div>
        </div>
      )}

      <div className="cal-tabs cal-subtabs">
        <button className={`cal-tab ${vista === 'listado' ? 'active' : ''}`} onClick={() => setVista('listado')}>
          Actividades
        </button>
        <button className={`cal-tab ${vista === 'programa' ? 'active' : ''}`} onClick={() => setVista('programa')}>
          Programación
        </button>
      </div>

      <div className="cal-filtros">
        <label>
          Tipo:
          <select value={filtro.tipo} onChange={(e) => setFiltro({ ...filtro, tipo: e.target.value })}>
            <option value="">— Todos —</option>
            {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </label>
        <label>
          Estado:
          <select value={filtro.estado} onChange={(e) => setFiltro({ ...filtro, estado: e.target.value })}>
            <option value="">— Todos —</option>
            {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>
          Resultado:
          <select value={filtro.resultado} onChange={(e) => setFiltro({ ...filtro, resultado: e.target.value })}>
            <option value="">— Todos —</option>
            {Object.entries(RESULTADOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      </div>

      {puedeGestionar && (
        <div className="cal-actions">
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancelar' : '➕ Programar actividad'}
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="card cal-form">
          <h2>Programar actividad de aseguramiento</h2>
          <div className="cal-form-grid">
            <div className="form-group">
              <label>Tipo de actividad: *</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} required>
                {Object.entries(FAMILIAS).map(([fam, famLabel]) => (
                  <optgroup key={fam} label={famLabel}>
                    {Object.entries(TIPOS).filter(([, v]) => v.familia === fam).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Magnitud:</label>
              <input
                type="text"
                value={form.magnitud}
                onChange={(e) => setForm({ ...form, magnitud: e.target.value })}
                placeholder="Ej: Longitud"
              />
            </div>
            <div className="form-group">
              <label>Equipo / patrón:</label>
              <select value={form.equipment_id} onChange={(e) => setForm({ ...form, equipment_id: e.target.value })}>
                <option value="">— No aplica —</option>
                {equipos.map((eq) => <option key={eq.id} value={eq.id}>{eq.codigo} — {eq.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Responsable:</label>
              <select value={form.responsable_id} onChange={(e) => setForm({ ...form, responsable_id: e.target.value })}>
                <option value="">— Sin asignar —</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Alcance de lo que se controla: *</label>
            <textarea
              rows="2"
              value={form.alcance}
              onChange={(e) => setForm({ ...form, alcance: e.target.value })}
              placeholder="Ej: Pie de metro digital 0–150 mm, puntos 25 / 50 / 100 mm"
              required
            />
          </div>

          <h3 className="aseg-subtitulo">Programación</h3>
          <div className="cal-form-grid">
            <div className="form-group">
              <label>Fecha planificada: *</label>
              <input
                type="date"
                value={form.fecha_planificada}
                onChange={(e) => setForm({ ...form, fecha_planificada: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Frecuencia:</label>
              <select value={form.frecuencia} onChange={(e) => setForm({ ...form, frecuencia: e.target.value })}>
                {Object.entries(FRECUENCIAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          <h3 className="aseg-subtitulo">Método para evaluar conformidad</h3>
          <div className="cal-form-grid">
            <div className="form-group">
              <label>Criterio:</label>
              <select
                value={form.criterio}
                onChange={(e) => {
                  const criterio = e.target.value;
                  setForm({
                    ...form,
                    criterio,
                    valor_limite: CRITERIOS[criterio].limite ?? '',
                  });
                }}
              >
                {Object.entries(CRITERIOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <small className="aseg-ayuda">{criterioActual.ayuda}</small>
            </div>
            <div className="form-group">
              <label>Límite de aceptación:</label>
              <input
                type="number"
                step="any"
                value={form.valor_limite}
                onChange={(e) => setForm({ ...form, valor_limite: e.target.value })}
                placeholder={criterioActual.limite !== null ? String(criterioActual.limite) : 'Ej: 0.02'}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Criterio escrito:</label>
            <input
              type="text"
              value={form.criterio_detalle}
              onChange={(e) => setForm({ ...form, criterio_detalle: e.target.value })}
              placeholder="Ej: |En| ≤ 1 según ISO/IEC 17043"
            />
          </div>

          <div className="form-group">
            <label>Observaciones:</label>
            <textarea rows="2" value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
          </div>

          <button type="submit" className="btn-primary">Programar</button>
        </form>
      )}

      {vista === 'listado' && (
        actividades.length === 0 ? (
          <p className="cm-empty">No hay actividades de aseguramiento registradas.</p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Tipo</th>
                  <th>Alcance</th>
                  <th>Planificada</th>
                  <th>Estado</th>
                  <th>Resultado</th>
                  <th>Registros</th>
                </tr>
              </thead>
              <tbody>
                {actividades.map((a) => (
                  <tr key={a.id} className="cal-row" onClick={() => abrirDetalle(a)}>
                    <td><strong>{a.codigo}</strong></td>
                    <td>{TIPOS[a.tipo]?.label || a.tipo}</td>
                    <td>{a.alcance}</td>
                    <td className={estaVencida(a) ? 'cal-fecha-vencida' : ''}>
                      {a.fecha_planificada}
                      {estaVencida(a) && <span className="aseg-vencida"> vencida</span>}
                    </td>
                    <td><span className={`badge badge-aseg-${a.estado}`}>{ESTADOS[a.estado]}</span></td>
                    <td><span className={`badge badge-aseg-${a.resultado}`}>{RESULTADOS[a.resultado]}</span></td>
                    <td>{a.registros?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {vista === 'programa' && (
        programa.length === 0 ? (
          <p className="cm-empty">No hay actividades programadas.</p>
        ) : (
          <div className="aseg-programa">
            {programa.map(([mes, items]) => (
              <div key={mes} className="aseg-mes">
                <h3 className="aseg-mes-titulo">{mes}</h3>
                <div className="aseg-mes-items">
                  {items.map((a) => (
                    <button key={a.id} className={`aseg-item aseg-item-${a.resultado}`} onClick={() => abrirDetalle(a)}>
                      <span className="aseg-item-codigo">{a.codigo}</span>
                      <span className="aseg-item-tipo">{TIPOS[a.tipo]?.label || a.tipo}</span>
                      <span className="aseg-item-fecha">
                        {a.fecha_planificada}
                        {estaVencida(a) && <span className="aseg-vencida"> vencida</span>}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Detalle de la actividad: evaluación, no conformidad y registros. */}
      {selected && (
        <div className="cal-modal-overlay" onClick={() => setSelected(null)}>
          <div className="cal-modal card" onClick={(e) => e.stopPropagation()}>
            <div className="cal-modal-header">
              <h2>{selected.codigo} — {TIPOS[selected.tipo]?.label}</h2>
              <button className="cal-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="cal-detail-grid">
              <p><strong>Alcance:</strong> {selected.alcance}</p>
              <p><strong>Magnitud:</strong> {selected.magnitud || '—'}</p>
              <p><strong>Equipo:</strong> {selected.equipo ? `${selected.equipo.codigo} — ${selected.equipo.nombre}` : '—'}</p>
              <p><strong>Responsable:</strong> {selected.responsable?.nombre || '—'}</p>
              <p><strong>Frecuencia:</strong> {FRECUENCIAS[selected.frecuencia]}</p>
              <p><strong>Planificada:</strong> {selected.fecha_planificada}</p>
              <p><strong>Ejecutada:</strong> {selected.fecha_ejecucion || '—'}</p>
              <p><strong>Estado:</strong> {ESTADOS[selected.estado]}</p>
              <p><strong>Criterio:</strong> {CRITERIOS[selected.criterio]?.label} {selected.criterio_detalle ? `· ${selected.criterio_detalle}` : ''}</p>
              <p><strong>Valor obtenido:</strong> {selected.valor_obtenido ?? '—'}</p>
              <p><strong>Límite:</strong> {selected.valor_limite ?? '—'}</p>
              <p><strong>Resultado:</strong> <span className={`badge badge-aseg-${selected.resultado}`}>{RESULTADOS[selected.resultado]}</span></p>
            </div>

            {selected.evaluacion && (
              <div className="cal-info-list">
                <strong>Evaluación:</strong> {selected.evaluacion}
              </div>
            )}

            {/* §7.7.3: acción cuando el resultado queda fuera de criterio */}
            {selected.resultado === 'no_conforme' && (
              <div className="aseg-nc">
                {selected.no_conformidad ? (
                  <p>
                    No conformidad asociada: <strong>{selected.no_conformidad.codigo}</strong>{' '}
                    ({selected.no_conformidad.estado})
                  </p>
                ) : (
                  <>
                    <p>
                      El resultado quedó fuera del criterio. La norma exige tomar acción (§7.7.3).
                    </p>
                    {puedeGestionar && (
                      <button className="btn-danger" onClick={handleCrearNC}>
                        Levantar no conformidad
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {puedeGestionar && selected.estado !== 'cancelada' && (
              <>
                <div className="cal-section-header"><h3>Registrar resultado</h3></div>
                <form onSubmit={handleEvaluate} className="cal-inline-form">
                  <div className="cal-form-grid">
                    <div className="form-group">
                      <label>Fecha de ejecución:</label>
                      <input
                        type="date"
                        value={formEval.fecha_ejecucion}
                        onChange={(e) => setFormEval({ ...formEval, fecha_ejecucion: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Valor obtenido:</label>
                      <input
                        type="number"
                        step="any"
                        value={formEval.valor_obtenido}
                        onChange={(e) => setFormEval({ ...formEval, valor_obtenido: e.target.value })}
                        placeholder={CRITERIOS[selected.criterio]?.ayuda}
                      />
                    </div>
                    <div className="form-group">
                      <label>Límite:</label>
                      <input
                        type="number"
                        step="any"
                        value={formEval.valor_limite}
                        onChange={(e) => setFormEval({ ...formEval, valor_limite: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Resultado:</label>
                      <select
                        value={formEval.resultado}
                        onChange={(e) => setFormEval({ ...formEval, resultado: e.target.value })}
                      >
                        <option value="conforme">Conforme</option>
                        <option value="no_conforme">No conforme</option>
                        <option value="no_concluyente">No concluyente</option>
                      </select>
                      <small className="aseg-ayuda">
                        Si indicas el valor obtenido, el resultado se calcula solo con el criterio.
                      </small>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Evaluación / análisis de los datos:</label>
                    <textarea
                      rows="2"
                      value={formEval.evaluacion}
                      onChange={(e) => setFormEval({ ...formEval, evaluacion: e.target.value })}
                      placeholder="Conclusión del análisis y acciones asociadas"
                    />
                  </div>
                  <button type="submit" className="btn-primary">Guardar resultado</button>
                </form>
              </>
            )}

            <div className="cal-section-header"><h3>Registros</h3></div>
            {selected.registros?.length > 0 ? (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr><th>Archivo</th><th>Descripción</th><th>Subido por</th><th></th></tr>
                  </thead>
                  <tbody>
                    {selected.registros.map((r) => (
                      <tr key={r.id}>
                        <td>{r.nombre_original}</td>
                        <td>{r.descripcion || '—'}</td>
                        <td>{r.usuario?.nombre || '—'}</td>
                        <td>
                          <div className="cm-doc-acciones">
                            <button className="btn-secondary" onClick={() => handlePreviewRecord(r)}>Ver</button>
                            <button className="btn-secondary" onClick={() => handleDownloadRecord(r)}>Descargar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="cm-empty">Sin registros adjuntos todavía.</p>
            )}

            {puedeGestionar && (
              <form onSubmit={handleUploadRecords} className="cal-inline-form">
                <div className="cal-form-grid">
                  <div className="form-group">
                    <label>Adjuntar registro(s):</label>
                    <input type="file" multiple onChange={(e) => setRecordFiles(e.target.files)} />
                  </div>
                  <div className="form-group">
                    <label>Descripción:</label>
                    <input
                      type="text"
                      value={recordDesc}
                      onChange={(e) => setRecordDesc(e.target.value)}
                      placeholder="Ej: Informe del proveedor del ensayo de aptitud"
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary">Subir registro</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Visor de registros */}
      {visor && (
        <div className="cm-visor-overlay" onClick={cerrarVisor}>
          <div className="cm-visor" onClick={(e) => e.stopPropagation()}>
            <div className="cm-modal-header">
              <h2>{visor.registro.nombre_original}</h2>
              <button className="cm-close" onClick={cerrarVisor}>✕</button>
            </div>
            <div className="cm-visor-cuerpo">
              {visor.cargando && <div className="loader"></div>}
              {!visor.cargando && visor.url && visor.vista === 'pdf' && (
                <iframe title={visor.registro.nombre_original} src={visor.url} className="cm-visor-marco" />
              )}
              {!visor.cargando && visor.url && visor.vista === 'imagen' && (
                <img src={visor.url} alt={visor.registro.nombre_original} className="cm-visor-imagen" />
              )}
              {!visor.cargando && visor.vista === null && (
                <p className="cm-empty">
                  Este tipo de archivo no se puede mostrar en pantalla. Descárgalo para abrirlo.
                </p>
              )}
            </div>
            <div className="cm-visor-pie">
              <button className="btn-secondary" onClick={cerrarVisor}>Cerrar</button>
              <button className="btn-primary" onClick={() => handleDownloadRecord(visor.registro)}>Descargar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AseguramientoPanel;
