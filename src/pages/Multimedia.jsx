import React, { useState, useEffect } from 'react';
import { directus, DIRECTUS_URL } from '../lib/directus';
import { 
  readItems, 
  createItem, 
  updateItem, 
  deleteItem, 
  uploadFiles, 
  readMe 
} from '@directus/sdk';
import { 
  Image as ImageIcon, 
  Film, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Upload,
  Search,
  MoreVertical,
  PlayCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function Multimedia() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);
    try {
      const [meRes, itemsRes] = await Promise.all([
        directus.request(readMe()),
        directus.request(readItems('multimedia', {
          fields: ['*', 'archivos.*', 'archivos.directus_files_id.*'],
          sort: ['-date_created']
        }))
      ]);
      setUser(meRes);
      setItems(itemsRes);
    } catch (err) {
      console.error('Error fetching multimedia:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        nombre: item.nombre || '',
        descripcion: item.descripcion || ''
      });
    } else {
      setEditingItem(null);
      setFormData({
        nombre: '',
        descripcion: ''
      });
    }
    setSelectedFiles([]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ nombre: '', descripcion: '' });
    setSelectedFiles([]);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let uploadedFileIds = [];

      // 1. Subir archivos nuevos si los hay
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const fileForm = new FormData();
          // Carpeta para Multimedia (puedes ajustar el ID si tienes una específica)
          fileForm.append('file', file);
          
          const uploadRes = await directus.request(uploadFiles(fileForm));
          uploadedFileIds.push(Array.isArray(uploadRes) ? uploadRes[0].id : uploadRes.id);
        }
      }

      const archivosPayload = uploadedFileIds.map(id => ({
        directus_files_id: id
      }));

      const payload = {
        ...formData,
        // Si estamos editando, mantenemos los archivos anteriores o agregamos los nuevos
        // En Directus, para M2M, si enviamos un array de objetos se agregan.
        // Si queremos REEMPLAZAR, tendríamos que manejarlo de otra forma, 
        // pero aquí vamos a agregar los nuevos a los existentes por simplicidad.
        archivos: archivosPayload
      };

      if (editingItem) {
        // Para actualizar y mantener archivos viejos + nuevos:
        // Directus maneja el delta si se pasan los IDs. 
        // Aquí simplemente enviamos los nuevos para que se adjunten.
        await directus.request(updateItem('multimedia', editingItem.id, payload));
      } else {
        await directus.request(createItem('multimedia', payload));
      }

      await fetchInitialData();
      handleCloseModal();
    } catch (err) {
      console.error('Error saving multimedia:', err);
      alert('Error al guardar el registro multimedia.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este registro?')) {
      try {
        await directus.request(deleteItem('multimedia', id));
        await fetchInitialData();
      } catch (err) {
        console.error('Error deleting multimedia:', err);
        alert('No se pudo eliminar el registro.');
      }
    }
  };

  const filteredItems = items.filter(item => 
    item.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileUrl = (fileId) => `${DIRECTUS_URL}assets/${fileId}`;

  const isVideo = (type) => type?.startsWith('video/');

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando galería multimedia...</div>;

  return (
    <div className="multimedia-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ flex: '1', minWidth: '280px' }}>
          <h2 style={{ fontSize: '1.75rem' }}>Galería Multimedia</h2>
          <p style={{ color: 'var(--on-surface-variant)' }}>Fotos y videos institucionales de AJIEP.</p>
        </div>
        {user?.es_administrador && (
          <button className="btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} />
            Subir Contenido
          </button>
        )}
      </div>

      <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center', padding: '1.5rem' }}>
        <div style={{ position: 'relative', flex: '1' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', color: 'var(--on-surface-variant)' }} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o descripción..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '40px', width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-low)' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
        {filteredItems.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
            No se encontraron registros multimedia.
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className="card ghost-border" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Preview Area (First file) */}
              <div style={{ height: '200px', backgroundColor: '#000', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.archivos && item.archivos.length > 0 ? (
                  <>
                    {isVideo(item.archivos[0].directus_files_id.type) ? (
                      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <video 
                          src={getFileUrl(item.archivos[0].directus_files_id.id)} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
                        />
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate' }}>
                           <PlayCircle size={48} color="white" />
                        </div>
                      </div>
                    ) : (
                      <img 
                        src={getFileUrl(item.archivos[0].directus_files_id.id)} 
                        alt={item.nombre}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                    {item.archivos.length > 1 && (
                      <div style={{ position: 'absolute', bottom: '12px', right: '12px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700' }}>
                        +{item.archivos.length - 1} archivos
                      </div>
                    )}
                  </>
                ) : (
                  <ImageIcon size={48} color="rgba(255,255,255,0.2)" />
                )}
              </div>

              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0 }}>{item.nombre}</h4>
                  {user?.es_administrador && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleOpenModal(item)} style={{ color: 'var(--primary)', background: 'transparent', border: 'none', cursor: 'pointer' }}><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(item.id)} style={{ color: 'var(--error)', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                    </div>
                  )}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginBottom: '1rem', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.descripcion || 'Sin descripción.'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--on-surface-variant)', fontSize: '0.75rem' }}>
                   {item.archivos?.some(a => isVideo(a.directus_files_id.type)) ? <Film size={14} /> : <ImageIcon size={14} />}
                   {item.archivos?.length || 0} Archivos • {new Date(item.date_created).toLocaleDateString()}
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
              style={{ padding: '2rem', width: '100%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>{editingItem ? 'Editar Multimedia' : 'Nuevo Registro Multimedia'}</h3>
                <button onClick={handleCloseModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.85rem' }}>Nombre / Evento</label>
                  <input 
                    type="text" 
                    value={formData.nombre} 
                    onChange={e => setFormData({ ...formData, nombre: e.target.value })} 
                    required 
                    placeholder="Ej. Cena Anual de Socios 2024"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--outline-variant)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.85rem' }}>Descripción</label>
                  <textarea 
                    rows="3"
                    value={formData.descripcion} 
                    onChange={e => setFormData({ ...formData, descripcion: e.target.value })} 
                    placeholder="Describe el contenido de las fotos o videos..."
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--outline-variant)', resize: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.85rem' }}>Archivos (Fotos y Videos)</label>
                  <div style={{ 
                    border: '2px dashed var(--outline-variant)', 
                    padding: '1.5rem', 
                    borderRadius: '12px', 
                    textAlign: 'center',
                    backgroundColor: 'rgba(0, 94, 184, 0.02)',
                    position: 'relative'
                  }}>
                    <input 
                      type="file" 
                      multiple
                      onChange={handleFileChange}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    />
                    <Upload size={24} color="var(--on-surface-variant)" style={{ marginBottom: '8px' }} />
                    <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: 0 }}>
                      Pulsa para seleccionar múltiples archivos
                    </p>
                  </div>
                  
                  {selectedFiles.length > 0 && (
                    <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} style={{ position: 'relative', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--outline-variant)' }}>
                          {file.type.startsWith('image/') ? (
                            <img src={URL.createObjectURL(file)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0' }}>
                              <Film size={20} />
                            </div>
                          )}
                          <button 
                            type="button"
                            onClick={() => removeFile(idx)}
                            style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(255,0,0,0.7)', color: 'white', border: 'none', padding: '2px', cursor: 'pointer' }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {editingItem?.archivos?.length > 0 && (
                     <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: '8px' }}>
                        Nota: Los nuevos archivos se añadirán a los {editingItem.archivos.length} ya existentes.
                     </p>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={handleCloseModal} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--outline-variant)', background: 'transparent', cursor: 'pointer', fontWeight: '600' }}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '10px 24px' }}>
                    {saving ? 'Subiendo...' : (editingItem ? 'Actualizar' : 'Guardar Multimedia')}
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

export default Multimedia;
