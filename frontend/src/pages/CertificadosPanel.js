import React, { useState, useEffect, useCallback } from 'react';
import { certificatesAPI } from '../services/api';
import './Calibraciones.css';

const CERT_ESTADOS = {
  borrador: 'Borrador',
  firmado: 'Firmado',
  emitido: 'Emitido',
  enviado: 'Enviado',
  superseded: 'Superado (enmendado)',
};

const FILTRO_VACIO = { search: '', cliente_id: '', estado: '' };

// Repositorio de certificados: base de datos consultable de todo lo emitido,
// con el cliente, el número de certificado y la OT asociada. Complementa el
// camino normal (OT -> ítem -> certificado) para cuando se busca al revés:
// desde el número de certificado, el instrumento o el cliente.
function CertificadosPanel({ clientes, onVerOrdenTrabajo }) {
  const [certificados, setCertificados] = useState([]);
  const [paginacion, setPaginacion] = useState({ total: 0, page: 1, pages: 1 });
  const [filtro, setFiltro] = useState(FILTRO_VACIO);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCertificados = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (filtro.search) params.search = filtro.search;
      if (filtro.cliente_id) params.cliente_id = filtro.cliente_id;
      if (filtro.estado) params.estado = filtro.estado;
      const res = await certificatesAPI.list(params);
      setCertificados(res.data.data);
      setPaginacion(res.data.pagination);
    } catch (err) {
      setError('Error al cargar el repositorio de certificados');
    } finally {
      setLoading(false);
    }
  }, [filtro, page]);

  // El buscador es texto libre: se espera a que el usuario deje de escribir
  // para no disparar una consulta por tecla.
  useEffect(() => {
    const timer = setTimeout(fetchCertificados, 300);
    return () => clearTimeout(timer);
  }, [fetchCertificados]);

  const handleFiltroChange = (campo, valor) => {
    setFiltro((prev) => ({ ...prev, [campo]: valor }));
    setPage(1);
  };

  const handleDescargar = async (cert) => {
    try {
      const res = await certificatesAPI.download(cert.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', cert.nombre_original || `${cert.codigo}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(`No se pudo descargar el certificado ${cert.codigo}`);
    }
  };

  return (
    <div>
      {error && (
        <div className="alert alert-danger" onClick={() => setError(null)}>{error}</div>
      )}

      <div className="cal-filtros">
        <div className="form-group">
          <label>Buscar:</label>
          <input
            type="text"
            value={filtro.search}
            onChange={(e) => handleFiltroChange('search', e.target.value)}
            placeholder="N° certificado, OT, cliente, RUT o instrumento"
          />
        </div>
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
            {Object.entries(CERT_ESTADOS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="cal-nota">
        {paginacion.total} certificado(s) en el repositorio. Los certificados enmendados quedan
        como "Superado" y no se eliminan, para mantener la trazabilidad.
      </p>

      {loading ? (
        <div className="loader"></div>
      ) : certificados.length === 0 ? (
        <p>No se encontraron certificados con esos criterios</p>
      ) : (
        <>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>N° Certificado</th>
                  <th>Cliente</th>
                  <th>Orden de trabajo</th>
                  <th>Instrumento</th>
                  <th>Fecha emisión</th>
                  <th>Estado</th>
                  <th>Alcance</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {certificados.map((cert) => {
                  const orden = cert.item?.ordenTrabajo;
                  const instrumento = cert.item?.instrumento;
                  return (
                    <tr key={cert.id}>
                      <td>
                        <strong>{cert.codigo}</strong>
                        {cert.certificadoOriginal && (
                          <div className="cal-enmienda-nota">Enmienda de {cert.certificadoOriginal.codigo}</div>
                        )}
                      </td>
                      <td>
                        {orden?.cliente?.nombre || '—'}
                        {orden?.cliente?.identificacion_fiscal && (
                          <div className="cal-enmienda-nota">{orden.cliente.identificacion_fiscal}</div>
                        )}
                      </td>
                      <td>
                        {orden ? (
                          <button
                            type="button"
                            className="cal-link-btn"
                            onClick={() => onVerOrdenTrabajo && onVerOrdenTrabajo(orden.id)}
                          >
                            {orden.codigo}
                          </button>
                        ) : '—'}
                      </td>
                      <td>
                        {instrumento
                          ? `${instrumento.codigo_interno} (${instrumento.tipo_instrumento})`
                          : '—'}
                      </td>
                      <td>{cert.fecha_emision || '—'}</td>
                      <td><span className={`badge badge-cert-${cert.estado}`}>{CERT_ESTADOS[cert.estado]}</span></td>
                      <td>{cert.acreditado ? 'Acreditado' : 'No acreditado'}</td>
                      <td>
                        {cert.nombre_almacenado && (
                          <button type="button" className="btn-secondary" onClick={() => handleDescargar(cert)}>
                            ⬇️ Descargar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {paginacion.pages > 1 && (
            <div className="cal-paginacion">
              <button
                type="button"
                className="btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                ← Anterior
              </button>
              <span>Página {paginacion.page} de {paginacion.pages}</span>
              <button
                type="button"
                className="btn-secondary"
                disabled={page >= paginacion.pages}
                onClick={() => setPage(page + 1)}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CertificadosPanel;
