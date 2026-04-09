import React, { useState, useEffect } from 'react';
import { directus } from '../lib/directus';
import { readItems, createItem, updateItem, deleteItem, readMe, uploadFiles } from '@directus/sdk';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Users,
  Search,
  X,
  AlertCircle,
  Upload,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function Socios() {
  const [user, setUser] = useState(null);
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSocio, setEditingSocio] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email_contacto: '',
    telefono: '',
    cuit: '',
    estado: 'Activo',
    avatar: null
  });
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const me = await directus.request(readMe());
      setUser(me);

      if (me.es_administrador) {
        const response = await directus.request(readItems('socios'));
        setSocios(response);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (socio = null) => {
    if (socio) {
      setEditingSocio(socio);
      setFormData({
        nombre: socio.nombre || '',
        email_contacto: socio.email_contacto || '',
        telefono: socio.telefono || '',
        cuit: socio.cuit || '',
        saldo_cuenta_corriente: socio.saldo_cuenta_corriente || 0,
        estado: socio.estado || 'Activo',
        avatar: socio.avatar || null
      });
    } else {
      setEditingSocio(null);
      setFormData({
        nombre: '',
        email_contacto: '',
        telefono: '',
        cuit: '',
        saldo_cuenta_corriente: 0,
        estado: 'Activo',
        avatar: null
      });
    }
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSocio(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let avatarId = formData.avatar;

      // 1. Subir logo si hay uno seleccionado
      if (selectedFile) {
        const fileData = new FormData();
        fileData.append('file', selectedFile);
        const uploadRes = await directus.request(uploadFiles(fileData));
        avatarId = Array.isArray(uploadRes) ? uploadRes[0].id : uploadRes.id;
      }

      const payload = {
        nombre: formData.nombre.trim(),
        email_contacto: formData.email_contacto.trim(),
        telefono: formData.telefono.trim(),
        cuit: (formData.cuit || '123456').trim(),
        saldo_cuenta_corriente: parseFloat(formData.saldo_cuenta_corriente) || 0,
        estado: formData.estado,
        avatar: avatarId
      };

      if (editingSocio) {
        await directus.request(updateItem('socios', editingSocio.id, payload));
      } else {
        await directus.request(createItem('socios', payload));
      }
      
      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error guardando socio:', error);
      alert('Ocurrió un error al guardar el socio. ' + (error.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este socio permanentemente?')) {
      try {
        await directus.request(deleteItem('socios', id));
        await fetchData();
      } catch (error) {
        console.error('Error eliminando socio:', error);
        alert('No se pudo eliminar el socio. Es posible que tenga registros (pagos) asociados.');
      }
    }
  };

  const filteredSocios = socios.filter(s => 
    s.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Cargando directorio...</div>;

  if (!user?.es_administrador) {
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', textAlign: 'center' }}>
        <AlertCircle size={48} color="var(--error)" style={{ marginBottom: '1rem' }} />
        <h2>Acceso Denegado</h2>
        <p style={{ color: 'var(--on-surface-variant)' }}>Solamente los administradores pueden acceder al directorio completo de Socios.</p>
      </div>
    );
  }

  return (
    <div className="socios-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1', minWidth: '280px' }}>
          <div className="card ghost-border" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', backgroundColor: 'var(--surface-container-low)' }}>
            <Search size={18} color="var(--on-surface-variant)" />
            <input 
              type="text" 
              placeholder="Buscar socio por nombre..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem' }}
            />
          </div>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: 'auto', whiteSpace: 'nowrap' }}>
          <Plus size={18} />
          <span className="hide-mobile">Nuevo Socio</span>
          <span className="show-mobile" style={{ display: 'none' }}>Nuevo</span>
        </button>
      </div>

      <style>
        {`
          @media (max-width: 768px) {
            .show-mobile { display: block !important; }
            .hide-mobile { display: none !important; }
          }
        `}
      </style>

      <div className="table-container card ghost-border" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--outline-variant)' }}>
              <th style={{ padding: '16px', fontWeight: '600', color: 'var(--on-surface-variant)', width: '80px' }}>Logo</th>
              <th style={{ padding: '16px', fontWeight: '600', color: 'var(--on-surface-variant)' }}>Nombre</th>
              <th style={{ padding: '16px', fontWeight: '600', color: 'var(--on-surface-variant)' }}>Estado</th>
              <th style={{ padding: '16px', fontWeight: '600', color: 'var(--on-surface-variant)', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredSocios.map(socio => (
              <tr key={socio.id} style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                <td style={{ padding: '16px' }}>
                  {socio.avatar ? (
                    <img 
                      src={`${directus.url}assets/${socio.avatar}?width=60&height=60&fit=cover`} 
                      alt={socio.nombre} 
                      style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--outline-variant)' }} 
                    />
                  ) : (
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-surface-variant)' }}>
                      <Users size={24} />
                    </div>
                  )}
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ fontWeight: '600' }}>{socio.nombre || 'Sin nombre'}</div>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    padding: '4px 12px', 
                    borderRadius: '16px', 
                    fontSize: '0.8rem', 
                    fontWeight: '600',
                    backgroundColor: socio.estado === 'Activo' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255, 99, 71, 0.1)',
                    color: socio.estado === 'Activo' ? '#166534' : 'var(--error)'
                  }}>
                    {socio.estado || 'Inactivo'}
                  </span>
                </td>
                <td style={{ padding: '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button onClick={() => handleOpenModal(socio)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--outline-variant)', backgroundColor: 'transparent', cursor: 'pointer', color: 'var(--primary)' }}>
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(socio.id)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--outline-variant)', backgroundColor: 'transparent', cursor: 'pointer', color: 'var(--error)' }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredSocios.length === 0 && (
              <tr>
                <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                  No se encontraron socios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
                <h3 style={{ margin: 0 }}>{editingSocio ? 'Editar Socio' : 'Nuevo Socio'}</h3>
                <button onClick={handleCloseModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Nombre del Socio/Empresa *</label>
                  <input 
                    type="text" 
                    value={formData.nombre} 
                    onChange={e => setFormData({ ...formData, nombre: e.target.value })} 
                    required 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--outline-variant)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Email de Contacto</label>
                  <input 
                    type="email" 
                    value={formData.email_contacto} 
                    onChange={e => setFormData({ ...formData, email_contacto: e.target.value })} 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--outline-variant)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Teléfono</label>
                  <input 
                    type="text" 
                    value={formData.telefono} 
                    onChange={e => setFormData({ ...formData, telefono: e.target.value })} 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--outline-variant)' }}
                  />
                </div>


                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Estado</label>
                  <select 
                    value={formData.estado} 
                    onChange={e => setFormData({ ...formData, estado: e.target.value })} 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--outline-variant)' }}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.85rem' }}>Logo del Socio (Imagen)</label>
                  <div style={{ 
                    border: '2px dashed var(--outline-variant)', 
                    padding: '1.5rem', 
                    borderRadius: '12px', 
                    textAlign: 'center',
                    backgroundColor: selectedFile ? 'rgba(0, 94, 184, 0.05)' : 'transparent',
                    position: 'relative',
                    transition: 'all 0.2s'
                  }}>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => setSelectedFile(e.target.files[0])}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    />
                    {selectedFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--primary)' }}>
                        <Camera size={20} />
                        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{selectedFile.name}</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        {formData.avatar ? (
                          <img 
                            src={`${directus.url}assets/${formData.avatar}?width=60&height=60`} 
                            alt="Preview" 
                            style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', marginBottom: '8px' }} 
                          />
                        ) : (
                          <Upload size={24} color="var(--on-surface-variant)" />
                        )}
                        <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: 0 }}>
                          {formData.avatar ? 'Haz click para cambiar el logo' : 'Arrastra o haz click para subir logo'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={handleCloseModal} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--outline-variant)', background: 'transparent', cursor: 'pointer', fontWeight: '600' }}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '10px 24px' }}>
                    {saving ? 'Guardando...' : 'Guardar Socio'}
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

export default Socios;
