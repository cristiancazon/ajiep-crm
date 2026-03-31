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
  FileText, 
  Search, 
  Download, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Upload,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function EstadosContables() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    nombre: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);
    try {
      const [meRes, docsRes] = await Promise.all([
        directus.request(readMe()),
        directus.request(readItems('estados_contables', {
          sort: ['-nombre']
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
        nombre: doc.nombre || ''
      });
    } else {
      setEditingDoc(null);
      setFormData({
        nombre: ''
      });
    }
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDoc(null);
    setFormData({ nombre: '' });
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
        archivoId = Array.isArray(uploadRes) ? uploadRes[0].id : uploadRes.id;
      }

      const payload = {
        ...formData,
        archivo: archivoId
      };

      if (editingDoc) {
        await directus.request(updateItem('estados_contables', editingDoc.id, payload));
      } else {
        await directus.request(createItem('estados_contables', payload));
      }

      await fetchInitialData();
      handleCloseModal();
    } catch (err) {
      console.error('Error saving document:', err);
      alert('Error al guardar el estado contable.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este registro?')) {
      try {
        await directus.request(deleteItem('estados_contables', id));
        await fetchInitialData();
      } catch (err) {
        console.error('Error deleting document:', err);
        alert('No se pudo eliminar el registro.');
      }
    }
  };

  const filteredDocs = docs.filter(doc => 
    doc.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando estados contables...</div>;

  return (
    <div className="estados-contables-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ flex: '1', minWidth: '280px' }}>
          <h2 style={{ fontSize: '1.75rem' }}>Estados Contables</h2>
          <p style={{ color: 'var(--on-surface-variant)' }}>Balances y estados financieros anuales de la asociación.</p>
        </div>
        {user?.es_administrador && (
          <button className="btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} />
            Nuevo Estado Contable
          </button>
        )}
      </div>

      <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', color: 'var(--on-surface-variant)' }} />
          <input 
            type="text" 
            placeholder="Buscar por año o nombre..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '40px', width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-low)' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {filteredDocs.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
            No se encontraron documentos registrados.
          </div>
        ) : (
          filteredDocs.map(doc => (
            <div key={doc.id} className="card ghost-border" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(0, 94, 184, 0.1)', color: 'var(--primary)' }}>
                  <Calendar size={24} />
                </div>
                <div>
                  <h4 style={{ margin: 0 }}>{doc.nombre}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>PDF / Descargable</span>
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
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
                    style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                  >
                    <Download size={18} /> Abrir Balance
                  </a>
                )}
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
              style={{ padding: '2rem', width: '100%', maxWidth: '450px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>{editingDoc ? 'Editar Estado Contable' : 'Subir Nuevo Balance'}</h3>
                <button onClick={handleCloseModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.85rem' }}>Nombre / Año</label>
                  <input 
                    type="text" 
                    value={formData.nombre} 
                    onChange={e => setFormData({ ...formData, nombre: e.target.value })} 
                    required 
                    placeholder="Ej. Balance General 2023"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--outline-variant)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.85rem' }}>Archivo de Balance (PDF)</label>
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
                      <div style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '0.9rem' }}>
                        {selectedFile.name}
                      </div>
                    ) : (
                      <>
                        <Upload size={24} color="var(--on-surface-variant)" style={{ marginBottom: '8px' }} />
                        <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: 0 }}>
                          Arrastra o pulsa para subir el PDF
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={handleCloseModal} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--outline-variant)', background: 'transparent', cursor: 'pointer', fontWeight: '600' }}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving || (!editingDoc && !selectedFile)} className="btn-primary" style={{ padding: '10px 24px' }}>
                    {saving ? 'Guardando...' : (editingDoc ? 'Actualizar' : 'Guardar Balance')}
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

export default EstadosContables;
