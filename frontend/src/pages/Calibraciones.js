import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  clientsAPI,
  clientInstrumentsAPI,
  workOrdersAPI,
  certificatesAPI,
  excelTemplatesAPI,
  calibrationDataFilesAPI,
  equipmentAPI,
  usersAPI,
} from '../services/api';
import CotizacionesPanel from './CotizacionesPanel';
import './Calibraciones.css';

const ORDEN_ESTADOS = {
  recibida: 'Recibida',
  en_proceso: 'En proceso',
  calibrada: 'Calibrada',
  certificado_emitido: 'Certificado emitido',
  lista_para_facturar: 'Lista para facturar',
  entregada: 'Entregada',
  cancelada: 'Cancelada',
};

const ITEM_ESTADOS = {
  pendiente: 'Pendiente',
  calibrado: 'Calibrado',
  rechazado: 'Rechazado',
};

const CERT_ESTADOS = {
  borrador: 'Borrador',
  firmado: 'Firmado',
  emitido: 'Emitido',
  enviado: 'Enviado',
  superseded: 'Superado (enmendado)',
};

const FORM_CLIENTE_VACIO = {
  nombre: '',
  identificacion_fiscal: '',
  direccion: '',
  telefono: '',
  contacto_nombre: '',
  email_contacto: '',
};

const FORM_INSTRUMENTO_VACIO = {
  codigo_interno: '',
  codigo_cliente: '',
  tipo_instrumento: '',
  marca: '',
  modelo: '',
  numero_serie: '',
  rango_medida: '',
  resolucion: '',
  unidad: '',
  proxima_fecha_calibracion: '',
};

const FORM_ORDEN_VACIO = {
  cliente_id: '',
  fecha_ingreso: '',
  fecha_compromiso: '',
  responsable_id: '',
  observaciones: '',
  condicion_recepcion: '',
  instrumentos_seleccionados: [],
};

// El rol llega como string en login normal (`user.rol`) o como objeto {nombre,...}
// cuando el usuario entró por SSO Microsoft (`GET /auth/profile` incluye el modelo Role).
function obtenerRol(user) {
  if (!user) return null;
  return typeof user.rol === 'string' ? user.rol : user.rol?.nombre || user.role || null;
}

function Calibraciones() {
  const { user } = useAuth();
  const rolActual = obtenerRol(user);
  const puedeGestionar = ['administrador', 'jefe_laboratorio', 'supervisor', 'personal_calidad'].includes(rolActual);
  const puedeEmitirCertificado = ['administrador', 'jefe_laboratorio'].includes(rolActual);

  const [tab, setTab] = useState('clientes');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [plantillasVigentes, setPlantillasVigentes] = useState([]);
  const [plantillaSeleccionadaPorItem, setPlantillaSeleccionadaPorItem] = useState({});
  const [historialDatosAbierto, setHistorialDatosAbierto] = useState({});
  const [formUK, setFormUK] = useState({});
  const [equipos, setEquipos] = useState([]);
  const [patronSeleccionadoPorItem, setPatronSeleccionadoPorItem] = useState({});

  // Clientes
  const [clientes, setClientes] = useState([]);
  const [showClienteForm, setShowClienteForm] = useState(false);
  const [formCliente, setFormCliente] = useState(FORM_CLIENTE_VACIO);

  // Instrumentos
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [instrumentos, setInstrumentos] = useState([]);
  const [alertas, setAlertas] = useState(null);
  const [showInstrumentoForm, setShowInstrumentoForm] = useState(false);
  const [formInstrumento, setFormInstrumento] = useState(FORM_INSTRUMENTO_VACIO);

  // Órdenes de trabajo
  const [ordenes, setOrdenes] = useState([]);
  const [showOrdenForm, setShowOrdenForm] = useState(false);
  const [formOrden, setFormOrden] = useState(FORM_ORDEN_VACIO);
  const [instrumentosCliente, setInstrumentosCliente] = useState([]);
  const [selectedOrden, setSelectedOrden] = useState(null);

  // Bandeja "Por facturar" (subpestaña dentro de Órdenes de Trabajo)
  const [ordenesSubtab, setOrdenesSubtab] = useState('lista');
  const [bandejaFacturacion, setBandejaFacturacion] = useState([]);
  const [filtroBandeja, setFiltroBandeja] = useState({ cliente_id: '', search: '' });

  // Cuando la OT se crea "desde una cotización aceptada": qué cotización la
  // originó y, por instrumento, qué ítem de esa cotización le corresponde
  // (para heredar el flag acreditado — ver WorkOrderController.resolverAcreditadoPorItem).
  const [ordenOrigenCotizacion, setOrdenOrigenCotizacion] = useState(null);

  // Cotizaciones (pestaña nueva, ver CotizacionesPanel)
  const [cotizacionAAbrir, setCotizacionAAbrir] = useState(null);

  const fetchClientes = useCallback(async () => {
    try {
      const res = await clientsAPI.list();
      setClientes(res.data.data);
    } catch (err) {
      setError('Error al cargar clientes');
    }
  }, []);

  const fetchAlertas = useCallback(async () => {
    try {
      const res = await clientInstrumentsAPI.alerts();
      setAlertas(res.data.data);
    } catch (err) {
      setAlertas(null);
    }
  }, []);

  const fetchInstrumentos = useCallback(async (clienteId) => {
    if (!clienteId) {
      setInstrumentos([]);
      return;
    }
    try {
      const res = await clientInstrumentsAPI.list(clienteId);
      setInstrumentos(res.data.data);
    } catch (err) {
      setError('Error al cargar instrumentos');
    }
  }, []);

  const fetchOrdenes = useCallback(async () => {
    try {
      const res = await workOrdersAPI.list();
      setOrdenes(res.data.data);
    } catch (err) {
      setError('Error al cargar órdenes de trabajo');
    }
  }, []);

  const fetchBandejaFacturacion = useCallback(async (filtros) => {
    try {
      const f = filtros || filtroBandeja;
      const params = {};
      if (f.cliente_id) params.cliente_id = f.cliente_id;
      if (f.search) params.search = f.search;
      const res = await workOrdersAPI.billingQueue(params);
      setBandejaFacturacion(res.data.data);
    } catch (err) {
      setError('Error al cargar la bandeja de facturación');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroBandeja]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchClientes(), fetchAlertas(), fetchOrdenes()]).finally(() => setLoading(false));
    usersAPI.list().then((res) => setUsers(res.data.data)).catch(() => setUsers([]));
    excelTemplatesAPI.list({ estado: 'vigente' }).then((res) => setPlantillasVigentes(res.data.data)).catch(() => setPlantillasVigentes([]));
    equipmentAPI.list({ limit: 1000 }).then((res) => setEquipos(res.data.data)).catch(() => setEquipos([]));
  }, [fetchClientes, fetchAlertas, fetchOrdenes]);

  useEffect(() => {
    fetchInstrumentos(clienteSeleccionado);
  }, [clienteSeleccionado, fetchInstrumentos]);

  useEffect(() => {
    if (tab === 'ordenes' && ordenesSubtab === 'facturacion') {
      fetchBandejaFacturacion(filtroBandeja);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, ordenesSubtab]);

  const handleFiltroBandejaChange = (campo, valor) => {
    const nuevo = { ...filtroBandeja, [campo]: valor };
    setFiltroBandeja(nuevo);
    fetchBandejaFacturacion(nuevo);
  };

  const handleMarcarFacturada = async (id) => {
    try {
      await workOrdersAPI.markFacturada(id);
      fetchBandejaFacturacion(filtroBandeja);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al marcar la orden como facturada');
    }
  };

  const handleExportarBandejaCsv = async () => {
    try {
      const params = {};
      if (filtroBandeja.cliente_id) params.cliente_id = filtroBandeja.cliente_id;
      if (filtroBandeja.search) params.search = filtroBandeja.search;
      const res = await workOrdersAPI.exportBillingQueueCsv(params);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `por-facturar-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Error al exportar la bandeja de facturación');
    }
  };

  const handleCreateCliente = async (e) => {
    e.preventDefault();
    try {
      const res = await clientsAPI.create(formCliente);
      alert(res.data.message);
      setFormCliente(FORM_CLIENTE_VACIO);
      setShowClienteForm(false);
      fetchClientes();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al registrar el cliente');
    }
  };

  const handleCreateInstrumento = async (e) => {
    e.preventDefault();
    if (!clienteSeleccionado) return;
    try {
      const payload = { ...formInstrumento };
      Object.keys(payload).forEach((k) => { if (payload[k] === '') delete payload[k]; });
      const res = await clientInstrumentsAPI.create(clienteSeleccionado, payload);
      alert(res.data.message);
      setFormInstrumento(FORM_INSTRUMENTO_VACIO);
      setShowInstrumentoForm(false);
      fetchInstrumentos(clienteSeleccionado);
      fetchAlertas();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al registrar el instrumento');
    }
  };

  const toggleInstrumentoSeleccionado = (id) => {
    setFormOrden((prev) => {
      const yaEsta = prev.instrumentos_seleccionados.includes(id);
      return {
        ...prev,
        instrumentos_seleccionados: yaEsta
          ? prev.instrumentos_seleccionados.filter((i) => i !== id)
          : [...prev.instrumentos_seleccionados, id],
      };
    });
  };

  const handleOrdenClienteChange = async (clienteId) => {
    setFormOrden({ ...formOrden, cliente_id: clienteId, instrumentos_seleccionados: [] });
    if (!clienteId) { setInstrumentosCliente([]); return; }
    try {
      const res = await clientInstrumentsAPI.list(clienteId);
      setInstrumentosCliente(res.data.data);
    } catch (err) {
      setInstrumentosCliente([]);
    }
  };

  const handleCreateOrden = async (e) => {
    e.preventDefault();
    if (formOrden.instrumentos_seleccionados.length === 0) {
      setError('Selecciona al menos un instrumento para la orden de trabajo');
      return;
    }
    try {
      const payload = {
        cliente_id: formOrden.cliente_id,
        fecha_ingreso: formOrden.fecha_ingreso,
        fecha_compromiso: formOrden.fecha_compromiso || undefined,
        responsable_id: formOrden.responsable_id || undefined,
        observaciones: formOrden.observaciones || undefined,
        quote_id: ordenOrigenCotizacion?.quote_id || undefined,
        items: formOrden.instrumentos_seleccionados.map((instrumento_cliente_id) => ({
          instrumento_cliente_id,
          condicion_recepcion: formOrden.condicion_recepcion || undefined,
          quote_item_id: ordenOrigenCotizacion?.mapa?.[instrumento_cliente_id]?.quote_item_id,
        })),
      };
      const res = await workOrdersAPI.create(payload);
      alert(res.data.message);
      cancelarFormOrden();
      fetchOrdenes();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al registrar la orden de trabajo');
    }
  };

  const cancelarFormOrden = () => {
    setFormOrden(FORM_ORDEN_VACIO);
    setInstrumentosCliente([]);
    setShowOrdenForm(false);
    setOrdenOrigenCotizacion(null);
  };

  // Precarga cliente e ítems de una cotización aceptada para crear la OT
  // "desde cotización" (invocado desde la pestaña Cotizaciones).
  const iniciarOrdenDesdeCotizacion = async (cotizacion) => {
    const itemsConInstrumento = (cotizacion.items || []).filter((it) => it.instrumento_cliente_id);
    const mapa = {};
    itemsConInstrumento.forEach((it) => {
      mapa[it.instrumento_cliente_id] = { quote_item_id: it.id, acreditado: it.acreditado };
    });

    setOrdenOrigenCotizacion({ quote_id: cotizacion.id, codigo: cotizacion.codigo, mapa });
    setFormOrden({
      ...FORM_ORDEN_VACIO,
      cliente_id: cotizacion.cliente_id,
      instrumentos_seleccionados: itemsConInstrumento.map((it) => it.instrumento_cliente_id),
    });
    try {
      const res = await clientInstrumentsAPI.list(cotizacion.cliente_id);
      setInstrumentosCliente(res.data.data);
    } catch (err) {
      setInstrumentosCliente([]);
    }
    setTab('ordenes');
    setShowOrdenForm(true);
  };

  const verCotizacion = (quoteId) => {
    setSelectedOrden(null);
    setCotizacionAAbrir(quoteId);
    setTab('cotizaciones');
  };

  const openOrdenDetail = async (id) => {
    try {
      const res = await workOrdersAPI.get(id);
      setSelectedOrden(res.data.data);
    } catch (err) {
      setError('Error al cargar el detalle de la orden de trabajo');
    }
  };

  const refreshSelectedOrden = () => {
    if (selectedOrden) openOrdenDetail(selectedOrden.id);
    fetchOrdenes();
  };

  const handleUpdateOrdenEstado = async (estado) => {
    try {
      await workOrdersAPI.updateEstado(selectedOrden.id, { estado });
      refreshSelectedOrden();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al actualizar el estado de la orden');
    }
  };

  const handleUpdateItemResultado = async (itemId, resultado) => {
    try {
      await workOrdersAPI.updateItem(itemId, { resultado, estado: 'calibrado' });
      refreshSelectedOrden();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al actualizar el ítem');
    }
  };

  const handleUploadCertificado = async (itemId, file) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('archivo', file);
      const res = await certificatesAPI.upload(itemId, formData);
      alert(res.data.message);
      refreshSelectedOrden();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al subir el certificado');
    }
  };

  const handleSubirDataFile = async (itemId, file, templateVersionId) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('archivo', file);
      if (templateVersionId) formData.append('template_version_id', templateVersionId);
      const res = await calibrationDataFilesAPI.upload(itemId, formData);
      alert(res.data.message);
      refreshSelectedOrden();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al subir el archivo de datos');
    }
  };

  const handleDescargarDataFile = async (id, nombre) => {
    try {
      const res = await calibrationDataFilesAPI.download(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', nombre || 'raw-data.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Error al descargar el archivo de datos');
    }
  };

  const handleVerificarDataFile = async (id) => {
    try {
      const res = await calibrationDataFilesAPI.verify(id);
      alert(res.data.message);
      refreshSelectedOrden();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al verificar la integridad del archivo');
    }
  };

  const toggleHistorialDatos = (itemId) => {
    setHistorialDatosAbierto((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const valorUK = (item, campo) => {
    if (formUK[item.id] && formUK[item.id][campo] !== undefined) return formUK[item.id][campo];
    return item[campo] ?? '';
  };

  const handleCambiarUK = (item, campo, valor) => {
    setFormUK((prev) => ({
      ...prev,
      [item.id]: {
        incertidumbre_U: valorUK(item, 'incertidumbre_U'),
        factor_k: valorUK(item, 'factor_k'),
        fuente_datos: valorUK(item, 'fuente_datos'),
        ...prev[item.id],
        [campo]: valor,
      },
    }));
  };

  const handleGuardarUK = async (item) => {
    try {
      await workOrdersAPI.updateItem(item.id, {
        incertidumbre_U: valorUK(item, 'incertidumbre_U') || null,
        factor_k: valorUK(item, 'factor_k') || null,
        fuente_datos: valorUK(item, 'fuente_datos') || null,
      });
      setFormUK((prev) => {
        const { [item.id]: _quitar, ...resto } = prev;
        return resto;
      });
      refreshSelectedOrden();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al guardar incertidumbre y factor de cobertura');
    }
  };

  const handleAgregarPatron = async (itemId) => {
    const equipmentId = patronSeleccionadoPorItem[itemId];
    if (!equipmentId) return;
    try {
      await workOrdersAPI.addPatron(itemId, equipmentId);
      setPatronSeleccionadoPorItem((prev) => ({ ...prev, [itemId]: '' }));
      refreshSelectedOrden();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al asociar el patrón');
    }
  };

  const handleQuitarPatron = async (itemId, equipmentId) => {
    try {
      await workOrdersAPI.removePatron(itemId, equipmentId);
      refreshSelectedOrden();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al quitar el patrón');
    }
  };

  const handleGenerarCertificado = async (itemId) => {
    try {
      const res = await certificatesAPI.generate(itemId, {});
      alert(res.data.message);
      refreshSelectedOrden();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al generar el certificado');
    }
  };

  const handleCertificadoEstado = async (certId, estado) => {
    try {
      await certificatesAPI.updateEstado(certId, { estado });
      refreshSelectedOrden();
    } catch (err) {
      const error = err.response?.data?.error;
      if (error?.code === 'ISSUANCE_BLOCKED' && Array.isArray(error.checks)) {
        const motivos = error.checks.filter((c) => !c.paso).map((c) => `• ${c.motivo}`).join('\n');
        setError(`No se puede emitir el certificado:\n${motivos}`);
      } else {
        setError(error?.message || 'Error al actualizar el estado del certificado');
      }
    }
  };

  const handleFirmarCertificado = async (certId) => {
    try {
      const res = await certificatesAPI.sign(certId);
      alert(res.data.message);
      refreshSelectedOrden();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al firmar el certificado');
    }
  };

  const handleVerChecklistEmision = async (certId) => {
    try {
      const res = await certificatesAPI.issuanceCheck(certId);
      const lineas = res.data.data.checks.map((c) => `${c.paso ? '✓' : '✗'} ${c.motivo}`).join('\n');
      alert(`${res.data.data.permitida ? 'Se puede emitir.' : 'NO se puede emitir todavía.'}\n\n${lineas}`);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al obtener el checklist de emisión');
    }
  };

  const handleEnviarCertificado = async (certId) => {
    try {
      const res = await certificatesAPI.send(certId);
      alert(res.data.message);
      refreshSelectedOrden();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al enviar el certificado');
    }
  };

  // Enmienda (tarea 2.9): un certificado emitido/enviado no se edita, se
  // reemplaza — pide el motivo (mismo patrón que la revocación de
  // autorizaciones en Personnel.js) y crea un certificado nuevo en borrador
  // que hay que firmar y emitir de nuevo.
  const handleEnmendarCertificado = async (certId) => {
    const motivo = window.prompt('Motivo de la enmienda (obligatorio):');
    if (!motivo || !motivo.trim()) return;
    try {
      const res = await certificatesAPI.amend(certId, { motivo_enmienda: motivo.trim() });
      alert(res.data.message);
      refreshSelectedOrden();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al enmendar el certificado');
    }
  };

  const handleDescargarCertificado = async (certId, nombre) => {
    try {
      const res = await certificatesAPI.download(certId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', nombre || 'certificado.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Error al descargar el certificado');
    }
  };

  // Sugiere primero las plantillas cuya magnitud se relaciona con el tipo de
  // instrumento (no hay un campo "magnitud" formal en ClientInstrument, así
  // que es una coincidencia parcial de texto, no una regla de negocio dura;
  // el técnico igual puede elegir cualquier otra plantilla vigente).
  const plantillasSugeridasPara = (tipoInstrumento) => {
    const tipo = (tipoInstrumento || '').toLowerCase();
    return [...plantillasVigentes].sort((a, b) => {
      const aCoincide = tipo.includes(a.magnitud.toLowerCase()) || a.magnitud.toLowerCase().includes(tipo);
      const bCoincide = tipo.includes(b.magnitud.toLowerCase()) || b.magnitud.toLowerCase().includes(tipo);
      if (aCoincide === bCoincide) return a.codigo.localeCompare(b.codigo);
      return aCoincide ? -1 : 1;
    });
  };

  const handleSeleccionarPlantilla = (itemId, templateId) => {
    setPlantillaSeleccionadaPorItem((prev) => ({ ...prev, [itemId]: templateId }));
  };

  const handleDescargarPlantilla = async (itemId) => {
    const templateId = plantillaSeleccionadaPorItem[itemId];
    if (!templateId) {
      setError('Selecciona una plantilla para descargar');
      return;
    }
    try {
      const plantilla = plantillasVigentes.find((p) => p.id === templateId);
      const res = await excelTemplatesAPI.download(templateId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${plantilla?.codigo || 'plantilla'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al descargar la plantilla');
    }
  };

  const hoy = new Date().toISOString().split('T')[0];
  const claseVencimiento = (fecha) => {
    if (!fecha) return '';
    if (fecha < hoy) return 'cal-fecha-vencida';
    const limite = new Date();
    limite.setDate(limite.getDate() + 60);
    if (fecha <= limite.toISOString().split('T')[0]) return 'cal-fecha-proxima';
    return '';
  };

  if (loading) {
    return <div className="loader"></div>;
  }

  return (
    <div className="cal-container">
      <div className="cal-header">
        <h1>🧪 Laboratorio de Calibraciones</h1>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ whiteSpace: 'pre-line' }} onClick={() => setError(null)}>
          {error}
        </div>
      )}

      <div className="cal-tabs">
        <button className={`cal-tab ${tab === 'clientes' ? 'active' : ''}`} onClick={() => setTab('clientes')}>Clientes</button>
        <button className={`cal-tab ${tab === 'instrumentos' ? 'active' : ''}`} onClick={() => setTab('instrumentos')}>Instrumentos</button>
        <button className={`cal-tab ${tab === 'ordenes' ? 'active' : ''}`} onClick={() => setTab('ordenes')}>Órdenes de Trabajo</button>
        <button className={`cal-tab ${tab === 'cotizaciones' ? 'active' : ''}`} onClick={() => setTab('cotizaciones')}>Cotizaciones</button>
      </div>

      {tab === 'clientes' && (
        <div>
          {puedeGestionar && (
            <div className="cal-actions">
              <button onClick={() => setShowClienteForm(!showClienteForm)} className="btn-primary">
                {showClienteForm ? '✕ Cancelar' : '➕ Nuevo Cliente'}
              </button>
            </div>
          )}

          {showClienteForm && (
            <div className="card cal-form">
              <h2>Registrar Cliente</h2>
              <form onSubmit={handleCreateCliente}>
                <div className="cal-form-grid">
                  <div className="form-group">
                    <label>Nombre / Razón social: *</label>
                    <input type="text" value={formCliente.nombre} onChange={(e) => setFormCliente({ ...formCliente, nombre: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Identificación fiscal: *</label>
                    <input type="text" value={formCliente.identificacion_fiscal} onChange={(e) => setFormCliente({ ...formCliente, identificacion_fiscal: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Correo de contacto (para certificados): *</label>
                    <input type="email" value={formCliente.email_contacto} onChange={(e) => setFormCliente({ ...formCliente, email_contacto: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Nombre de contacto:</label>
                    <input type="text" value={formCliente.contacto_nombre} onChange={(e) => setFormCliente({ ...formCliente, contacto_nombre: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Teléfono:</label>
                    <input type="text" value={formCliente.telefono} onChange={(e) => setFormCliente({ ...formCliente, telefono: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Dirección:</label>
                    <input type="text" value={formCliente.direccion} onChange={(e) => setFormCliente({ ...formCliente, direccion: e.target.value })} />
                  </div>
                </div>
                <button type="submit" className="btn-primary">Registrar</button>
              </form>
            </div>
          )}

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Identificación</th>
                  <th>Correo de contacto</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id} className="cal-row" onClick={() => { setClienteSeleccionado(c.id); setTab('instrumentos'); }}>
                    <td><strong>{c.nombre}</strong></td>
                    <td>{c.identificacion_fiscal}</td>
                    <td>{c.email_contacto}</td>
                    <td>{c.telefono || '—'}</td>
                    <td><span className={`badge badge-cal-${c.estado}`}>{c.estado}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'instrumentos' && (
        <div>
          {alertas && alertas.total > 0 && (
            <div className="cal-alertas card">
              <h2>
                🔔 Alertas de recalibración ({alertas.vencidas} vencidas, {alertas.por_vencer} por vencer en{' '}
                {alertas.dias_anticipacion} días)
              </h2>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Instrumento</th>
                      <th>Cliente</th>
                      <th>Fecha programada</th>
                      <th>Situación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertas.alertas.map((a, i) => (
                      <tr key={i} className="cal-row" onClick={() => setClienteSeleccionado(a.cliente_id)}>
                        <td>{a.codigo_interno} ({a.tipo_instrumento})</td>
                        <td>{a.cliente}</td>
                        <td className={a.vencido ? 'cal-fecha-vencida' : 'cal-fecha-proxima'}>{a.fecha_programada}</td>
                        <td><span className={`badge ${a.vencido ? 'badge-cal-vencido' : 'badge-cal-proximo'}`}>{a.vencido ? 'VENCIDO' : 'Por vencer'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="form-group cal-cliente-select">
            <label>Cliente: </label>
            <select value={clienteSeleccionado} onChange={(e) => setClienteSeleccionado(e.target.value)}>
              <option value="">— Selecciona un cliente —</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          {clienteSeleccionado && puedeGestionar && (
            <div className="cal-actions">
              <button onClick={() => setShowInstrumentoForm(!showInstrumentoForm)} className="btn-primary">
                {showInstrumentoForm ? '✕ Cancelar' : '➕ Nuevo Instrumento'}
              </button>
            </div>
          )}

          {showInstrumentoForm && clienteSeleccionado && (
            <div className="card cal-form">
              <h2>Registrar Instrumento</h2>
              <form onSubmit={handleCreateInstrumento}>
                <div className="cal-form-grid">
                  <div className="form-group">
                    <label>Código interno: *</label>
                    <input type="text" value={formInstrumento.codigo_interno} onChange={(e) => setFormInstrumento({ ...formInstrumento, codigo_interno: e.target.value })} placeholder="Ej: INS-001" required />
                  </div>
                  <div className="form-group">
                    <label>Tipo de instrumento: *</label>
                    <input type="text" value={formInstrumento.tipo_instrumento} onChange={(e) => setFormInstrumento({ ...formInstrumento, tipo_instrumento: e.target.value })} placeholder="Ej: Manómetro" required />
                  </div>
                  <div className="form-group">
                    <label>Código del cliente:</label>
                    <input type="text" value={formInstrumento.codigo_cliente} onChange={(e) => setFormInstrumento({ ...formInstrumento, codigo_cliente: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Marca:</label>
                    <input type="text" value={formInstrumento.marca} onChange={(e) => setFormInstrumento({ ...formInstrumento, marca: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Modelo:</label>
                    <input type="text" value={formInstrumento.modelo} onChange={(e) => setFormInstrumento({ ...formInstrumento, modelo: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>N° de serie:</label>
                    <input type="text" value={formInstrumento.numero_serie} onChange={(e) => setFormInstrumento({ ...formInstrumento, numero_serie: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Rango de medida:</label>
                    <input type="text" value={formInstrumento.rango_medida} onChange={(e) => setFormInstrumento({ ...formInstrumento, rango_medida: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Resolución:</label>
                    <input type="text" value={formInstrumento.resolucion} onChange={(e) => setFormInstrumento({ ...formInstrumento, resolucion: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Unidad:</label>
                    <input type="text" value={formInstrumento.unidad} onChange={(e) => setFormInstrumento({ ...formInstrumento, unidad: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Próxima fecha de calibración:</label>
                    <input type="date" value={formInstrumento.proxima_fecha_calibracion} onChange={(e) => setFormInstrumento({ ...formInstrumento, proxima_fecha_calibracion: e.target.value })} />
                  </div>
                </div>
                <button type="submit" className="btn-primary">Registrar</button>
              </form>
            </div>
          )}

          {clienteSeleccionado && (
            instrumentos.length === 0 ? (
              <p>Este cliente no tiene instrumentos registrados</p>
            ) : (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Tipo</th>
                      <th>Marca/Modelo</th>
                      <th>N° serie</th>
                      <th>Próx. calibración</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instrumentos.map((inst) => (
                      <tr key={inst.id}>
                        <td><strong>{inst.codigo_interno}</strong></td>
                        <td>{inst.tipo_instrumento}</td>
                        <td>{inst.marca || '—'} / {inst.modelo || '—'}</td>
                        <td>{inst.numero_serie || '—'}</td>
                        <td className={claseVencimiento(inst.proxima_fecha_calibracion)}>{inst.proxima_fecha_calibracion || '—'}</td>
                        <td><span className={`badge badge-cal-${inst.estado}`}>{inst.estado}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}

      {tab === 'ordenes' && (
        <div>
          <div className="cal-tabs cal-subtabs">
            <button className={`cal-tab ${ordenesSubtab === 'lista' ? 'active' : ''}`} onClick={() => setOrdenesSubtab('lista')}>Órdenes</button>
            <button className={`cal-tab ${ordenesSubtab === 'facturacion' ? 'active' : ''}`} onClick={() => setOrdenesSubtab('facturacion')}>Por facturar</button>
          </div>

          {ordenesSubtab === 'lista' && (
          <div>
          {puedeGestionar && (
            <div className="cal-actions">
              <button onClick={() => (showOrdenForm ? cancelarFormOrden() : setShowOrdenForm(true))} className="btn-primary">
                {showOrdenForm ? '✕ Cancelar' : '➕ Nueva Orden de Trabajo'}
              </button>
            </div>
          )}

          {showOrdenForm && (
            <div className="card cal-form">
              <h2>Registrar Orden de Trabajo</h2>
              {ordenOrigenCotizacion && (
                <p className="cal-origen-cotizacion">
                  Creando OT desde la cotización <strong>{ordenOrigenCotizacion.codigo}</strong>.{' '}
                  <button type="button" className="cal-link-btn" onClick={cancelarFormOrden}>Quitar origen</button>
                </p>
              )}
              <form onSubmit={handleCreateOrden}>
                <div className="cal-form-grid">
                  <div className="form-group">
                    <label>Cliente: *</label>
                    <select
                      value={formOrden.cliente_id}
                      onChange={(e) => handleOrdenClienteChange(e.target.value)}
                      required
                      disabled={!!ordenOrigenCotizacion}
                    >
                      <option value="">— Selecciona un cliente —</option>
                      {clientes.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Fecha de ingreso: *</label>
                    <input type="date" value={formOrden.fecha_ingreso} onChange={(e) => setFormOrden({ ...formOrden, fecha_ingreso: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Fecha compromiso:</label>
                    <input type="date" value={formOrden.fecha_compromiso} onChange={(e) => setFormOrden({ ...formOrden, fecha_compromiso: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Responsable:</label>
                    <select value={formOrden.responsable_id} onChange={(e) => setFormOrden({ ...formOrden, responsable_id: e.target.value })}>
                      <option value="">— Sin asignar —</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.nombre} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {formOrden.cliente_id && (
                  <div className="form-group">
                    <label>Instrumentos a calibrar: *</label>
                    {instrumentosCliente.length === 0 ? (
                      <p>Este cliente no tiene instrumentos registrados. Regístralos primero en la pestaña Instrumentos.</p>
                    ) : (
                      <div className="cal-instrumentos-picker">
                        {instrumentosCliente.map((inst) => (
                          <label key={inst.id} className="cal-checkbox">
                            <input
                              type="checkbox"
                              checked={formOrden.instrumentos_seleccionados.includes(inst.id)}
                              onChange={() => toggleInstrumentoSeleccionado(inst.id)}
                            />
                            {inst.codigo_interno} — {inst.tipo_instrumento}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label>Condición de recepción (aplica a los instrumentos seleccionados):</label>
                  <textarea value={formOrden.condicion_recepcion} onChange={(e) => setFormOrden({ ...formOrden, condicion_recepcion: e.target.value })} rows="2"></textarea>
                </div>
                <div className="form-group">
                  <label>Observaciones:</label>
                  <textarea value={formOrden.observaciones} onChange={(e) => setFormOrden({ ...formOrden, observaciones: e.target.value })} rows="2"></textarea>
                </div>
                <button type="submit" className="btn-primary">Registrar</button>
              </form>
            </div>
          )}

          {ordenes.length === 0 ? (
            <p>No hay órdenes de trabajo registradas</p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Cliente</th>
                    <th>Fecha ingreso</th>
                    <th>Estado</th>
                    <th>Responsable</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenes.map((ot) => (
                    <tr key={ot.id} className="cal-row" onClick={() => openOrdenDetail(ot.id)}>
                      <td><strong>{ot.codigo}</strong></td>
                      <td>{ot.cliente?.nombre || '—'}</td>
                      <td>{ot.fecha_ingreso}</td>
                      <td><span className={`badge badge-ot-${ot.estado}`}>{ORDEN_ESTADOS[ot.estado]}</span></td>
                      <td>{ot.responsable?.nombre || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </div>
          )}

          {ordenesSubtab === 'facturacion' && (
          <div>
            <div className="cal-filtros">
              <div className="form-group">
                <label>Cliente:</label>
                <select value={filtroBandeja.cliente_id} onChange={(e) => handleFiltroBandejaChange('cliente_id', e.target.value)}>
                  <option value="">— Todos —</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Buscar código:</label>
                <input type="text" value={filtroBandeja.search} onChange={(e) => handleFiltroBandejaChange('search', e.target.value)} placeholder="Ej: OT-2026" />
              </div>
            </div>

            <div className="cal-actions">
              <button className="btn-secondary" onClick={handleExportarBandejaCsv}>⬇️ Exportar CSV</button>
            </div>

            {bandejaFacturacion.length === 0 ? (
              <p>No hay órdenes de trabajo pendientes de facturación</p>
            ) : (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Cliente</th>
                      <th>Fecha ingreso</th>
                      <th>Cotización</th>
                      <th>Responsable</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {bandejaFacturacion.map((ot) => (
                      <tr key={ot.id}>
                        <td><strong>{ot.codigo}</strong></td>
                        <td>{ot.cliente?.nombre || '—'}</td>
                        <td>{ot.fecha_ingreso}</td>
                        <td>{ot.cotizacion?.codigo || '—'}</td>
                        <td>{ot.responsable?.nombre || '—'}</td>
                        <td>
                          {puedeGestionar && (
                            <button className="btn-secondary" onClick={() => handleMarcarFacturada(ot.id)}>Marcar facturada</button>
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
        </div>
      )}

      {tab === 'cotizaciones' && (
        <CotizacionesPanel
          clientes={clientes}
          puedeGestionar={puedeGestionar}
          onIniciarOrdenDesdeCotizacion={iniciarOrdenDesdeCotizacion}
          onVerOrdenTrabajo={openOrdenDetail}
          cotizacionAAbrir={cotizacionAAbrir}
          onCotizacionAbierta={() => setCotizacionAAbrir(null)}
        />
      )}

      {selectedOrden && (
        <div className="cal-modal-overlay" onClick={() => setSelectedOrden(null)}>
          <div className="cal-modal card" onClick={(e) => e.stopPropagation()}>
            <div className="cal-modal-header">
              <h2>{selectedOrden.codigo} — {selectedOrden.cliente?.nombre}</h2>
              <button className="cal-close" onClick={() => setSelectedOrden(null)}>✕</button>
            </div>

            <div className="cal-detail-grid">
              <p><strong>Estado:</strong> <span className={`badge badge-ot-${selectedOrden.estado}`}>{ORDEN_ESTADOS[selectedOrden.estado]}</span></p>
              <p><strong>Fecha ingreso:</strong> {selectedOrden.fecha_ingreso}</p>
              <p><strong>Fecha compromiso:</strong> {selectedOrden.fecha_compromiso || '—'}</p>
              <p><strong>Responsable:</strong> {selectedOrden.responsable?.nombre || '—'}</p>
              <p><strong>Correo de contacto:</strong> {selectedOrden.cliente?.email_contacto}</p>
              <p>
                <strong>Cotización de origen:</strong>{' '}
                {selectedOrden.cotizacion ? (
                  <button type="button" className="cal-link-btn" onClick={() => verCotizacion(selectedOrden.cotizacion.id)}>
                    {selectedOrden.cotizacion.codigo}
                  </button>
                ) : '—'}
              </p>
            </div>

            {puedeGestionar && (
              <div className="cal-estado-actions">
                <label>Cambiar estado: </label>
                <select value={selectedOrden.estado} onChange={(e) => handleUpdateOrdenEstado(e.target.value)}>
                  {Object.entries(ORDEN_ESTADOS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            )}

            <h3>Instrumentos de la orden</h3>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Instrumento</th>
                    <th>Estado</th>
                    <th>Plantilla</th>
                    <th>Raw data</th>
                    <th>U / k</th>
                    <th>Resultado</th>
                    <th>Certificado</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedOrden.items || []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.instrumento?.codigo_interno} ({item.instrumento?.tipo_instrumento})</td>
                      <td><span className={`badge badge-item-${item.estado}`}>{ITEM_ESTADOS[item.estado]}</span></td>
                      <td>
                        {plantillasVigentes.length === 0 ? '—' : (
                          <div className="cal-plantilla-picker">
                            <select
                              value={plantillaSeleccionadaPorItem[item.id] || ''}
                              onChange={(e) => handleSeleccionarPlantilla(item.id, e.target.value)}
                            >
                              <option value="">— Elegir plantilla —</option>
                              {plantillasSugeridasPara(item.instrumento?.tipo_instrumento).map((p) => (
                                <option key={p.id} value={p.id}>{p.codigo} ({p.magnitud})</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="btn-secondary"
                              disabled={!plantillaSeleccionadaPorItem[item.id]}
                              onClick={() => handleDescargarPlantilla(item.id)}
                            >
                              📄 Descargar
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="cal-plantilla-picker">
                          {puedeGestionar && (
                            <label className="btn-secondary cal-upload-btn">
                              📊 Subir
                              <input
                                type="file"
                                accept=".xlsx,.xls,.xlsm"
                                style={{ display: 'none' }}
                                onChange={(e) => handleSubirDataFile(item.id, e.target.files[0], plantillaSeleccionadaPorItem[item.id])}
                              />
                            </label>
                          )}
                          {(item.archivosDatos || []).length > 0 && (
                            <button type="button" className="btn-secondary" onClick={() => toggleHistorialDatos(item.id)}>
                              {item.archivosDatos.length} archivo(s) {historialDatosAbierto[item.id] ? '▲' : '▼'}
                            </button>
                          )}
                        </div>
                        {historialDatosAbierto[item.id] && (
                          <ul className="cal-datafiles-historial">
                            {item.archivosDatos.map((a) => (
                              <li key={a.id}>
                                <code>{a.sha256.slice(0, 12)}…</code>{' '}
                                <span className={a.hash_verificado ? 'cal-hash-ok' : 'cal-hash-alterado'}>
                                  {a.hash_verificado ? '✓ íntegro' : '⚠ alterado'}
                                </span>
                                {' — '}{new Date(a.createdAt).toLocaleString('es-CL')} — {a.subidoPor?.nombre || '—'}
                                <div>
                                  <button type="button" className="btn-secondary" onClick={() => handleDescargarDataFile(a.id, a.nombre_original)}>Descargar</button>
                                  {puedeGestionar && (
                                    <button type="button" className="btn-secondary" onClick={() => handleVerificarDataFile(a.id)}>Verificar</button>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td>
                        {puedeGestionar ? (
                          <div className="cal-uk-inputs">
                            <input
                              type="number" step="any" placeholder="U"
                              value={valorUK(item, 'incertidumbre_U')}
                              onChange={(e) => handleCambiarUK(item, 'incertidumbre_U', e.target.value)}
                            />
                            <input
                              type="number" step="any" placeholder="k"
                              value={valorUK(item, 'factor_k')}
                              onChange={(e) => handleCambiarUK(item, 'factor_k', e.target.value)}
                            />
                            <select
                              value={valorUK(item, 'fuente_datos')}
                              onChange={(e) => handleCambiarUK(item, 'fuente_datos', e.target.value)}
                            >
                              <option value="">— Fuente —</option>
                              <option value="digitacion">Digitación</option>
                              <option value="excel_adjunto">Excel adjunto</option>
                            </select>
                            <button type="button" className="btn-secondary" onClick={() => handleGuardarUK(item)}>Guardar</button>
                          </div>
                        ) : (
                          <span>{item.incertidumbre_U ?? '—'} / {item.factor_k ?? '—'}</span>
                        )}
                      </td>
                      <td>
                        {puedeGestionar ? (
                          <select value={item.resultado || ''} onChange={(e) => handleUpdateItemResultado(item.id, e.target.value)}>
                            <option value="">— Sin resultado —</option>
                            <option value="conforme">Conforme</option>
                            <option value="no_conforme">No conforme</option>
                          </select>
                        ) : (item.resultado || '—')}
                      </td>
                      <td>
                        {!item.certificado ? (
                          puedeGestionar && (
                            <div className="cal-cert-actions">
                              {(item.patrones || []).length > 0 && (
                                <ul className="cal-patrones-lista">
                                  {item.patrones.map((p) => (
                                    <li key={p.id}>
                                      {p.codigo} ({p.magnitud || '—'}){' '}
                                      <button type="button" className="cal-link-btn" onClick={() => handleQuitarPatron(item.id, p.id)}>quitar</button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              <div className="cal-plantilla-picker">
                                <select
                                  value={patronSeleccionadoPorItem[item.id] || ''}
                                  onChange={(e) => setPatronSeleccionadoPorItem((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                >
                                  <option value="">— Patrón usado —</option>
                                  {equipos.map((eq) => (
                                    <option key={eq.id} value={eq.id}>{eq.codigo} ({eq.magnitud || '—'})</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  disabled={!patronSeleccionadoPorItem[item.id]}
                                  onClick={() => handleAgregarPatron(item.id)}
                                >
                                  Agregar
                                </button>
                              </div>
                              <button type="button" className="btn-primary" onClick={() => handleGenerarCertificado(item.id)}>
                                🧾 Generar certificado
                              </button>
                              <label className="btn-secondary cal-upload-btn">
                                📎 Subir PDF
                                <input
                                  type="file"
                                  accept=".pdf"
                                  style={{ display: 'none' }}
                                  onChange={(e) => handleUploadCertificado(item.id, e.target.files[0])}
                                />
                              </label>
                            </div>
                          )
                        ) : (
                          <div className="cal-cert-actions">
                            <span>{item.certificado.codigo}</span>{' '}
                            <span className={`badge badge-cert-${item.certificado.estado}`}>{CERT_ESTADOS[item.certificado.estado]}</span>
                            {item.certificado.certificadoOriginal && (
                              <div className="cal-enmienda-nota">Enmienda del certificado {item.certificado.certificadoOriginal.codigo}</div>
                            )}
                            {item.certificado.sha256_pdf && (
                              <div><code>{item.certificado.sha256_pdf.slice(0, 12)}…</code></div>
                            )}
                            <div>
                              <button className="btn-secondary" onClick={() => handleDescargarCertificado(item.certificado.id, item.certificado.nombre_original)}>Descargar</button>
                              {puedeEmitirCertificado && item.certificado.estado === 'borrador' && (
                                <button className="btn-secondary" onClick={() => handleFirmarCertificado(item.certificado.id)}>✍️ Firmar</button>
                              )}
                              {puedeEmitirCertificado && item.certificado.estado === 'firmado' && (
                                <>
                                  <button className="btn-secondary" onClick={() => handleVerChecklistEmision(item.certificado.id)}>Ver checklist</button>
                                  <button className="btn-secondary" onClick={() => handleCertificadoEstado(item.certificado.id, 'emitido')}>Marcar emitido</button>
                                </>
                              )}
                              {puedeEmitirCertificado && item.certificado.estado === 'emitido' && (
                                <button className="btn-primary" onClick={() => handleEnviarCertificado(item.certificado.id)}>Enviar por correo</button>
                              )}
                              {item.certificado.estado === 'enviado' && (
                                <span> ✓ Enviado a {item.certificado.enviado_a}</span>
                              )}
                              {puedeEmitirCertificado && ['emitido', 'enviado'].includes(item.certificado.estado) && (
                                <button className="btn-secondary" onClick={() => handleEnmendarCertificado(item.certificado.id)}>📝 Enmendar</button>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calibraciones;
