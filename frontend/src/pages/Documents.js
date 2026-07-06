import React, { useState, useEffect } from 'react';
import { documentsAPI } from '../services/api';
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
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  useEffect(() => {
    fetchDocuments();
  }, [pagination]);

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
      await documentsAPI.create(formData);
      setFormData({ titulo: '', descripcion: '', tipo: 'procedimiento', contenido: '' });
      setShowForm(false);
      fetchDocuments();
      alert('Documento creado exitosamente');
    } catch (err) {
      setError('Error al crear documento');
      console.error(err);
    }
  };

  if (loading && documents.length === 0) {
    return <div className="loader"></div>;
  }

  return (
    <div className="documents-container">
      <div className="documents-header">
        <h1>📄 Documentos</h1>
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
