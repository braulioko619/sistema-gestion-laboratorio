import React, { useState, useEffect, useCallback } from 'react';
import { internalAuditsAPI, checklistTemplateAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './InternalAudits.css';

const ESTADOS = {
  planificada: 'Planificada',
  en_curso: 'En curso',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

const NORMAS = {
  ISO17025: 'NCh ISO/IEC 17025:2017',
  ISO17020: 'NCh-ISO 17020:2012',
};

const FUENTES = {
  DA_D22: 'DA-D22',
  DA_D23: 'DA-D23',
};

const TIPOS_HALLAZGO = {
  no_conformidad: 'No conformidad',
  observacion: 'Observación',
  oportunidad_mejora: 'Oportunidad de mejora',
};

const EVALUACIONES = [
  { valor: 'C', etiqueta: 'C', titulo: 'Cumple' },
  { valor: 'NC', etiqueta: 'NC', titulo: 'No cumple' },
  { valor: 'OM', etiqueta: 'OM', titulo: 'Oportunidad de mejora' },
  { valor: 'N/A', etiqueta: 'N/A', titulo: 'No aplica' },
];

const FORM_AUDIT_VACIO = {
  norma: 'ISO17025',
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

const FORM_PLANTILLA_VACIO = { tipo: 'item', clausula: '', texto: '' };

// Solo se muestra la etiqueta para directrices complementarias (DA-D22/DA-D23);
// los puntos que vienen directo de la norma base no necesitan distinguirse.
function fuenteEtiqueta(fuente) {
  return FUENTES[fuente] || null;
}

// Agrupa la lista plana del checklist (ordenada) en secciones: cada 'titulo'
// abre una sección y los 'item' siguientes quedan anidados hasta el próximo título.
function agruparPorSeccion(puntos) {
  const secciones = [];
  let actual = null;
  (puntos || []).forEach((p) => {
    if (p.tipo === 'titulo') {
      actual = { titulo: p, items: [] };
      secciones.push(actual);
    } else if (actual) {
      actual.items.push(p);
    } else {
      actual = { titulo: null, items: [p] };
      secciones.push(actual);
    }
  });
  return secciones;
}

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

  const [vista, setVista] = useState('auditorias');
  const [checklistDraft, setChecklistDraft] = useState([]);
  const [checklistFiltro, setChecklistFiltro] = useState('');
  const [guardandoChecklist, setGuardandoChecklist] = useState(false);

  const [plantillaNorma, setPlantillaNorma] = useState('ISO17025');
  const [plantilla, setPlantilla] = useState([]);
  const [showPlantillaForm, setShowPlantillaForm] = useState(false);
  const [formPlantilla, setFormPlantilla] = useState(FORM_PLANTILLA_VACIO);

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

  const fetchPlantilla = useCallback(async () => {
    try {
      const res = await checklistTemplateAPI.list({ norma: plantillaNorma });
      setPlantilla(res.data.data);
    } catch (err) {
      setError('Error al cargar la plantilla del checklist');
    }
  }, [plantillaNorma]);

  useEffect(() => {
    if (vista === 'plantilla') fetchPlantilla();
  }, [vista, fetchPlantilla]);

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
      setChecklistDraft((res.data.data.checklist || []).slice().sort((a, b) => a.orden - b.orden));
      setChecklistFiltro('');
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

  const checklistBloqueado = selected && ['completada', 'cancelada'].includes(selected.estado);

  const actualizarPuntoChecklist = (id, cambios) => {
    setChecklistDraft((prev) => prev.map((p) => (p.id === id ? { ...p, ...cambios } : p)));
  };

  const toggleSeccionChecklist = (items, activo) => {
    const ids = new Set(items.map((i) => i.id));
    setChecklistDraft((prev) => prev.map((p) => (ids.has(p.id) ? { ...p, activo } : p)));
  };

  const toggleTodoElChecklist = (activo) => {
    setChecklistDraft((prev) => prev.map((p) => (p.tipo === 'item' ? { ...p, activo } : p)));
  };

  const handleGuardarChecklist = async () => {
    try {
      setGuardandoChecklist(true);
      const items = checklistDraft
        .filter((p) => p.tipo === 'item')
        .map((p) => ({ id: p.id, activo: p.activo, evaluacion: p.evaluacion, evidencia: p.evidencia || '' }));
      const res = await internalAuditsAPI.updateChecklist(selected.id, { items });
      setSelected(res.data.data);
      setChecklistDraft((res.data.data.checklist || []).slice().sort((a, b) => a.orden - b.orden));
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al guardar el checklist');
    } finally {
      setGuardandoChecklist(false);
    }
  };

  const handleDescargarPdf = async (id, codigo) => {
    try {
      const res = await internalAuditsAPI.downloadPdf(id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${codigo}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Error al descargar el PDF');
    }
  };

  const handleCreatePlantillaItem = async (e) => {
    e.preventDefault();
    try {
      await checklistTemplateAPI.create({ ...formPlantilla, norma: plantillaNorma });
      setFormPlantilla(FORM_PLANTILLA_VACIO);
      setShowPlantillaForm(false);
      fetchPlantilla();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al agregar el punto a la plantilla');
    }
  };

  const handleToggleVigenciaPlantilla = async (item) => {
    try {
      await checklistTemplateAPI.update(item.id, { vigente: !item.vigente });
      fetchPlantilla();
    } catch (err) {
      setError('Error al actualizar el punto de la plantilla');
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
        {vista === 'auditorias' && puedeGestionar && (
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

      <div className="ia-tabs">
        <button className={`ia-tab ${vista === 'auditorias' ? 'active' : ''}`} onClick={() => setVista('auditorias')}>Auditorías</button>
        <button className={`ia-tab ${vista === 'plantilla' ? 'active' : ''}`} onClick={() => setVista('plantilla')}>Plantilla de Checklist</button>
      </div>

      {vista === 'auditorias' && (
      <>
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
              <label>Norma: *</label>
              <select
                value={formAudit.norma}
                onChange={(e) => setFormAudit({ ...formAudit, norma: e.target.value })}
                required
              >
                {Object.entries(NORMAS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
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
                placeholder="Ej: Manual de Calidad v3, POE-01"
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
                <th>Norma</th>
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
                  <td><span className="badge badge-ia-norma">{NORMAS[a.norma] || a.norma}</span></td>
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
      </>
      )}

      {vista === 'plantilla' && (
        <div>
          <p className="ia-nota">
            Estos son los puntos normativos que se copian automáticamente al checklist de cada nueva
            auditoría. Desactivar un punto aquí no afecta auditorías ya creadas.
          </p>
          <div className="ia-tabs ia-subtabs">
            {Object.entries(NORMAS).map(([k, v]) => (
              <button
                key={k}
                className={`ia-tab ${plantillaNorma === k ? 'active' : ''}`}
                onClick={() => setPlantillaNorma(k)}
              >
                {v}
              </button>
            ))}
          </div>
          {puedeGestionar && (
            <div className="ia-actions">
              <button className="btn-primary" onClick={() => setShowPlantillaForm(!showPlantillaForm)}>
                {showPlantillaForm ? '✕ Cancelar' : '➕ Agregar punto'}
              </button>
            </div>
          )}

          {showPlantillaForm && (
            <div className="card ia-form">
              <h2>Agregar punto a la plantilla</h2>
              <form onSubmit={handleCreatePlantillaItem}>
                <div className="ia-form-grid">
                  <div className="form-group">
                    <label>Tipo:</label>
                    <select value={formPlantilla.tipo} onChange={(e) => setFormPlantilla({ ...formPlantilla, tipo: e.target.value })}>
                      <option value="item">Punto evaluable</option>
                      <option value="titulo">Encabezado de sección</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Cláusula:</label>
                    <input type="text" value={formPlantilla.clausula} onChange={(e) => setFormPlantilla({ ...formPlantilla, clausula: e.target.value })} placeholder="Ej: 6.4.9" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Texto: *</label>
                  <textarea value={formPlantilla.texto} onChange={(e) => setFormPlantilla({ ...formPlantilla, texto: e.target.value })} rows="3" required></textarea>
                </div>
                <button type="submit" className="btn-primary">Agregar</button>
              </form>
            </div>
          )}

          {plantilla.length === 0 ? (
            <p>No hay puntos cargados en la plantilla</p>
          ) : (
            <div className="ia-plantilla-list">
              {plantilla.map((p) => (
                <div key={p.id} className={`ia-plantilla-row ${p.tipo === 'titulo' ? 'ia-plantilla-titulo' : ''} ${!p.vigente ? 'ia-plantilla-inactiva' : ''}`}>
                  <span className="ia-plantilla-clausula">
                    {p.clausula || (p.tipo === 'titulo' ? '§' : '—')}
                    {fuenteEtiqueta(p.fuente) && <em className="ia-fuente-tag">{fuenteEtiqueta(p.fuente)}</em>}
                  </span>
                  <span className="ia-plantilla-texto">{p.texto}</span>
                  {puedeGestionar && (
                    <button className="btn-secondary" onClick={() => handleToggleVigenciaPlantilla(p)}>
                      {p.vigente ? 'Desactivar' : 'Reactivar'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selected && (
        <div className="ia-modal-overlay" onClick={() => setSelected(null)}>
          <div className="ia-modal card" onClick={(e) => e.stopPropagation()}>
            <div className="ia-modal-header">
              <h2>{selected.codigo} <span className="badge badge-ia-norma">{NORMAS[selected.norma] || selected.norma}</span></h2>
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

            <div className="ia-actions">
              <button className="btn-secondary" onClick={() => handleDescargarPdf(selected.id, selected.codigo)}>
                📄 Descargar informe (PDF)
              </button>
            </div>

            <div className="ia-section-header">
              <h3>Checklist normativo ({NORMAS[selected.norma] || selected.norma})</h3>
            </div>

            {checklistBloqueado && (
              <p className="ia-nota">Auditoría {selected.estado === 'completada' ? 'completada' : 'cancelada'}: el checklist queda de solo lectura.</p>
            )}

            {checklistDraft.length === 0 ? (
              <p>Esta auditoría no tiene checklist asociado.</p>
            ) : (
              <>
                <div className="ia-checklist-toolbar">
                  <input
                    type="text"
                    placeholder="Filtrar por cláusula o texto..."
                    value={checklistFiltro}
                    onChange={(e) => setChecklistFiltro(e.target.value)}
                  />
                  <span className="ia-checklist-progreso">
                    {checklistDraft.filter((p) => p.tipo === 'item' && p.activo).length} activos de{' '}
                    {checklistDraft.filter((p) => p.tipo === 'item').length} ·{' '}
                    {checklistDraft.filter((p) => p.tipo === 'item' && p.activo && p.evaluacion).length} evaluados
                  </span>
                  {!checklistBloqueado && (
                    <div className="ia-checklist-bulk">
                      <button type="button" className="ia-link-btn" onClick={() => toggleTodoElChecklist(true)}>Activar todos</button>
                      <button type="button" className="ia-link-btn" onClick={() => toggleTodoElChecklist(false)}>Desactivar todos</button>
                    </div>
                  )}
                </div>

                <div className="ia-checklist-list">
                  {agruparPorSeccion(checklistDraft).map((seccion, si) => {
                    const filtro = checklistFiltro.trim().toLowerCase();
                    const itemsFiltrados = filtro
                      ? seccion.items.filter(
                          (it) =>
                            it.texto.toLowerCase().includes(filtro) ||
                            (it.clausula || '').toLowerCase().includes(filtro)
                        )
                      : seccion.items;
                    const tituloCoincide = seccion.titulo && seccion.titulo.texto.toLowerCase().includes(filtro);
                    if (filtro && itemsFiltrados.length === 0 && !tituloCoincide) return null;

                    return (
                      <div key={seccion.titulo?.id || `s-${si}`} className="ia-checklist-seccion">
                        {seccion.titulo && (
                          <div className="ia-checklist-titulo">
                            <span>{seccion.titulo.texto}</span>
                            {!checklistBloqueado && (
                              <span className="ia-checklist-seccion-bulk">
                                <button type="button" className="ia-link-btn" onClick={() => toggleSeccionChecklist(seccion.items, true)}>Todos</button>
                                <button type="button" className="ia-link-btn" onClick={() => toggleSeccionChecklist(seccion.items, false)}>Ninguno</button>
                              </span>
                            )}
                          </div>
                        )}
                        {(filtro ? itemsFiltrados : seccion.items).map((item) => (
                          <div key={item.id} className={`ia-checklist-item ${!item.activo ? 'ia-checklist-item-inactivo' : ''}`}>
                            <label className="ia-checklist-activo">
                              <input
                                type="checkbox"
                                checked={!!item.activo}
                                disabled={checklistBloqueado}
                                onChange={(e) => actualizarPuntoChecklist(item.id, { activo: e.target.checked })}
                              />
                              Aplica
                            </label>
                            <div className="ia-checklist-texto">
                              {(item.clausula || fuenteEtiqueta(item.fuente)) && (
                                <span>
                                  {item.clausula && <span className="ia-checklist-clausula">{item.clausula}</span>}
                                  {fuenteEtiqueta(item.fuente) && <em className="ia-fuente-tag">{fuenteEtiqueta(item.fuente)}</em>}
                                </span>
                              )}
                              <span>{item.texto}</span>
                              {item.activo && (
                                <input
                                  type="text"
                                  className="ia-checklist-evidencia"
                                  placeholder="Evidencia / observación..."
                                  value={item.evidencia || ''}
                                  disabled={checklistBloqueado}
                                  onChange={(e) => actualizarPuntoChecklist(item.id, { evidencia: e.target.value })}
                                />
                              )}
                            </div>
                            <div className="ia-checklist-eval">
                              {EVALUACIONES.map((ev) => (
                                <button
                                  type="button"
                                  key={ev.valor}
                                  title={ev.titulo}
                                  disabled={!item.activo || checklistBloqueado}
                                  className={`ia-eval-btn ia-eval-${ev.valor.replace('/', '')} ${item.evaluacion === ev.valor ? 'active' : ''}`}
                                  onClick={() =>
                                    actualizarPuntoChecklist(item.id, {
                                      evaluacion: item.evaluacion === ev.valor ? null : ev.valor,
                                    })
                                  }
                                >
                                  {ev.etiqueta}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>

                {!checklistBloqueado && puedeGestionar && (
                  <div className="ia-actions">
                    <button className="btn-primary" onClick={handleGuardarChecklist} disabled={guardandoChecklist}>
                      {guardandoChecklist ? 'Guardando...' : '💾 Guardar checklist'}
                    </button>
                  </div>
                )}
              </>
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
