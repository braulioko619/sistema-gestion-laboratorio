import React, { useState, useEffect } from 'react';
import { documentsAPI, usersAPI } from '../services/api';
import './Documents.css';

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'procedimiento',
    contenido: '',
  });
  const [files, setFiles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [users, setUsers] = useState([]);
  const [openAuth, setOpenAuth] = useState(null);
  const [authorizations, setAuthorizations] = useState({});
  const [authForm, setAuthForm] = useState({ usuario_id: '', fecha_autorizacion: '' });

  useEffect(() => {
    fetchDocuments();
    usersAPI.list().then((res) => setUsers(res.data.data)).catch(() => setUsers([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentsAPI.list(pagination);
      setDocuments(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      setError('Error al cargar documentos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateDocument = async (e) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => payload.append(key, value));
      files.forEach(file => payload.append('archivos', file));
      await documentsAPI.create(payload);
      setFormData({ titulo: '', descripcion: '', tipo: 'procedimiento', contenido: '' });
      setFiles([]);
      setShowForm(false);
      fetchDocuments();
      alert('Documento creado exitosamente');
    } catch (err) {
      setError('Error al crear documento');
      console.error(err);
    }
  };

  const handleDownloadAttachment = async (documentId, attachment) => {
    try {
      const response = await documentsAPI.downloadAttachment(documentId, attachment.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.nombre_original;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(`No se pudo descargar ${attachment.nombre_original}`);
    }
  };

  const toggleAuthorizations = async (docId) => {
    if (openAuth === docId) {
      setOpenAuth(null);
      return;
    }
    setOpenAuth(docId);
    if (!authorizations[docId]) {
      try {
        const res = await documentsAPI.authorizations(docId);
        setAuthorizations((prev) => ({ ...prev, [docId]: res.data.data }));
      } catch (err) {
        setError('Error al cargar autorizaciones');
      }
    }
  };

  const handleGrantAuthorization = async (docId, e) => {
    e.preventDefault();
    try {
      await documentsAPI.grantAuthorization(docId, {
        usuario_id: authForm.usuario_id,
        fecha_autorizacion: authForm.fecha_autorizacion || undefined,
      });
      const res = await documentsAPI.authorizations(docId);
      setAuthorizations((prev) => ({ ...prev, [docId]: res.data.data }));
      setAuthForm({ usuario_id: '', fecha_autorizacion: '' });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al otorgar la autorización');
    }
  };

  const handleRevokeAuthorization = async (docId, authorizationId) => {
    try {
      await documentsAPI.revokeAuthorization(docId, authorizationId);
      const res = await documentsAPI.authorizations(docId);
      setAuthorizations((prev) => ({ ...prev, [docId]: res.data.data }));
    } catch (err) {
      setError('Error al revocar la autorización');
    }
  };

  if (loading && documents.length === 0) {
    return <div className="loader"></div>;
  }

  return (
    <div className="documents-container">
      <div className="documents-header">
        <h1>Documentos</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? '✕ Cancelar' : '➕ Nuevo Documento'}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {showForm && (
        <div className="card document-form">
          <h2>Crear Nuevo Documento</h2>
          <form onSubmit={handleCreateDocument}>
            <div className="form-row">
              <div className="form-group">
                <label>Título:</label>
                <input
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tipo:</label>
                <select name="tipo" value={formData.tipo} onChange={handleInputChange}>
                  <option value="procedimiento">Procedimiento</option>
                  <option value="politica">Política</option>
                  <option value="manual">Manual</option>
                  <option value="registro">Registro</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Descripción:</label>
              <input
                type="text"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Contenido:</label>
              <textarea
                name="contenido"
                value={formData.contenido}
                onChange={handleInputChange}
                rows="6"
              ></textarea>
            </div>

            <div className="form-group">
              <label>Archivos adjuntos (opcional):</label>
              <input
                type="file"
                multiple
                accept=".pdf,.csv,.txt,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
              />
              {files.length > 0 && <small>{files.length} archivo(s) seleccionado(s).</small>}
            </div>

            <button type="submit" className="btn-primary">Crear Documento</button>
          </form>
        </div>
      )}

      <div className="documents-list">
        {documents.length === 0 ? (
          <div className="empty-state">
            <p>No hay documentos disponibles</p>
          </div>
        ) : (
          documents.map(doc => (
            <div key={doc.id} className="document-card">
              <div className="doc-header">
                <h3>{doc.titulo}</h3>
                <span className={`badge badge-${doc.estado}`}>{doc.estado}</span>
              </div>
              <p className="doc-description">{doc.descripcion}</p>
              <div className="doc-meta">
                <small>Tipo: {doc.tipo} | Versión: {doc.version_actual}</small>
              </div>
              {doc.adjuntos?.length > 0 && (
                <div className="doc-attachments">
                  {doc.adjuntos.map(attachment => (
                    <button
                      key={attachment.id}
                      type="button"
                      className="attachment-link"
                      onClick={() => handleDownloadAttachment(doc.id, attachment)}
                    >
                      📎 {attachment.nombre_original}
                    </button>
                  ))}
                </div>
              )}
              <button type="button" className="btn-secondary" onClick={() => toggleAuthorizations(doc.id)}>
                {openAuth === doc.id ? '✕ Cerrar autorizaciones' : '🔑 Autorizaciones'}
              </button>
              {openAuth === doc.id && (
                <div className="authorization-matrix">
                  <form onSubmit={(e) => handleGrantAuthorization(doc.id, e)} className="authorization-form">
                    <select
                      value={authForm.usuario_id}
                      onChange={(e) => setAuthForm({ ...authForm, usuario_id: e.target.value })}
                      required
                    >
                      <option value="">— Persona a autorizar —</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.nombre} ({u.email})</option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={authForm.fecha_autorizacion}
                      onChange={(e) => setAuthForm({ ...authForm, fecha_autorizacion: e.target.value })}
                    />
                    <button type="submit" className="btn-primary">Otorgar</button>
                  </form>
                  <table className="matrix-table">
                    <thead>
                      <tr>
                        <th>Persona</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(authorizations[doc.id] || []).map(auth => (
                        <tr key={auth.id}>
                          <td>{auth.usuario?.nombre} ({auth.usuario?.email})</td>
                          <td><span className={`badge badge-${auth.estado}`}>{auth.estado}</span></td>
                          <td>{auth.fecha_autorizacion}</td>
                          <td>
                            {auth.estado === 'autorizado' && (
                              <button type="button" className="btn-danger" onClick={() => handleRevokeAuthorization(doc.id, auth.id)}>Revocar</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {documents.length > 0 && (
        <div className="pagination">
          <button 
            onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
            disabled={pagination.page === 1}
          >
            ← Anterior
          </button>
          <span>Página {pagination.page} de {pagination.pages}</span>
          <button 
            onClick={() => setPagination(p => ({ ...p, page: Math.min(pagination.pages, p.page + 1) }))}
            disabled={pagination.page === pagination.pages}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}

export default Documents;
