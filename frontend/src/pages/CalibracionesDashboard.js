import React, { useState, useEffect, useCallback } from 'react';
import { dashboardAPI } from '../services/api';
import './CalibracionesDashboard.css';

const ORDEN_ESTADOS = {
  recibida: 'Recibida',
  en_proceso: 'En proceso',
  calibrada: 'Calibrada',
  certificado_emitido: 'Certificado emitido',
  lista_para_facturar: 'Lista para facturar',
  entregada: 'Entregada',
  cancelada: 'Cancelada',
};

const COTIZACION_ESTADOS = {
  borrador: 'Borrador',
  emitida: 'Emitida',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  anulada: 'Anulada',
};

function money(value) {
  return `CLP ${Number(value || 0).toLocaleString('es-CL')}`;
}

// Dashboard general del módulo: resumen de OT, cotizaciones y clientes, más
// el "proceso" (embudo de etapas por las que pasa una OT de principio a fin).
function CalibracionesDashboard({ onVerOrdenTrabajo, onVerCotizacion }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await dashboardAPI.calibraciones();
      setData(res.data.data);
    } catch (err) {
      setError('Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) return <div className="loader"></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data) return null;

  const maxFunnel = Math.max(...data.procesos.funnel.map((f) => f.cantidad), 1);

  return (
    <div className="dash-container">
      <div className="dash-grid">
        <div className="card dash-card">
          <h3>Órdenes de Trabajo</h3>
          <div className="dash-stat-row">
            <div className="dash-stat">
              <span className="dash-value">{data.ordenes_trabajo.total}</span>
              <span>Total</span>
            </div>
            <div className="dash-stat dash-stat-danger">
              <span className="dash-value">{data.ordenes_trabajo.vencidas}</span>
              <span>Vencidas</span>
            </div>
            <div className="dash-stat">
              <span className="dash-value">{data.ordenes_trabajo.por_estado.entregada || 0}</span>
              <span>Entregadas</span>
            </div>
          </div>
          {data.ordenes_trabajo.recientes.length === 0 ? (
            <p className="dash-vacio">Sin órdenes recientes</p>
          ) : (
            <table className="dash-mini-table">
              <tbody>
                {data.ordenes_trabajo.recientes.map((ot) => (
                  <tr key={ot.id} className="dash-row" onClick={() => onVerOrdenTrabajo && onVerOrdenTrabajo(ot.id)}>
                    <td><strong>{ot.codigo}</strong></td>
                    <td>{ot.cliente?.nombre || '—'}</td>
                    <td><span className={`badge badge-ot-${ot.estado}`}>{ORDEN_ESTADOS[ot.estado]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card dash-card">
          <h3>Cotizaciones</h3>
          <div className="dash-stat-row">
            <div className="dash-stat">
              <span className="dash-value">{data.cotizaciones.total}</span>
              <span>Total</span>
            </div>
            <div className="dash-stat">
              <span className="dash-value">{data.cotizaciones.por_estado.aceptada || 0}</span>
              <span>Aceptadas</span>
            </div>
            <div className="dash-stat">
              <span className="dash-value">{money(data.cotizaciones.monto_aceptado_mes)}</span>
              <span>Aceptado este mes</span>
            </div>
          </div>
          {data.cotizaciones.recientes.length === 0 ? (
            <p className="dash-vacio">Sin cotizaciones recientes</p>
          ) : (
            <table className="dash-mini-table">
              <tbody>
                {data.cotizaciones.recientes.map((c) => (
                  <tr key={c.id} className="dash-row" onClick={() => onVerCotizacion && onVerCotizacion(c.id)}>
                    <td><strong>{c.codigo}</strong></td>
                    <td>{c.cliente?.nombre || '—'}</td>
                    <td><span className={`badge badge-cot-${c.estado}`}>{COTIZACION_ESTADOS[c.estado]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card dash-card">
          <h3>Clientes</h3>
          <div className="dash-stat-row">
            <div className="dash-stat">
              <span className="dash-value">{data.clientes.total}</span>
              <span>Total</span>
            </div>
            <div className="dash-stat">
              <span className="dash-value">{data.clientes.activos}</span>
              <span>Activos</span>
            </div>
            <div className="dash-stat">
              <span className="dash-value">{data.clientes.nuevos_mes}</span>
              <span>Nuevos este mes</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card dash-card dash-full">
        <h3>Proceso de la orden de trabajo</h3>
        <div className="dash-funnel">
          {data.procesos.funnel.map((f) => (
            <div className="dash-funnel-row" key={f.estado}>
              <span className="dash-funnel-label">{ORDEN_ESTADOS[f.estado]}</span>
              <div className="dash-funnel-bar-track">
                <div className="dash-funnel-bar" style={{ width: `${(f.cantidad / maxFunnel) * 100}%` }}></div>
              </div>
              <span className="dash-funnel-value">{f.cantidad}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CalibracionesDashboard;
