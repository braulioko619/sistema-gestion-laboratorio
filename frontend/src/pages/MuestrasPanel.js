import React, { useState, useEffect, useCallback } from 'react';
import { samplesAPI, clientInstrumentsAPI, workOrdersAPI } from '../services/api';
import './Calibraciones.css';

const ESTADOS_MUESTRA = {
  pendiente: 'Pendiente',
  asignada: 'Asignada',
  rechazada: 'Rechazada',
};

const FORM_MUESTRA_VACIO = {
  cliente_id: '',
  instrumento_cliente_id: '',
  tipo_instrumento: '',
  marca: '',
  modelo: '',
  numero_serie: '',
  condicion_recepcion: '',
  observaciones: '',
  fecha_recepcion: new Date().toISOString().split('T')[0],
};

const FORM_NUEVA_OT_VACIO = {
  fecha_ingreso: new Date().toISOString().split('T')[0],
  fecha_compromiso: '',
  responsable_id: '',
  observaciones: '',
};

// Recepción de muestras: registra lo que llega físicamente al laboratorio con
// un número único e irrepetible (antes de que exista una OT formal), y
// permite asignarlo después a una orden de trabajo existente o crear una
// nueva OT a partir de la muestra.
function MuestrasPanel({ clientes, users, puedeGestionar, onOrdenAsignada, onVerOrdenTrabajo, clienteInicial }) {
  const [muestras, setMuestras] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState({ estado: '', cliente_id: '' });

  const [showForm, setShowForm] = useState(false);
  const [formMuestra, setFormMuestra] = useState(FORM_MUESTRA_VACIO);
  const [instrumentosCliente, setInstrumentosCliente] = useState([]);

  const [detalle, setDetalle] = useState(null);
  const [ordenesCliente, setOrdenesCliente] = useState([]);
  const [otSeleccionada, setOtSeleccionada] = useState('');
  const [showCrearOT, setShowCrearOT] = useState(false);
  const [formNuevaOT, setFormNuevaOT] = useState(FORM_NUEVA_OT_VACIO);

  const fetchMuestras = useCallback(async (filtros) => {
    try {
      setLoading(true);
      const f = filtros || filtro;
      const params = {};
      if (f.estado) params.estado = f.estado;
      if (f.cliente_id) params.cliente_id = f.cliente_id;
      const res = await samplesAPI.list(params);
      setMuestras(res.data.data);
    } catch (err) {
      setError('Error al cargar las muestras');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro]);

  useEffect(() => {
    fetchMuestras(filtro);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiltroChange = (campo, valor) => {
    const nuevo = { ...filtro, [campo]: valor };
    setFiltro(nuevo);
    fetchMuestras(nuevo);
  };

  const handleClienteFormChange = async (clienteId) => {
    setFormMuestra({ ...formMuestra, cliente_id: clienteId, instrumento_cliente_id: '' });
    if (!clienteId) { setInstrumentosCliente([]); return; }
    try {
      const res = await clientInstrumentsAPI.list(clienteId);
      setInstrumentosCliente(res.data.data);
    } catch (err) {
      setInstrumentosCliente([]);
    }
  };

  const handleInstrumentoFormChange = (instrumentoId) => {
    const inst = instrumentosCliente.find((i) => i.id === instrumentoId);
    setFormMuestra((prev) => ({
      ...prev,
      instrumento_cliente_id: instrumentoId,
      tipo_instrumento: inst ? inst.tipo_instrumento : prev.tipo_instrumento,
      marca: inst ? (inst.marca || '') : prev.marca,
      modelo: inst ? (inst.modelo || '') : prev.modelo,
      numero_serie: inst ? (inst.numero_serie || '') : prev.numero_serie,
    }));
  };

  const resetForm = () => {
    setFormMuestra(FORM_MUESTRA_VACIO);
    setInstrumentosCliente([]);
    setShowForm(false);
  };

  // Llega desde "Instrumentos" con el cliente ya elegido allí, para no
  // obligar a re-seleccionarlo al venir a registrar la recepción.
  useEffect(() => {
    if (clienteInicial) {
      setShowForm(true);
      handleClienteFormChange(clienteInicial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteInicial]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formMuestra };
      Object.keys(payload).forEach((k) => { if (payload[k] === '') delete payload[k]; });
      const res = await samplesAPI.create(payload);
      alert(res.data.message);
      resetForm();
      fetchMuestras(filtro);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al registrar la muestra');
    }
  };

  const abrirDetalle = async (muestra) => {
    setDetalle(muestra);
    setOtSeleccionada('');
    setShowCrearOT(false);
    setFormNuevaOT(FORM_NUEVA_OT_VACIO);
    if (muestra.estado === 'pendiente') {
      try {
        const res = await workOrdersAPI.list({ cliente_id: muestra.cliente_id, limit: 100 });
        setOrdenesCliente(res.data.data.filter((ot) => !['entregada', 'cancelada'].includes(ot.estado)));
      } catch (err) {
        setOrdenesCliente([]);
      }
    }
  };

  const cerrarDetalle = () => {
    setDetalle(null);
    setOrdenesCliente([]);
  };

  const handleAsignarOT = async (e) => {
    e.preventDefault();
    if (!otSeleccionada) return;
    try {
      const res = await samplesAPI.assign(detalle.id, otSeleccionada);
      alert(res.data.message);
      cerrarDetalle();
      fetchMuestras(filtro);
      if (onOrdenAsignada) onOrdenAsignada();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al asignar la muestra a la orden de trabajo');
    }
  };

  const handleCrearOTDesdeMuestra = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formNuevaOT };
      Object.keys(payload).forEach((k) => { if (payload[k] === '') delete payload[k]; });
      const res = await samplesAPI.createWorkOrder(detalle.id, payload);
      alert(res.data.message);
      cerrarDetalle();
      fetchMuestras(filtro);
      if (onOrdenAsignada) onOrdenAsignada();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al crear la orden de trabajo desde la muestra');
    }
  };

  const handleRechazar = async () => {
    if (!window.confirm('¿Rechazar esta muestra? No podrá asignarse a una orden de trabajo.')) return;
    try {
      await samplesAPI.update(detalle.id, { estado: 'rechazada' });
      cerrarDetalle();
      fetchMuestras(filtro);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al rechazar la muestra');
    }
  };

  if (loading && muestras.length === 0) {
    return <div className="loader"></div>;
  }

  return (
    <div>
      {error && (
        <div className="alert alert-danger" onClick={() => setError(null)}>{error}</div>
      )}

      <p className="cal-nota">
        Registra aquí cada muestra apenas llega al laboratorio para obtener un número único de recepción.
        Después, asígnala a una orden de trabajo existente o crea una nueva OT desde la muestra.
      </p>

      <div className="cal-filtros">
        <div className="form-group">
          <label>Cliente:</label>
          <select value={filtro.cliente_id} onChange={(e) => handleFiltroChange('cliente_id', e.target.value)}>
            <option value="">— Todos —</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Estado:</label>
          <select value={filtro.estado} onChange={(e) => handleFiltroChange('estado', e.target.value)}>
            <option value="">— Todos —</option>
            {Object.entries(ESTADOS_MUESTRA).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {puedeGestionar && (
        <div className="cal-actions">
          <button onClick={() => (showForm ? resetForm() : setShowForm(true))} className="btn-primary">
            {showForm ? '✕ Cancelar' : '➕ Registrar Muestra'}
          </button>
        </div>
      )}

      {showForm && (
        <div className="card cal-form">
          <h2>Registrar Muestra Recibida</h2>
          <form onSubmit={handleSubmit}>
            <div className="cal-form-grid">
              <div className="form-group">
                <label>Cliente: *</label>
                <select value={formMuestra.cliente_id} onChange={(e) => handleClienteFormChange(e.target.value)} required>
                  <option value="">— Selecciona un cliente —</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Instrumento ya registrado (opcional):</label>
                <select value={formMuestra.instrumento_cliente_id} onChange={(e) => handleInstrumentoFormChange(e.target.value)}>
                  <option value="">— Manual / nuevo —</option>
                  {instrumentosCliente.map((inst) => (
                    <option key={inst.id} value={inst.id}>{inst.codigo_interno} — {inst.tipo_instrumento}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Tipo de instrumento: *</label>
                <input type="text" value={formMuestra.tipo_instrumento} onChange={(e) => setFormMuestra({ ...formMuestra, tipo_instrumento: e.target.value })} placeholder="Ej: Manómetro" required />
              </div>
              <div className="form-group">
                <label>Marca:</label>
                <input type="text" value={formMuestra.marca} onChange={(e) => setFormMuestra({ ...formMuestra, marca: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Modelo:</label>
                <input type="text" value={formMuestra.modelo} onChange={(e) => setFormMuestra({ ...formMuestra, modelo: e.target.value })} />
              </div>
              <div className="form-group">
                <label>N° de serie:</label>
                <input type="text" value={formMuestra.numero_serie} onChange={(e) => setFormMuestra({ ...formMuestra, numero_serie: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Fecha de recepción: *</label>
                <input type="date" value={formMuestra.fecha_recepcion} onChange={(e) => setFormMuestra({ ...formMuestra, fecha_recepcion: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label>Condición de recepción:</label>
              <textarea value={formMuestra.condicion_recepcion} onChange={(e) => setFormMuestra({ ...formMuestra, condicion_recepcion: e.target.value })} rows="2" placeholder="Ej: Golpe leve en carcasa, sin certificado previo adjunto"></textarea>
            </div>
            <div className="form-group">
              <label>Observaciones:</label>
              <textarea value={formMuestra.observaciones} onChange={(e) => setFormMuestra({ ...formMuestra, observaciones: e.target.value })} rows="2"></textarea>
            </div>
            <button type="submit" className="btn-primary">Registrar</button>
          </form>
        </div>
      )}

      {muestras.length === 0 ? (
        <p>No hay muestras registradas</p>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>N° Muestra</th>
                <th>Cliente</th>
                <th>Instrumento</th>
                <th>Fecha recepción</th>
                <th>Estado</th>
                <th>OT asignada</th>
              </tr>
            </thead>
            <tbody>
              {muestras.map((m) => (
                <tr key={m.id} className="cal-row" onClick={() => abrirDetalle(m)}>
                  <td><strong>{m.numero_muestra}</strong></td>
                  <td>{m.cliente?.nombre || '—'}</td>
                  <td>{m.tipo_instrumento} {m.marca ? `(${m.marca})` : ''}</td>
                  <td>{m.fecha_recepcion}</td>
                  <td><span className={`badge badge-muestra-${m.estado}`}>{ESTADOS_MUESTRA[m.estado]}</span></td>
                  <td>{m.ordenTrabajo?.codigo || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detalle && (
        <div className="cal-modal-overlay" onClick={cerrarDetalle}>
          <div className="cal-modal card" onClick={(e) => e.stopPropagation()}>
            <div className="cal-modal-header">
              <h2>{detalle.numero_muestra}</h2>
              <button className="cal-close" onClick={cerrarDetalle}>✕</button>
            </div>

            <div className="cal-detail-grid">
              <p><strong>Cliente:</strong> {detalle.cliente?.nombre}</p>
              <p><strong>Instrumento:</strong> {detalle.tipo_instrumento} {detalle.marca || ''} {detalle.modelo || ''}</p>
              <p><strong>N° de serie:</strong> {detalle.numero_serie || '—'}</p>
              <p><strong>Fecha de recepción:</strong> {detalle.fecha_recepcion}</p>
              <p><strong>Estado:</strong> <span className={`badge badge-muestra-${detalle.estado}`}>{ESTADOS_MUESTRA[detalle.estado]}</span></p>
              {detalle.condicion_recepcion && <p><strong>Condición de recepción:</strong> {detalle.condicion_recepcion}</p>}
              {detalle.observaciones && <p><strong>Observaciones:</strong> {detalle.observaciones}</p>}
              {detalle.ordenTrabajo && (
                <p>
                  <strong>OT asignada:</strong>{' '}
                  <button type="button" className="cal-link-btn" onClick={() => onVerOrdenTrabajo && onVerOrdenTrabajo(detalle.ordenTrabajo.id)}>
                    {detalle.ordenTrabajo.codigo}
                  </button>
                </p>
              )}
            </div>

            {puedeGestionar && detalle.estado === 'pendiente' && (
              <>
                <div className="cal-section-header">
                  <h3>Asignar a orden de trabajo existente</h3>
                </div>
                {ordenesCliente.length === 0 ? (
                  <p>Este cliente no tiene órdenes de trabajo abiertas todavía.</p>
                ) : (
                  <form onSubmit={handleAsignarOT} className="cal-inline-form">
                    <select value={otSeleccionada} onChange={(e) => setOtSeleccionada(e.target.value)} required>
                      <option value="">— Selecciona una OT —</option>
                      {ordenesCliente.map((ot) => (
                        <option key={ot.id} value={ot.id}>{ot.codigo}</option>
                      ))}
                    </select>
                    <button type="submit" className="btn-primary" disabled={!otSeleccionada}>Asignar</button>
                  </form>
                )}

                <div className="cal-section-header">
                  <h3>O crear una nueva OT desde esta muestra</h3>
                  <button type="button" className="btn-secondary" onClick={() => setShowCrearOT(!showCrearOT)}>
                    {showCrearOT ? '✕ Cancelar' : '➕ Nueva OT'}
                  </button>
                </div>
                {showCrearOT && (
                  <form onSubmit={handleCrearOTDesdeMuestra}>
                    <div className="cal-form-grid">
                      <div className="form-group">
                        <label>Fecha de ingreso: *</label>
                        <input type="date" value={formNuevaOT.fecha_ingreso} onChange={(e) => setFormNuevaOT({ ...formNuevaOT, fecha_ingreso: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label>Fecha compromiso:</label>
                        <input type="date" value={formNuevaOT.fecha_compromiso} onChange={(e) => setFormNuevaOT({ ...formNuevaOT, fecha_compromiso: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>Responsable:</label>
                        <select value={formNuevaOT.responsable_id} onChange={(e) => setFormNuevaOT({ ...formNuevaOT, responsable_id: e.target.value })}>
                          <option value="">— Sin asignar —</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>{u.nombre}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Observaciones:</label>
                      <textarea value={formNuevaOT.observaciones} onChange={(e) => setFormNuevaOT({ ...formNuevaOT, observaciones: e.target.value })} rows="2"></textarea>
                    </div>
                    <button type="submit" className="btn-primary">Crear OT</button>
                  </form>
                )}

                <div className="cal-actions">
                  <button className="btn-secondary" onClick={handleRechazar}>Rechazar muestra</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MuestrasPanel;
