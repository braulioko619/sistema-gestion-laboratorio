import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot, ReferenceLine,
} from 'recharts';
import { equipmentAPI, usersAPI } from '../services/api';
import './ControlMetrologico.css';

// Esta pestaña reutiliza el mismo motor de hoja de vida / eventos / historial
// de calibración / deriva / carta de control que "Equipos Patrones"
// (frontend/src/pages/Equipment.js), pero filtrado a
// categoria = 'equipo_laboratorio' — el equipamiento de ensayo de la sede
// Maipú, separado de los patrones del laboratorio de calibraciones.
const CATEGORIA = 'equipo_laboratorio';
const SEDE_DEFECTO = 'Maipú';

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

const TIPOS_LOG = {
  uso: 'Uso',
  incidencia: 'Incidencia',
  traslado: 'Traslado',
  mantenimiento_correctivo: 'Mantenimiento correctivo',
  cambio_estado: 'Cambio de estado',
  observacion: 'Observación',
  correccion: 'Corrección',
  otro: 'Otro',
};

const CATEGORIAS_DOC = {
  manual: 'Manual',
  protocolo: 'Protocolo',
  ficha_tecnica: 'Ficha técnica',
  certificado_calibracion: 'Certificado de calibración',
  otro: 'Otro',
};

const TABS_DETALLE = [
  { key: 'hoja', label: 'Hoja de vida' },
  { key: 'historial', label: 'Historial' },
  { key: 'calibraciones', label: 'Calibraciones y deriva' },
  { key: 'bitacora', label: 'Bitácora' },
  { key: 'imagenes', label: 'Imágenes' },
  { key: 'documentos', label: 'Documentos' },
];

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
  sede: SEDE_DEFECTO,
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

const FORM_LOG_VACIO = {
  fecha: '',
  tipo: 'observacion',
  descripcion: '',
  estado_resultante: '',
  corrige_entrada_id: '',
};

const FORM_CALIB_VACIO = {
  fecha_calibracion: '',
  tipo: 'externa',
  laboratorio: '',
  certificado_numero: '',
  proxima_calibracion: '',
};

const PUNTO_VACIO = {
  punto_medicion: '',
  valor_nominal: '',
  valor_certificado: '',
  unidad: '',
  incertidumbre_U: '',
  factor_k: '',
};

const FORM_DOC_VACIO = {
  categoria: 'otro',
  descripcion: '',
};

const MS_POR_DIA = 24 * 60 * 60 * 1000;

// Arma el dataset del gráfico de deriva a partir de la respuesta del backend
// (mismo cálculo que en Equipment.js).
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

function ControlMetrologico() {
  const [equipos, setEquipos] = useState([]);
  const [alertas, setAlertas] = useState(null);
  const [alertasEstabilidad, setAlertasEstabilidad] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formEquipo, setFormEquipo] = useState(FORM_EQUIPO_VACIO);

  const [selected, setSelected] = useState(null);
  const [detailTab, setDetailTab] = useState('hoja');

  const [showEventForm, setShowEventForm] = useState(false);
  const [formEvento, setFormEvento] = useState(FORM_EVENTO_VACIO);
  const [deriva, setDeriva] = useState(null);
  const [derivaError, setDerivaError] = useState(null);
  const [cartaControl, setCartaControl] = useState(null);
  const [cartaControlError, setCartaControlError] = useState(null);

  const [calibHistory, setCalibHistory] = useState([]);
  const [calibHistoryError, setCalibHistoryError] = useState(null);
  const [showCalibForm, setShowCalibForm] = useState(false);
  const [formCalib, setFormCalib] = useState(FORM_CALIB_VACIO);
  const [puntos, setPuntos] = useState([{ ...PUNTO_VACIO }]);
  const [calibFile, setCalibFile] = useState(null);

  const [bitacora, setBitacora] = useState([]);
  const [bitacoraError, setBitacoraError] = useState(null);
  const [showLogForm, setShowLogForm] = useState(false);
  const [formLog, setFormLog] = useState(FORM_LOG_VACIO);

  const [imagenes, setImagenes] = useState([]);
  const [imagenesError, setImagenesError] = useState(null);
  const [imageUrls, setImageUrls] = useState({});
  const [imageFiles, setImageFiles] = useState(null);

  const [documentos, setDocumentos] = useState([]);
  const [documentosError, setDocumentosError] = useState(null);
  const [showDocForm, setShowDocForm] = useState(false);
  const [formDoc, setFormDoc] = useState(FORM_DOC_VACIO);
  const [docFiles, setDocFiles] = useState(null);

  const objectUrlsRef = useRef([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = { categoria: CATEGORIA, limit: 500 };
      if (filtroEstado) params.estado = filtroEstado;
      const [eqRes, alertRes, estabilidadRes] = await Promise.all([
        equipmentAPI.list(params),
        equipmentAPI.alerts({ categoria: CATEGORIA }),
        equipmentAPI.stabilityAlerts({ categoria: CATEGORIA }),
      ]);
      setEquipos(eqRes.data.data);
      setAlertas(alertRes.data.data);
      setAlertasEstabilidad(estabilidadRes.data.data);
    } catch (err) {
      setError('Error al cargar los equipos de Control Metrológico');
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

  const revocarImagenes = () => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current = [];
  };

  const handleCreateEquipo = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formEquipo, categoria: CATEGORIA };
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
      setDetailTab('hoja');
      setShowEventForm(false);
      setFormEvento(FORM_EVENTO_VACIO);
      setDeriva(null);
      setDerivaError(null);
      setCartaControl(null);
      setCartaControlError(null);
      setShowCalibForm(false);
      setFormCalib(FORM_CALIB_VACIO);
      setPuntos([{ ...PUNTO_VACIO }]);
      setCalibFile(null);
      setShowLogForm(false);
      setFormLog(FORM_LOG_VACIO);
      setShowDocForm(false);
      setFormDoc(FORM_DOC_VACIO);
      setDocFiles(null);
      setImageFiles(null);
    } catch (err) {
      setError('Error al cargar el detalle del equipo');
      console.error(err);
    }
  };

  const closeDetail = () => {
    revocarImagenes();
    setImageUrls({});
    setSelected(null);
  };

  // Deriva y carta de control: mismas rutas que "Equipos Patrones", genéricas
  // por equipment_id.
  useEffect(() => {
    if (!selected) return;
    equipmentAPI.driftAnalysis(selected.id).then((res) => setDeriva(res.data.data)).catch(() => setDerivaError('Error al calcular el análisis de deriva'));
    equipmentAPI.controlChart(selected.id).then((res) => setCartaControl(res.data.data)).catch(() => setCartaControlError('Error al calcular la carta de control'));
    equipmentAPI.calibrationHistory(selected.id).then((res) => setCalibHistory(res.data.data)).catch(() => setCalibHistoryError('Error al cargar el historial de calibración'));
    equipmentAPI.listLogEntries(selected.id).then((res) => setBitacora(res.data.data)).catch(() => setBitacoraError('Error al cargar la bitácora'));
    equipmentAPI.listImages(selected.id).then((res) => setImagenes(res.data.data)).catch(() => setImagenesError('Error al cargar las imágenes'));
    equipmentAPI.listDocuments(selected.id).then((res) => setDocumentos(res.data.data)).catch(() => setDocumentosError('Error al cargar los documentos'));
  }, [selected]);

  // Descarga cada imagen como blob autenticado y arma un object URL para
  // mostrarla inline (mismo patrón que las descargas del resto del sistema).
  useEffect(() => {
    imagenes.forEach((img) => {
      if (imageUrls[img.id]) return;
      equipmentAPI.imageBlob(img.id).then((res) => {
        const url = URL.createObjectURL(res.data);
        objectUrlsRef.current.push(url);
        setImageUrls((prev) => ({ ...prev, [img.id]: url }));
      }).catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagenes]);

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

  const updatePunto = (idx, campo, valor) => {
    setPuntos((prev) => prev.map((p, i) => (i === idx ? { ...p, [campo]: valor } : p)));
  };

  const addPunto = () => setPuntos((prev) => [...prev, { ...PUNTO_VACIO }]);
  const removePunto = (idx) => setPuntos((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const handleCreateCalibHistory = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('fecha_calibracion', formCalib.fecha_calibracion);
      formData.append('tipo', formCalib.tipo);
      if (formCalib.laboratorio) formData.append('laboratorio', formCalib.laboratorio);
      if (formCalib.certificado_numero) formData.append('certificado_numero', formCalib.certificado_numero);
      if (formCalib.proxima_calibracion) formData.append('proxima_calibracion', formCalib.proxima_calibracion);
      // valor_nominal es opcional: si se deja en blanco, se omite en vez de
      // enviar '' (el backend solo trata null/undefined como "sin dato" para
      // esa columna numérica).
      const puntosLimpios = puntos.map((p) => {
        const limpio = { ...p };
        if (limpio.valor_nominal === '') delete limpio.valor_nominal;
        return limpio;
      });
      formData.append('puntos', JSON.stringify(puntosLimpios));
      if (calibFile) formData.append('archivo', calibFile);

      const res = await equipmentAPI.registerCalibrationHistory(selected.id, formData);
      alert(res.data.message);
      setShowCalibForm(false);
      setFormCalib(FORM_CALIB_VACIO);
      setPuntos([{ ...PUNTO_VACIO }]);
      setCalibFile(null);
      openDetail(selected.id);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Error al registrar la calibración';
      setError(msg);
      console.error(err);
    }
  };

  const handleDownloadCertificado = async (historyId, numero) => {
    try {
      const res = await equipmentAPI.downloadCertificate(historyId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificado-${numero || historyId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Error al descargar el certificado');
      console.error(err);
    }
  };

  const handleCreateLogEntry = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formLog };
      Object.keys(payload).forEach((k) => {
        if (payload[k] === '') delete payload[k];
      });
      const res = await equipmentAPI.createLogEntry(selected.id, payload);
      alert(res.data.message);
      setShowLogForm(false);
      setFormLog(FORM_LOG_VACIO);
      openDetail(selected.id);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Error al registrar la entrada de bitácora';
      setError(msg);
      console.error(err);
    }
  };

  const handleUploadImages = async (e) => {
    e.preventDefault();
    if (!imageFiles || imageFiles.length === 0) return;
    try {
      const formData = new FormData();
      Array.from(imageFiles).forEach((file) => formData.append('imagenes', file));
      const res = await equipmentAPI.uploadImages(selected.id, formData);
      alert(res.data.message);
      setImageFiles(null);
      const listRes = await equipmentAPI.listImages(selected.id);
      setImagenes(listRes.data.data);
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Error al subir las imágenes';
      setError(msg);
      console.error(err);
    }
  };

  const handleSetPrincipal = async (imageId) => {
    try {
      await equipmentAPI.setPrincipalImage(imageId);
      const listRes = await equipmentAPI.listImages(selected.id);
      setImagenes(listRes.data.data);
    } catch (err) {
      setError('Error al marcar la imagen como principal');
      console.error(err);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('¿Eliminar esta imagen?')) return;
    try {
      await equipmentAPI.deleteImage(imageId);
      setImagenes((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      setError('Error al eliminar la imagen');
      console.error(err);
    }
  };

  const handleUploadDocuments = async (e) => {
    e.preventDefault();
    if (!docFiles || docFiles.length === 0) return;
    try {
      const formData = new FormData();
      formData.append('categoria', formDoc.categoria);
      if (formDoc.descripcion) formData.append('descripcion', formDoc.descripcion);
      Array.from(docFiles).forEach((file) => formData.append('archivos', file));
      const res = await equipmentAPI.uploadDocuments(selected.id, formData);
      alert(res.data.message);
      setShowDocForm(false);
      setFormDoc(FORM_DOC_VACIO);
      setDocFiles(null);
      const listRes = await equipmentAPI.listDocuments(selected.id);
      setDocumentos(listRes.data.data);
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Error al subir los documentos';
      setError(msg);
      console.error(err);
    }
  };

  const handleDownloadDocument = async (doc) => {
    try {
      const res = await equipmentAPI.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.nombre_original;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Error al descargar el documento');
      console.error(err);
    }
  };

  const hoy = new Date().toISOString().split('T')[0];

  const claseVencimiento = (fecha) => {
    if (!fecha) return '';
    if (fecha < hoy) return 'cm-fecha-vencida';
    const limite = new Date();
    limite.setDate(limite.getDate() + 60);
    if (fecha <= limite.toISOString().split('T')[0]) return 'cm-fecha-proxima';
    return '';
  };

  if (loading && equipos.length === 0) {
    return <div className="loader"></div>;
  }

  return (
    <div className="cm-container">
      <div className="cm-header">
        <h1>Control Metrológico</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? '✕ Cancelar' : '➕ Nuevo equipo'}
        </button>
      </div>
      <p className="cm-subtitle">
        Hoja de vida, análisis de deriva, bitácora con control de cambio, imágenes referenciales
        y documentación (certificados, manuales, protocolos y otros exigidos por NCh-ISO/IEC
        17025, la SEC o el ISP) de los equipos de los laboratorios de la sede Maipú.
      </p>

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
                  <tr key={i} className="cm-row" onClick={() => openDetail(a.equipo_id)}>
                    <td><strong>{a.codigo}</strong> — {a.nombre}</td>
                    <td>{TIPOS_EVENTO[a.tipo]}</td>
                    <td className={a.vencido ? 'cm-fecha-vencida' : 'cm-fecha-proxima'}>{a.fecha_programada}</td>
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
                  <th>Equipo</th>
                  <th>Tipo</th>
                  <th>Punto</th>
                  <th>Mensaje</th>
                  <th>Detectada desde</th>
                </tr>
              </thead>
              <tbody>
                {alertasEstabilidad.map((a) => (
                  <tr key={a.id} className="cm-row" onClick={() => openDetail(a.equipment_id)}>
                    <td><strong>{a.equipo?.codigo}</strong> — {a.equipo?.nombre}</td>
                    <td>{a.tipo}</td>
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
        <div className="card cm-form">
          <h2>Registrar equipo</h2>
          <form onSubmit={handleCreateEquipo}>
            <div className="cm-form-grid">
              <div className="form-group">
                <label>Código interno: *</label>
                <input type="text" value={formEquipo.codigo} onChange={(e) => setFormEquipo({ ...formEquipo, codigo: e.target.value })} placeholder="Ej: L1300" required />
              </div>
              <div className="form-group">
                <label>Nombre: *</label>
                <input type="text" value={formEquipo.nombre} onChange={(e) => setFormEquipo({ ...formEquipo, nombre: e.target.value })} placeholder="Ej: Pie de metro" required />
              </div>
              <div className="form-group">
                <label>Sede:</label>
                <input type="text" value={formEquipo.sede} onChange={(e) => setFormEquipo({ ...formEquipo, sede: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Marca:</label>
                <input type="text" value={formEquipo.marca} onChange={(e) => setFormEquipo({ ...formEquipo, marca: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Modelo:</label>
                <input type="text" value={formEquipo.modelo} onChange={(e) => setFormEquipo({ ...formEquipo, modelo: e.target.value })} />
              </div>
              <div className="form-group">
                <label>N° de serie:</label>
                <input type="text" value={formEquipo.numero_serie} onChange={(e) => setFormEquipo({ ...formEquipo, numero_serie: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Ubicación:</label>
                <input type="text" value={formEquipo.ubicacion} onChange={(e) => setFormEquipo({ ...formEquipo, ubicacion: e.target.value })} placeholder="Ej: Laboratorio de ensayos" />
              </div>
              <div className="form-group">
                <label>Rango:</label>
                <input type="text" value={formEquipo.rango} onChange={(e) => setFormEquipo({ ...formEquipo, rango: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Resolución:</label>
                <input type="text" value={formEquipo.resolucion} onChange={(e) => setFormEquipo({ ...formEquipo, resolucion: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Magnitud:</label>
                <input type="text" value={formEquipo.magnitud} onChange={(e) => setFormEquipo({ ...formEquipo, magnitud: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Norma:</label>
                <input type="text" value={formEquipo.norma} onChange={(e) => setFormEquipo({ ...formEquipo, norma: e.target.value })} placeholder="Ej: NCh-ISO/IEC 17025" />
              </div>
              <div className="form-group">
                <label>Protocolo:</label>
                <input type="text" value={formEquipo.protocolo} onChange={(e) => setFormEquipo({ ...formEquipo, protocolo: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Error máximo permitido:</label>
                <input type="number" step="any" value={formEquipo.error_maximo_permitido} onChange={(e) => setFormEquipo({ ...formEquipo, error_maximo_permitido: e.target.value })} placeholder="Misma unidad que sus puntos calibrados" />
              </div>
              <div className="form-group">
                <label>Responsable:</label>
                <select value={formEquipo.responsable_id} onChange={(e) => setFormEquipo({ ...formEquipo, responsable_id: e.target.value })}>
                  <option value="">— Sin asignar —</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.nombre} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Fecha de ingreso:</label>
                <input type="date" value={formEquipo.fecha_ingreso} onChange={(e) => setFormEquipo({ ...formEquipo, fecha_ingreso: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Observaciones:</label>
              <textarea value={formEquipo.observaciones} onChange={(e) => setFormEquipo({ ...formEquipo, observaciones: e.target.value })} rows="2"></textarea>
            </div>
            <button type="submit" className="btn-primary">Registrar</button>
          </form>
        </div>
      )}

      <div className="cm-filters">
        <label>Filtrar por estado: </label>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="">Todos</option>
          {Object.entries(ESTADOS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {equipos.length === 0 ? (
        <p className="cm-empty">No hay equipos registrados todavía en Control Metrológico.</p>
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
                <tr key={eq.id} onClick={() => openDetail(eq.id)} className="cm-row">
                  <td><strong>{eq.codigo}</strong></td>
                  <td>{eq.nombre}</td>
                  <td><span className={`badge badge-eq-${eq.estado}`}>{ESTADOS[eq.estado]}</span></td>
                  <td className={claseVencimiento(eq.proxima_calibracion)}>{eq.proxima_calibracion || '—'}</td>
                  <td className={claseVencimiento(eq.proximo_mantenimiento)}>{eq.proximo_mantenimiento || '—'}</td>
                  <td>{eq.ubicacion || '—'}</td>
                  <td>{eq.responsable?.nombre || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="cm-modal-overlay" onClick={closeDetail}>
          <div className="cm-modal card" onClick={(e) => e.stopPropagation()}>
            <div className="cm-modal-header">
              <h2>{selected.codigo} — {selected.nombre}</h2>
              <button className="cm-close" onClick={closeDetail}>✕</button>
            </div>

            <div className="cm-tabs">
              {TABS_DETALLE.map((t) => (
                <button key={t.key} className={`cm-tab ${detailTab === t.key ? 'active' : ''}`} onClick={() => setDetailTab(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>

            {detailTab === 'hoja' && (
              <div className="cm-tab-panel">
                <div className="cm-detail-grid">
                  <p><strong>Estado:</strong> <span className={`badge badge-eq-${selected.estado}`}>{ESTADOS[selected.estado]}</span></p>
                  <p><strong>Sede:</strong> {selected.sede || '—'}</p>
                  <p><strong>Marca/Modelo:</strong> {selected.marca || '—'} / {selected.modelo || '—'}</p>
                  <p><strong>N° serie:</strong> {selected.numero_serie || '—'}</p>
                  <p><strong>Ubicación:</strong> {selected.ubicacion || '—'}</p>
                  <p><strong>Rango:</strong> {selected.rango || '—'}</p>
                  <p><strong>Resolución:</strong> {selected.resolucion || '—'}</p>
                  <p><strong>Magnitud:</strong> {selected.magnitud || '—'}</p>
                  <p><strong>Norma:</strong> {selected.norma || '—'}</p>
                  <p><strong>Protocolo:</strong> {selected.protocolo || '—'}</p>
                  <p><strong>Error máximo permitido:</strong> {selected.error_maximo_permitido ?? '—'}</p>
                  <p><strong>Responsable:</strong> {selected.responsable?.nombre || '—'}</p>
                  <p><strong>Ingreso:</strong> {selected.fecha_ingreso || '—'}</p>
                  <p className={claseVencimiento(selected.proxima_calibracion)}><strong>Próx. calibración:</strong> {selected.proxima_calibracion || '—'}</p>
                  <p className={claseVencimiento(selected.proximo_mantenimiento)}><strong>Próx. mantenimiento:</strong> {selected.proximo_mantenimiento || '—'}</p>
                </div>
                {selected.observaciones && <p><strong>Observaciones:</strong> {selected.observaciones}</p>}
              </div>
            )}

            {detailTab === 'historial' && (
              <div className="cm-tab-panel">
                <div className="cm-modal-header">
                  <h3>Historial (6.4.13)</h3>
                  <button className="btn-primary" onClick={() => setShowEventForm(!showEventForm)}>
                    {showEventForm ? '✕ Cancelar' : '➕ Registrar evento'}
                  </button>
                </div>

                {showEventForm && (
                  <form onSubmit={handleCreateEvento} className="cm-subform">
                    <div className="cm-form-grid">
                      <div className="form-group">
                        <label>Tipo: *</label>
                        <select value={formEvento.tipo} onChange={(e) => setFormEvento({ ...formEvento, tipo: e.target.value })} required>
                          {Object.entries(TIPOS_EVENTO).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Fecha de realización: *</label>
                        <input type="date" value={formEvento.fecha_realizacion} onChange={(e) => setFormEvento({ ...formEvento, fecha_realizacion: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label>Proveedor / ejecutor:</label>
                        <input type="text" value={formEvento.proveedor} onChange={(e) => setFormEvento({ ...formEvento, proveedor: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>N° certificado:</label>
                        <input type="text" value={formEvento.certificado_numero} onChange={(e) => setFormEvento({ ...formEvento, certificado_numero: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>Resultado:</label>
                        <select value={formEvento.resultado} onChange={(e) => setFormEvento({ ...formEvento, resultado: e.target.value })}>
                          <option value="">— Sin resultado —</option>
                          <option value="conforme">Conforme</option>
                          <option value="no_conforme">No conforme (genera NC)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Próxima fecha programada:</label>
                        <input type="date" value={formEvento.proxima_fecha} onChange={(e) => setFormEvento({ ...formEvento, proxima_fecha: e.target.value })} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Trazabilidad (6.5):</label>
                      <textarea value={formEvento.trazabilidad} onChange={(e) => setFormEvento({ ...formEvento, trazabilidad: e.target.value })} rows="2" placeholder="Patrón utilizado, laboratorio de calibración, cadena de trazabilidad al SI"></textarea>
                    </div>
                    <div className="form-group">
                      <label>Observaciones:</label>
                      <textarea value={formEvento.observaciones} onChange={(e) => setFormEvento({ ...formEvento, observaciones: e.target.value })} rows="2"></textarea>
                    </div>
                    <button type="submit" className="btn-primary">Guardar evento</button>
                  </form>
                )}

                {(!selected.eventos || selected.eventos.length === 0) ? (
                  <p className="cm-empty">Sin eventos registrados</p>
                ) : (
                  <div className="table-responsive">
                    <table>
                      <thead>
                        <tr><th>Tipo</th><th>Fecha</th><th>Proveedor</th><th>Certificado</th><th>Resultado</th><th>Próxima</th></tr>
                      </thead>
                      <tbody>
                        {selected.eventos.map((ev) => (
                          <tr key={ev.id}>
                            <td>{TIPOS_EVENTO[ev.tipo]}</td>
                            <td>{ev.fecha_realizacion}</td>
                            <td>{ev.proveedor || '—'}</td>
                            <td>{ev.certificado_numero || '—'}</td>
                            <td>{ev.resultado ? (<span className={`badge badge-${ev.resultado}`}>{ev.resultado}</span>) : '—'}</td>
                            <td>{ev.proxima_fecha || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {detailTab === 'calibraciones' && (
              <div className="cm-tab-panel">
                <div className="cm-modal-header">
                  <h3>Historial de calibración</h3>
                  <button className="btn-primary" onClick={() => setShowCalibForm(!showCalibForm)}>
                    {showCalibForm ? '✕ Cancelar' : '➕ Registrar calibración'}
                  </button>
                </div>

                {showCalibForm && (
                  <form onSubmit={handleCreateCalibHistory} className="cm-subform">
                    <div className="cm-form-grid">
                      <div className="form-group">
                        <label>Fecha de calibración: *</label>
                        <input type="date" value={formCalib.fecha_calibracion} onChange={(e) => setFormCalib({ ...formCalib, fecha_calibracion: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label>Tipo: *</label>
                        <select value={formCalib.tipo} onChange={(e) => setFormCalib({ ...formCalib, tipo: e.target.value })} required>
                          <option value="interna">Interna</option>
                          <option value="externa">Externa</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Laboratorio:</label>
                        <input type="text" value={formCalib.laboratorio} onChange={(e) => setFormCalib({ ...formCalib, laboratorio: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>N° certificado:</label>
                        <input type="text" value={formCalib.certificado_numero} onChange={(e) => setFormCalib({ ...formCalib, certificado_numero: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>Próxima calibración:</label>
                        <input type="date" value={formCalib.proxima_calibracion} onChange={(e) => setFormCalib({ ...formCalib, proxima_calibracion: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>Certificado (PDF):</label>
                        <input type="file" accept="application/pdf" onChange={(e) => setCalibFile(e.target.files[0] || null)} />
                      </div>
                    </div>

                    <h4>Puntos calibrados</h4>
                    {puntos.map((p, idx) => (
                      <div className="cm-punto-row" key={idx}>
                        <input type="text" placeholder="Punto" value={p.punto_medicion} onChange={(e) => updatePunto(idx, 'punto_medicion', e.target.value)} required />
                        <input type="number" step="any" placeholder="Valor nominal" value={p.valor_nominal} onChange={(e) => updatePunto(idx, 'valor_nominal', e.target.value)} />
                        <input type="number" step="any" placeholder="Valor certificado" value={p.valor_certificado} onChange={(e) => updatePunto(idx, 'valor_certificado', e.target.value)} required />
                        <input type="text" placeholder="Unidad" value={p.unidad} onChange={(e) => updatePunto(idx, 'unidad', e.target.value)} required />
                        <input type="number" step="any" placeholder="Incertidumbre U" value={p.incertidumbre_U} onChange={(e) => updatePunto(idx, 'incertidumbre_U', e.target.value)} required />
                        <input type="number" step="any" placeholder="Factor k" value={p.factor_k} onChange={(e) => updatePunto(idx, 'factor_k', e.target.value)} required />
                        <button type="button" className="btn-secondary" onClick={() => removePunto(idx)} disabled={puntos.length === 1}>✕</button>
                      </div>
                    ))}
                    <button type="button" className="btn-secondary" onClick={addPunto}>➕ Agregar punto</button>
                    <div style={{ marginTop: 12 }}>
                      <button type="submit" className="btn-primary">Guardar calibración</button>
                    </div>
                  </form>
                )}

                {calibHistoryError && <p className="cm-fecha-vencida">{calibHistoryError}</p>}
                {calibHistory.length === 0 ? (
                  <p className="cm-empty">Sin historial de calibración registrado todavía.</p>
                ) : (
                  <div className="table-responsive">
                    <table>
                      <thead>
                        <tr><th>Fecha</th><th>Tipo</th><th>Punto</th><th>Valor</th><th>U</th><th>Certificado</th></tr>
                      </thead>
                      <tbody>
                        {calibHistory.map((h) => (
                          <tr key={h.id}>
                            <td>{h.fecha_calibracion}</td>
                            <td>{h.tipo}</td>
                            <td>{h.punto_medicion}</td>
                            <td>{h.valor_certificado} {h.unidad}</td>
                            <td>±{h.incertidumbre_U} (k={h.factor_k})</td>
                            <td>
                              {h.certificado_archivo ? (
                                <button className="btn-secondary" onClick={() => handleDownloadCertificado(h.id, h.certificado_numero)}>Descargar</button>
                              ) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <h3>Análisis de deriva</h3>
                {derivaError && <p className="cm-fecha-vencida">{derivaError}</p>}
                {!deriva ? (
                  <p className="cm-empty">Calculando…</p>
                ) : deriva.length === 0 ? (
                  <p className="cm-empty">Sin historial de calibración registrado todavía.</p>
                ) : (
                  deriva.map((analisisPunto) => {
                    const { datos, proyeccion } = construirDatosGrafico(analisisPunto);
                    return (
                      <div key={analisisPunto.punto_medicion} className="cm-deriva-punto">
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
                                    <ReferenceDot x={proyeccion.fecha} y={proyeccion.valor_proyectado} r={5} fill="#c0392b" stroke="none" label={{ value: 'Proyección', position: 'top', fill: '#c0392b', fontSize: 11 }} />
                                  )}
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                            <p>
                              Pendiente: {analisisPunto.pendiente.toFixed(8)} {analisisPunto.historial[0].unidad}/día
                              {proyeccion && (<> — Proyección al {proyeccion.fecha}: {proyeccion.valor_proyectado.toFixed(6)} {analisisPunto.historial[0].unidad}</>)}
                            </p>
                            {analisisPunto.alerta_error_maximo && (
                              <p className={analisisPunto.alerta_error_maximo.supera ? 'cm-fecha-vencida' : ''}>
                                {analisisPunto.alerta_error_maximo.supera ? '⚠️ ' : '✓ '}{analisisPunto.alerta_error_maximo.motivo}
                              </p>
                            )}
                          </>
                        )}
                        {analisisPunto.alerta_incertidumbre_creciente.creciente && (
                          <p className="cm-fecha-proxima">⚠️ {analisisPunto.alerta_incertidumbre_creciente.motivo}</p>
                        )}
                      </div>
                    );
                  })
                )}

                <h3>Carta de control</h3>
                {cartaControlError && <p className="cm-fecha-vencida">{cartaControlError}</p>}
                {!cartaControl ? (
                  <p className="cm-empty">Calculando…</p>
                ) : cartaControl.length === 0 ? (
                  <p className="cm-empty">Sin historial de calibración registrado todavía.</p>
                ) : (
                  cartaControl.map((analisisPunto) => (
                    <div key={analisisPunto.punto_medicion} className="cm-deriva-punto">
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
                          <p>Media: {analisisPunto.limites.media.toFixed(6)} — Límites de control: [{analisisPunto.limites.limite_inferior.toFixed(6)}, {analisisPunto.limites.limite_superior.toFixed(6)}]</p>
                          {analisisPunto.puntos_fuera_de_control.length > 0 && (
                            <p className="cm-fecha-vencida">⚠️ {analisisPunto.puntos_fuera_de_control.length} punto(s) fuera de control: {analisisPunto.puntos_fuera_de_control.map((p) => `${p.fecha_calibracion} (${p.valor_certificado})`).join(', ')}</p>
                          )}
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {detailTab === 'bitacora' && (
              <div className="cm-tab-panel">
                <div className="cm-modal-header">
                  <h3>Bitácora del instrumento</h3>
                  <button className="btn-primary" onClick={() => setShowLogForm(!showLogForm)}>
                    {showLogForm ? '✕ Cancelar' : '➕ Nueva entrada'}
                  </button>
                </div>

                {showLogForm && (
                  <form onSubmit={handleCreateLogEntry} className="cm-subform">
                    <div className="cm-form-grid">
                      <div className="form-group">
                        <label>Fecha: *</label>
                        <input type="date" value={formLog.fecha} onChange={(e) => setFormLog({ ...formLog, fecha: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label>Tipo: *</label>
                        <select value={formLog.tipo} onChange={(e) => setFormLog({ ...formLog, tipo: e.target.value })} required>
                          {Object.entries(TIPOS_LOG).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Estado resultante:</label>
                        <select value={formLog.estado_resultante} onChange={(e) => setFormLog({ ...formLog, estado_resultante: e.target.value })}>
                          <option value="">— Sin cambio de estado —</option>
                          {Object.entries(ESTADOS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Esto corrige la entrada:</label>
                        <select value={formLog.corrige_entrada_id} onChange={(e) => setFormLog({ ...formLog, corrige_entrada_id: e.target.value })}>
                          <option value="">— No corrige ninguna —</option>
                          {bitacora.map((b) => (
                            <option key={b.id} value={b.id}>{b.fecha} — {TIPOS_LOG[b.tipo]}: {b.descripcion.slice(0, 40)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Descripción: *</label>
                      <textarea value={formLog.descripcion} onChange={(e) => setFormLog({ ...formLog, descripcion: e.target.value })} rows="3" required></textarea>
                    </div>
                    <button type="submit" className="btn-primary">Guardar entrada</button>
                  </form>
                )}

                {bitacoraError && <p className="cm-fecha-vencida">{bitacoraError}</p>}
                {bitacora.length === 0 ? (
                  <p className="cm-empty">Sin entradas de bitácora todavía.</p>
                ) : (
                  bitacora.map((b) => (
                    <div key={b.id} className="cm-bitacora-entry">
                      <p><strong>{b.fecha}</strong> — {TIPOS_LOG[b.tipo]} {b.estado_resultante && (<span className={`badge badge-eq-${b.estado_resultante}`}>{ESTADOS[b.estado_resultante]}</span>)}</p>
                      <p>{b.descripcion}</p>
                      {b.entradaCorregida && (
                        <p className="cm-bitacora-corrige">Corrige la entrada del {b.entradaCorregida.fecha} ({TIPOS_LOG[b.entradaCorregida.tipo]}: {b.entradaCorregida.descripcion.slice(0, 60)})</p>
                      )}
                      <p className="cm-bitacora-corrige">Registrado por {b.registrador?.nombre || '—'}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {detailTab === 'imagenes' && (
              <div className="cm-tab-panel">
                <form onSubmit={handleUploadImages} className="cm-subform">
                  <div className="form-group">
                    <label>Subir imágenes referenciales:</label>
                    <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setImageFiles(e.target.files)} />
                  </div>
                  <button type="submit" className="btn-primary">Subir</button>
                </form>

                {imagenesError && <p className="cm-fecha-vencida">{imagenesError}</p>}
                {imagenes.length === 0 ? (
                  <p className="cm-empty">Sin imágenes cargadas todavía.</p>
                ) : (
                  <div className="cm-images-grid">
                    {imagenes.map((img) => (
                      <div key={img.id} className={`cm-image-card ${img.es_principal ? 'principal' : ''}`}>
                        {img.es_principal && <span className="cm-badge-principal">Principal</span>}
                        {imageUrls[img.id] ? (
                          <img src={imageUrls[img.id]} alt={img.nombre_original} />
                        ) : (
                          <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando…</div>
                        )}
                        <div className="cm-image-actions">
                          {!img.es_principal && (
                            <button className="btn-secondary" onClick={() => handleSetPrincipal(img.id)}>★ Principal</button>
                          )}
                          <button className="btn-secondary" onClick={() => handleDeleteImage(img.id)}>Eliminar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {detailTab === 'documentos' && (
              <div className="cm-tab-panel">
                <div className="cm-modal-header">
                  <h3>Documentos</h3>
                  <button className="btn-primary" onClick={() => setShowDocForm(!showDocForm)}>
                    {showDocForm ? '✕ Cancelar' : '➕ Subir documento'}
                  </button>
                </div>

                {showDocForm && (
                  <form onSubmit={handleUploadDocuments} className="cm-subform">
                    <div className="cm-form-grid">
                      <div className="form-group">
                        <label>Categoría:</label>
                        <select value={formDoc.categoria} onChange={(e) => setFormDoc({ ...formDoc, categoria: e.target.value })}>
                          {Object.entries(CATEGORIAS_DOC).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Archivo(s): *</label>
                        <input type="file" multiple onChange={(e) => setDocFiles(e.target.files)} required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Descripción:</label>
                      <textarea value={formDoc.descripcion} onChange={(e) => setFormDoc({ ...formDoc, descripcion: e.target.value })} rows="2" placeholder="Ej: Manual de usuario v2, exigido por SEC"></textarea>
                    </div>
                    <button type="submit" className="btn-primary">Subir</button>
                  </form>
                )}

                {documentosError && <p className="cm-fecha-vencida">{documentosError}</p>}
                {documentos.length === 0 ? (
                  <p className="cm-empty">Sin documentos cargados todavía.</p>
                ) : (
                  <div className="table-responsive">
                    <table>
                      <thead>
                        <tr><th>Categoría</th><th>Nombre</th><th>Descripción</th><th>Subido por</th><th></th></tr>
                      </thead>
                      <tbody>
                        {documentos.map((doc) => (
                          <tr key={doc.id}>
                            <td className="cm-doc-categoria">{CATEGORIAS_DOC[doc.categoria]}</td>
                            <td>{doc.nombre_original}</td>
                            <td>{doc.descripcion || '—'}</td>
                            <td>{doc.usuario?.nombre || '—'}</td>
                            <td><button className="btn-secondary" onClick={() => handleDownloadDocument(doc)}>Descargar</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ControlMetrologico;
