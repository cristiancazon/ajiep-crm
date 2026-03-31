import React, { useState, useEffect } from 'react';
import { directus } from '../lib/directus';
import { 
  readItems, 
  createItem, 
  updateItem, 
  deleteItem, 
  uploadFiles, 
  readMe 
} from '@directus/sdk';
import { 
  BookOpen, 
  Search, 
  Download, 
  FileBadge, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Upload,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function Biblio() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [user, setUser] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    categoria: 'Otros'
  });

  const categories = ['Todas', 'Estatuto', 'Actas', 'Convenios', 'Otros'];
  const formCategories = ['Estatuto', 'Actas', 'Convenios', 'Otros'];

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);
    try {
      const [meRes, docsRes] = await Promise.all([
        directus.request(readMe()),
        directus.request(readItems('biblio', {
          sort: ['-fecha_creacion']
        }))
      ]);
      setUser(meRes);
      setDocs(docsRes);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (doc = null) => {
    if (doc) {
      setEditingDoc(doc);
      setFormData({
        titulo: doc.titulo || '',
        descripcion: doc.descripcion || '',
        categoria: doc.categoria || 'Otros'
      });
    } else {
      setEditingDoc(null);
      setFormData({
        titulo: '',
        descripcion: '',
        categoria: 'Otros'
      });
    }
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDoc(null);
    setFormData({ titulo: '', descripcion: '', categoria: 'Otros' });
    setSelectedFile(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let archivoId = editingDoc?.archivo;

      // 1. Subir archivo si hay uno nuevo seleccionado
      if (selectedFile) {
        const fileForm = new FormData();
        fileForm.append('folder', '7f880ab0-7c87-44c4-9dc6-41c0d7003cd1');
        fileForm.append('file', selectedFile);
        
        const uploadRes = await directus.request(uploadFiles(fileForm));
        // Directus SDK v17 uploadFiles returns the file object (or array of objects)
        archivoId = Array.isArray(uploadRes) ? uploadRes[0].id : uploadRes.id;
      }

      const payload = {
        ...formData,
        archivo: archivoId,
        fecha_creacion: editingDoc ? editingDoc.fecha_creacion : new Date().toISOString()
      };

      if (editingDoc) {
        await directus.request(updateItem('biblio', editingDoc.id, payload));
      } else {
        await directus.request(createItem('biblio', payload));
      }

      await fetchInitialData();
      handleCloseModal();
    } catch (err) {
      console.error('Error saving document:', err);
      alert('Error al guardar el documento.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este documento?')) {
      try {
        await directus.request(deleteItem('biblio', id));
        await fetchInitialData();
      } catch (err) {
        console.error('Error deleting document:', err);
        alert('No se pudo eliminar el documento.');
      }
    }
  };

  const filteredDocs = docs.filter(doc => {
    const titleMatch = doc.titulo?.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = activeCategory === 'Todas' || doc.categoria === activeCategory;
    return titleMatch && categoryMatch;
  });

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando biblioteca...</div>;

  return (
    <div className="biblio-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ flex: '1', minWidth: '280px' }}>
          <h2 style={{ fontSize: '1.75rem' }}>Biblioteca Digital</h2>
          <p style={{ color: 'var(--on-surface-variant)' }}>Estatutos, actas, convenios y documentos institucionales.</p>
        </div>
        {user?.es_administrador && (
          <button className="btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} />
            Nuevo Documento
          </button>
        )}
      </div>

      <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center', padding: '1.5rem' }}>
        <div style={{ position: 'relative', flex: '1' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', color: 'var(--on-surface-variant)' }} />
          <input 
            type="text" 
            placeholder="Buscar por título..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '40px', width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-low)' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{ 
                padding: '10px 16px', 
                fontSize: '0.85rem', 
                fontWeight: '600',
                borderRadius: '8px',
                border: activeCategory === cat ? 'none' : '1px solid var(--outline-variant)',
                backgroundColor: activeCategory === cat ? 'var(--primary)' : 'transparent',
                color: activeCategory === cat ? 'white' : 'var(--on-surface-variant)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {filteredDocs.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
            No se encontraron documentos en esta categoría.
          </div>
        ) : (
          filteredDocs.map(doc => (
            <div key={doc.id} className="card ghost-border" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(0, 94, 184, 0.1)', color: 'var(--primary)' }}>
                    <FileBadge size={24} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', backgroundColor: 'var(--surface-container-high)', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
                      {doc.categoria}
                    </span>
                  </div>
                </div>
                <h4 style={{ marginBottom: '0.5rem', lineHeight: '1.4' }}>{doc.titulo}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginBottom: '1.5rem', minHeight: '3rem', lineClamp: 3, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {doc.descripcion}
                </p>
              </div>
              
              <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                  {new Date(doc.fecha_creacion).toLocaleDateString()}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {user?.es_administrador && (
                    <>
                      <button onClick={() => handleOpenModal(doc)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--outline-variant)', background: 'transparent', color: 'var(--primary)', cursor: 'pointer' }}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(doc.id)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--outline-variant)', background: 'transparent', color: 'var(--error)', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                  {doc.archivo && (
                    <a 
                      href={`${directus.url}assets/${doc.archivo}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="btn-primary" 
                      style={{ padding: '8px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                    >
                      <Download size={16} /> Abrir
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Admin Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card"
              style={{ padding: '2rem', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>{editingDoc ? 'Editar Documento' : 'Nuevo Registro Biblioteca'}</h3>
                <button onClick={handleCloseModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.85rem' }}>Título del Documento</label>
                  <input 
                    type="text" 
                    value={formData.titulo} 
                    onChange={e => setFormData({ ...formData, titulo: e.target.value })} 
                    required 
                    placeholder="Ej. Acta de Asamblea 2024"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--outline-variant)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.85rem' }}>Categoría</label>
                  <select 
                    value={formData.categoria} 
                    onChange={e => setFormData({ ...formData, categoria: e.target.value })} 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--outline-variant)', backgroundColor: 'white' }}
                  >
                    {formCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.85rem' }}>Descripción / Notas</label>
                  <textarea 
                    rows="3"
                    value={formData.descripcion} 
                    onChange={e => setFormData({ ...formData, descripcion: e.target.value })} 
                    placeholder="Breve resumen del contenido..."
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--outline-variant)', resize: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.85rem' }}>Archivo Adjunto (Opcional)</label>
                  <div style={{ 
                    border: '2px dashed var(--outline-variant)', 
                    padding: '1.5rem', 
                    borderRadius: '12px', 
                    textAlign: 'center',
                    backgroundColor: selectedFile ? 'rgba(0, 94, 184, 0.05)' : 'transparent',
                    position: 'relative'
                  }}>
                    <input 
                      type="file" 
                      onChange={e => setSelectedFile(e.target.files[0])}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    />
                    {selectedFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--primary)' }}>
                        <FileText size={20} />
                        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{selectedFile.name}</span>
                      </div>
                    ) : (
                      <>
                        <Upload size={24} color="var(--on-surface-variant)" style={{ marginBottom: '8px' }} />
                        <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: 0 }}>
                          Arrastra o pulsa para subir un documento
                        </p>
                      </>
                    )}
                  </div>
                  {editingDoc?.archivo && !selectedFile && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '8px' }}>
                      ✓ Ya existe un archivo adjunto. Sube uno nuevo para reemplazarlo.
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" onClick={handleCloseModal} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--outline-variant)', background: 'transparent', cursor: 'pointer', fontWeight: '600' }}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '10px 24px' }}>
                    {saving ? 'Guardando...' : (editingDoc ? 'Actualizar' : 'Guardar Registro')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Biblio;
