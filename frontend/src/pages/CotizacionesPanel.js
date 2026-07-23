import React, { useState, useEffect, useCallback } from 'react';
import { quotesAPI, priceListAPI, clientInstrumentsAPI } from '../services/api';
import './Calibraciones.css';

const ESTADOS_COTIZACION = {
  borrador: 'Borrador',
  emitida: 'Emitida',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  anulada: 'Anulada',
};

const ACCIONES_HISTORIAL = {
  crear: 'Creación',
  actualizar: 'Actualización',
  publicar: 'Emisión',
  descargar: 'Descarga de PDF',
};

const ITEM_VACIO = {
  instrumento_cliente_id: '',
  tarifa_id: '',
  descripcion: '',
  tipo_instrumento: '',
  protocolo: '',
  cantidad: 1,
  precio_unitario: '',
};

const FORM_COTIZACION_VACIO = {
  cliente_id: '',
  validez_dias: 30,
  descuento_porcentaje: 0,
  iva_porcentaje: 19,
  condiciones: '',
  notas: '',
};

const FORM_TARIFA_VACIO = { tipo_instrumento: '', protocolo: '', rango_aplicable: '', precio: '', moneda: 'CLP' };

function money(value, moneda) {
  return `${moneda || 'CLP'} ${Number(value || 0).toLocaleString('es-CL')}`;
}

// Nota: este panel se integra como una pestaña dentro de Calibraciones.js
// (<CotizacionesPanel clientes={clientes} puedeGestionar={puedeGestionar} />).
function CotizacionesPanel({ clientes, puedeGestionar }) {
  const [vista, setVista] = useState('cotizaciones');
  const [error, setError] = useState(null);

  const [cotizaciones, setCotizaciones] = useState([]);
  const [tarifario, setTarifario] = useState([]);
  const [filtro, setFiltro] = useState({ cliente_id: '', estado: '' });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formCotizacion, setFormCotizacion] = useState(FORM_COTIZACION_VACIO);
  const [items, setItems] = useState([{ ...ITEM_VACIO }]);
  const [instrumentosCliente, setInstrumentosCliente] = useState([]);

  const [detalle, setDetalle] = useState(null);
  const [historial, setHistorial] = useState([]);

  const [showTarifaForm, setShowTarifaForm] = useState(false);
  const [formTarifa, setFormTarifa] = useState(FORM_TARIFA_VACIO);

  const fetchCotizaciones = useCallback(async (filtros) => {
    try {
      const f = filtros || filtro;
      const params = {};
      if (f.cliente_id) params.cliente_id = f.cliente_id;
      if (f.estado) params.estado = f.estado;
      const res = await quotesAPI.list(params);
      setCotizaciones(res.data.data);
    } catch (err) {
      setError('Error al cargar las cotizaciones');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro]);

  const fetchTarifario = useCallback(async () => {
    try {
      const res = await priceListAPI.list();
      setTarifario(res.data.data);
    } catch (err) {
      setError('Error al cargar el tarifario');
    }
  }, []);

  useEffect(() => {
    fetchCotizaciones(filtro);
    fetchTarifario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiltroChange = (campo, valor) => {
    const nuevo = { ...filtro, [campo]: valor };
    setFiltro(nuevo);
    fetchCotizaciones(nuevo);
  };

  const cargarInstrumentosDeCliente = async (clienteId) => {
    if (!clienteId) { setInstrumentosCliente([]); return; }
    try {
      const res = await clientInstrumentsAPI.list(clienteId);
      setInstrumentosCliente(res.data.data);
    } catch (err) {
      setInstrumentosCliente([]);
    }
  };

  const resetForm = () => {
    setFormCotizacion(FORM_COTIZACION_VACIO);
    setItems([{ ...ITEM_VACIO }]);
    setInstrumentosCliente([]);
    setEditingId(null);
    setShowForm(false);
  };

  const handleClienteChange = (clienteId) => {
    setFormCotizacion({ ...formCotizacion, cliente_id: clienteId });
    cargarInstrumentosDeCliente(clienteId);
  };

  const handleItemChange = (idx, campo, valor) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [campo]: valor } : it)));
  };

  const handleTarifaSeleccionada = (idx, tarifaId) => {
    const tarifa = tarifario.find((t) => t.id === tarifaId);
    setItems((prev) => prev.map((it, i) => {
      if (i !== idx) return it;
      if (!tarifa) return { ...it, tarifa_id: '' };
      return {
        ...it,
        tarifa_id: tarifaId,
        tipo_instrumento: tarifa.tipo_instrumento,
        protocolo: tarifa.protocolo,
        precio_unitario: tarifa.precio,
        descripcion: it.descripcion || tarifa.tipo_instrumento,
      };
    }));
  };

  const handleInstrumentoSeleccionado = (idx, instrumentoId) => {
    const inst = instrumentosCliente.find((i) => i.id === instrumentoId);
    setItems((prev) => prev.map((it, i) => {
      if (i !== idx) return it;
      if (!inst) return { ...it, instrumento_cliente_id: '' };
      const tarifaSugerida = tarifario.find((t) => t.vigente && t.tipo_instrumento === inst.tipo_instrumento);
      return {
        ...it,
        instrumento_cliente_id: instrumentoId,
        tipo_instrumento: inst.tipo_instrumento,
        descripcion: `${inst.tipo_instrumento} ${inst.marca || ''} ${inst.modelo || ''}`.trim(),
        tarifa_id: tarifaSugerida ? tarifaSugerida.id : it.tarifa_id,
        protocolo: tarifaSugerida ? tarifaSugerida.protocolo : it.protocolo,
        precio_unitario: tarifaSugerida ? tarifaSugerida.precio : it.precio_unitario,
      };
    }));
  };

  const addItem = () => setItems((prev) => [...prev, { ...ITEM_VACIO }]);
  const removeItem = (idx) => setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const totalesPreview = () => {
    const subtotal = items.reduce((sum, it) => sum + (Number(it.cantidad) || 0) * (Number(it.precio_unitario) || 0), 0);
    const descuentoMonto = (subtotal * (Number(formCotizacion.descuento_porcentaje) || 0)) / 100;
    const base = subtotal - descuentoMonto;
    const ivaMonto = (base * (Number(formCotizacion.iva_porcentaje) || 0)) / 100;
    return { subtotal, descuentoMonto, ivaMonto, total: base + ivaMonto };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formCotizacion, items };
      const res = editingId ? await quotesAPI.update(editingId, payload) : await quotesAPI.create(payload);
      alert(res.data.message);
      const idAbierto = editingId;
      resetForm();
      fetchCotizaciones(filtro);
      if (detalle && idAbierto === detalle.id) abrirDetalle(idAbierto);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al guardar la cotización');
    }
  };

  const abrirDetalle = async (id) => {
    try {
      const res = await quotesAPI.get(id);
      setDetalle(res.data.data);
      const hist = await quotesAPI.history(id);
      setHistorial(hist.data.data);
    } catch (err) {
      setError('Error al cargar el detalle de la cotización');
    }
  };

  const cerrarDetalle = () => { setDetalle(null); setHistorial([]); };

  const iniciarEdicion = (cot) => {
    setFormCotizacion({
      cliente_id: cot.cliente_id,
      validez_dias: cot.validez_dias,
      descuento_porcentaje: cot.descuento_porcentaje,
      iva_porcentaje: cot.iva_porcentaje,
      condiciones: cot.condiciones || '',
      notas: cot.notas || '',
    });
    setItems(cot.items.map((it) => ({
      instrumento_cliente_id: it.instrumento_cliente_id || '',
      tarifa_id: it.tarifa_id || '',
      descripcion: it.descripcion,
      tipo_instrumento: it.tipo_instrumento,
      protocolo: it.protocolo,
      cantidad: it.cantidad,
      precio_unitario: it.precio_unitario,
    })));
    cargarInstrumentosDeCliente(cot.cliente_id);
    setEditingId(cot.id);
    setShowForm(true);
    cerrarDetalle();
  };

  const handleCambiarEstado = async (id, estado) => {
    try {
      await quotesAPI.updateEstado(id, { estado });
      fetchCotizaciones(filtro);
      abrirDetalle(id);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al cambiar el estado');
    }
  };

  const handleDescargarPdf = async (id, codigo) => {
    try {
      const res = await quotesAPI.downloadPdf(id);
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

  const handleCreateTarifa = async (e) => {
    e.preventDefault();
    try {
      await priceListAPI.create(formTarifa);
      setFormTarifa(FORM_TARIFA_VACIO);
      setShowTarifaForm(false);
      fetchTarifario();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al registrar la tarifa');
    }
  };

  const handleToggleVigenciaTarifa = async (tarifa) => {
    try {
      await priceListAPI.update(tarifa.id, { vigente: !tarifa.vigente });
      fetchTarifario();
    } catch (err) {
      setError('Error al actualizar la tarifa');
    }
  };

  const totales = totalesPreview();

  return (
    <div>
      {error && (
        <div className="alert alert-danger" onClick={() => setError(null)}>
          {error}
        </div>
      )}

      <div className="cal-tabs cal-subtabs">
        <button className={`cal-tab ${vista === 'cotizaciones' ? 'active' : ''}`} onClick={() => setVista('cotizaciones')}>Cotizaciones</button>
        <button className={`cal-tab ${vista === 'tarifario' ? 'active' : ''}`} onClick={() => setVista('tarifario')}>Tarifario</button>
      </div>

      {vista === 'cotizaciones' && (
        <div>
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
                {Object.entries(ESTADOS_COTIZACION).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {puedeGestionar && (
            <div className="cal-actions">
              <button onClick={() => (showForm ? resetForm() : setShowForm(true))} className="btn-primary">
                {showForm ? '✕ Cancelar' : '➕ Nueva Cotización'}
              </button>
            </div>
          )}

          {showForm && (
            <div className="card cal-form">
              <h2>{editingId ? 'Editar Cotización' : 'Registrar Cotización'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="cal-form-grid">
                  <div className="form-group">
                    <label>Cliente: *</label>
                    <select value={formCotizacion.cliente_id} onChange={(e) => handleClienteChange(e.target.value)} required disabled={!!editingId}>
                      <option value="">— Selecciona un cliente —</option>
                      {clientes.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Validez (días):</label>
                    <input type="number" min="1" value={formCotizacion.validez_dias} onChange={(e) => setFormCotizacion({ ...formCotizacion, validez_dias: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Descuento (%):</label>
                    <input type="number" min="0" max="100" step="0.01" value={formCotizacion.descuento_porcentaje} onChange={(e) => setFormCotizacion({ ...formCotizacion, descuento_porcentaje: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>IVA (%):</label>
                    <input type="number" min="0" max="100" step="0.01" value={formCotizacion.iva_porcentaje} onChange={(e) => setFormCotizacion({ ...formCotizacion, iva_porcentaje: e.target.value })} />
                  </div>
                </div>

                <h3>Ítems a cotizar</h3>
                {items.map((item, idx) => (
                  <div className="cot-item-row" key={idx}>
                    <div className="form-group">
                      <label>Instrumento del cliente</label>
                      <select value={item.instrumento_cliente_id} onChange={(e) => handleInstrumentoSeleccionado(idx, e.target.value)}>
                        <option value="">— Manual / nuevo —</option>
                        {instrumentosCliente.map((inst) => (
                          <option key={inst.id} value={inst.id}>{inst.codigo_interno} — {inst.tipo_instrumento}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Tarifa</label>
                      <select value={item.tarifa_id} onChange={(e) => handleTarifaSeleccionada(idx, e.target.value)}>
                        <option value="">— Ninguna / manual —</option>
                        {tarifario.filter((t) => t.vigente).map((t) => (
                          <option key={t.id} value={t.id}>{t.tipo_instrumento} — {t.protocolo} — {money(t.precio, t.moneda)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Descripción</label>
                      <input type="text" value={item.descripcion} onChange={(e) => handleItemChange(idx, 'descripcion', e.target.value)} placeholder="Ej: Manómetro digital 0-100 psi" />
                    </div>
                    <div className="form-group">
                      <label>Tipo de instrumento *</label>
                      <input type="text" value={item.tipo_instrumento} onChange={(e) => handleItemChange(idx, 'tipo_instrumento', e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Protocolo *</label>
                      <input type="text" value={item.protocolo} onChange={(e) => handleItemChange(idx, 'protocolo', e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Cantidad *</label>
                      <input type="number" min="1" value={item.cantidad} onChange={(e) => handleItemChange(idx, 'cantidad', e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Precio unitario *</label>
                      <input type="number" min="0" step="0.01" value={item.precio_unitario} onChange={(e) => handleItemChange(idx, 'precio_unitario', e.target.value)} required />
                    </div>
                    <div className="cot-item-subtotal">
                      {money((Number(item.cantidad) || 0) * (Number(item.precio_unitario) || 0))}
                    </div>
                    {items.length > 1 && (
                      <button type="button" className="cal-link-btn" onClick={() => removeItem(idx)}>Quitar</button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn-secondary" onClick={addItem}>➕ Agregar ítem</button>

                <div className="cot-totales-preview">
                  <p>Subtotal: <strong>{money(totales.subtotal)}</strong></p>
                  {Number(formCotizacion.descuento_porcentaje) > 0 && <p>Descuento: <strong>- {money(totales.descuentoMonto)}</strong></p>}
                  <p>IVA: <strong>{money(totales.ivaMonto)}</strong></p>
                  <p className="cot-total-final">Total: <strong>{money(totales.total)}</strong></p>
                </div>

                <div className="form-group">
                  <label>Condiciones (forma de pago, plazo de entrega, etc.):</label>
                  <textarea value={formCotizacion.condiciones} onChange={(e) => setFormCotizacion({ ...formCotizacion, condiciones: e.target.value })} rows="2"></textarea>
                </div>
                <div className="form-group">
                  <label>Notas internas:</label>
                  <textarea value={formCotizacion.notas} onChange={(e) => setFormCotizacion({ ...formCotizacion, notas: e.target.value })} rows="2"></textarea>
                </div>

                <button type="submit" className="btn-primary">{editingId ? 'Guardar cambios' : 'Registrar'}</button>
              </form>
            </div>
          )}

          {cotizaciones.length === 0 ? (
            <p>No hay cotizaciones registradas</p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Cliente</th>
                    <th>Fecha emisión</th>
                    <th>Total</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {cotizaciones.map((cot) => (
                    <tr key={cot.id} className="cal-row" onClick={() => abrirDetalle(cot.id)}>
                      <td><strong>{cot.codigo}</strong></td>
                      <td>{cot.cliente?.nombre || '—'}</td>
                      <td>{cot.fecha_emision || '—'}</td>
                      <td>{money(cot.total, cot.moneda)}</td>
                      <td><span className={`badge badge-cot-${cot.estado}`}>{ESTADOS_COTIZACION[cot.estado]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {vista === 'tarifario' && (
        <div>
          {puedeGestionar && (
            <div className="cal-actions">
              <button onClick={() => setShowTarifaForm(!showTarifaForm)} className="btn-primary">
                {showTarifaForm ? '✕ Cancelar' : '➕ Nueva Tarifa'}
              </button>
            </div>
          )}

          {showTarifaForm && (
            <div className="card cal-form">
              <h2>Registrar Tarifa</h2>
              <form onSubmit={handleCreateTarifa}>
                <div className="cal-form-grid">
                  <div className="form-group">
                    <label>Tipo de instrumento: *</label>
                    <input type="text" value={formTarifa.tipo_instrumento} onChange={(e) => setFormTarifa({ ...formTarifa, tipo_instrumento: e.target.value })} placeholder="Ej: Manómetro" required />
                  </div>
                  <div className="form-group">
                    <label>Protocolo: *</label>
                    <input type="text" value={formTarifa.protocolo} onChange={(e) => setFormTarifa({ ...formTarifa, protocolo: e.target.value })} placeholder="Ej: PC-05 Presión" required />
                  </div>
                  <div className="form-group">
                    <label>Rango aplicable:</label>
                    <input type="text" value={formTarifa.rango_aplicable} onChange={(e) => setFormTarifa({ ...formTarifa, rango_aplicable: e.target.value })} placeholder="Ej: 0-100 psi" />
                  </div>
                  <div className="form-group">
                    <label>Precio: *</label>
                    <input type="number" min="0" step="0.01" value={formTarifa.precio} onChange={(e) => setFormTarifa({ ...formTarifa, precio: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Moneda:</label>
                    <input type="text" value={formTarifa.moneda} onChange={(e) => setFormTarifa({ ...formTarifa, moneda: e.target.value })} />
                  </div>
                </div>
                <button type="submit" className="btn-primary">Registrar</button>
              </form>
            </div>
          )}

          {tarifario.length === 0 ? (
            <p>No hay tarifas registradas</p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Tipo de instrumento</th>
                    <th>Protocolo</th>
                    <th>Rango aplicable</th>
                    <th>Precio</th>
                    <th>Vigente</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tarifario.map((t) => (
                    <tr key={t.id}>
                      <td><strong>{t.tipo_instrumento}</strong></td>
                      <td>{t.protocolo}</td>
                      <td>{t.rango_aplicable || '—'}</td>
                      <td>{money(t.precio, t.moneda)}</td>
                      <td><span className={`badge ${t.vigente ? 'badge-cal-activo' : 'badge-cal-inactivo'}`}>{t.vigente ? 'Vigente' : 'Inactiva'}</span></td>
                      <td>
                        {puedeGestionar && (
                          <button className="btn-secondary" onClick={() => handleToggleVigenciaTarifa(t)}>
                            {t.vigente ? 'Desactivar' : 'Reactivar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {detalle && (
        <div className="cal-modal-overlay" onClick={cerrarDetalle}>
          <div className="cal-modal card" onClick={(e) => e.stopPropagation()}>
            <div className="cal-modal-header">
              <h2>{detalle.codigo} — {detalle.cliente?.nombre}</h2>
              <button className="cal-close" onClick={cerrarDetalle}>✕</button>
            </div>

            <div className="cal-detail-grid">
              <p><strong>Estado:</strong> <span className={`badge badge-cot-${detalle.estado}`}>{ESTADOS_COTIZACION[detalle.estado]}</span></p>
              <p><strong>Fecha emisión:</strong> {detalle.fecha_emision || '—'}</p>
              <p><strong>Válida hasta:</strong> {detalle.fecha_vencimiento || '—'}</p>
              <p><strong>Registrada por:</strong> {detalle.registrador?.nombre || '—'}</p>
            </div>

            {puedeGestionar && (
              <div className="cal-estado-actions">
                <button className="btn-secondary" onClick={() => iniciarEdicion(detalle)}>✏️ Editar</button>{' '}
                <label>Cambiar estado: </label>
                <select value={detalle.estado} onChange={(e) => handleCambiarEstado(detalle.id, e.target.value)}>
                  {Object.entries(ESTADOS_COTIZACION).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            )}

            <h3>Ítems</h3>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th>Protocolo</th>
                    <th>Cant.</th>
                    <th>P. unitario</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(detalle.items || []).map((it) => (
                    <tr key={it.id}>
                      <td>{it.descripcion}</td>
                      <td>{it.protocolo}</td>
                      <td>{it.cantidad}</td>
                      <td>{money(it.precio_unitario, detalle.moneda)}</td>
                      <td>{money(it.subtotal, detalle.moneda)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="cot-totales-preview">
              <p>Subtotal: <strong>{money(detalle.subtotal, detalle.moneda)}</strong></p>
              {Number(detalle.descuento_porcentaje) > 0 && <p>Descuento ({detalle.descuento_porcentaje}%): <strong>- {money(detalle.descuento_monto, detalle.moneda)}</strong></p>}
              <p>IVA ({detalle.iva_porcentaje}%): <strong>{money(detalle.iva_monto, detalle.moneda)}</strong></p>
              <p className="cot-total-final">Total: <strong>{money(detalle.total, detalle.moneda)}</strong></p>
            </div>

            <div className="cal-actions">
              <button className="btn-primary" onClick={() => handleDescargarPdf(detalle.id, detalle.codigo)}>📄 Descargar PDF</button>
            </div>

            <h3>Historial de cambios</h3>
            {historial.length === 0 ? (
              <p>Sin movimientos registrados</p>
            ) : (
              <ul className="cal-info-list">
                {historial.map((h) => (
                  <li key={h.id}>
                    <span className="badge badge-doc-tipo">{ACCIONES_HISTORIAL[h.accion] || h.accion}</span>{' '}
                    {h.detalles || '—'} — <em>{h.usuario?.nombre || 'Sistema'}</em>, {new Date(h.timestamp).toLocaleString('es-CL')}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CotizacionesPanel;
