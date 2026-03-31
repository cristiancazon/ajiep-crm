import React, { useState, useEffect } from 'react';
import { directus } from '../lib/directus';
import { readItems, createItem, updateItem, deleteItem, readMe } from '@directus/sdk';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Users,
  Search,
  X,
  AlertCircle
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
    saldo_cuenta_corriente: 0,
    estado: 'Activo' 
  });
  const [saving, setSaving] = useState(false);

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
        estado: socio.estado || 'Activo'
      });
    } else {
      setEditingSocio(null);
      setFormData({
        nombre: '',
        email_contacto: '',
        telefono: '',
        cuit: '',
        saldo_cuenta_corriente: 0,
        estado: 'Activo'
      });
    }
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
      const payload = {
        nombre: formData.nombre.trim(),
        email_contacto: formData.email_contacto.trim(),
        telefono: formData.telefono.trim(),
        cuit: formData.cuit.trim(),
        saldo_cuenta_corriente: parseFloat(formData.saldo_cuenta_corriente) || 0,
        estado: formData.estado
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
    s.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email_contacto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.cuit?.includes(searchTerm)
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
              placeholder="Buscar socio por nombre o CUIT..." 
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
              <th style={{ padding: '16px', fontWeight: '600', color: 'var(--on-surface-variant)' }}>Nombre / Contacto</th>
              <th style={{ padding: '16px', fontWeight: '600', color: 'var(--on-surface-variant)' }}>CUIT</th>
              <th style={{ padding: '16px', fontWeight: '600', color: 'var(--on-surface-variant)' }}>Saldo ($)</th>
              <th style={{ padding: '16px', fontWeight: '600', color: 'var(--on-surface-variant)' }}>Estado</th>
              <th style={{ padding: '16px', fontWeight: '600', color: 'var(--on-surface-variant)', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredSocios.map(socio => (
              <tr key={socio.id} style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ fontWeight: '600' }}>{socio.nombre || 'Sin nombre'}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>{socio.email_contacto || '-'} ({socio.telefono || '-'})</div>
                </td>
                <td style={{ padding: '16px' }}>{socio.cuit || 'No registrado'}</td>
                <td style={{ padding: '16px', fontWeight: '600', color: socio.saldo_cuenta_corriente < 0 ? 'var(--error)' : 'var(--primary)' }}>
                  $ {Number(socio.saldo_cuenta_corriente || 0).toLocaleString('es-AR')}
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
                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
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
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>CUIT *</label>
                  <input 
                    type="text" 
                    value={formData.cuit} 
                    onChange={e => setFormData({ ...formData, cuit: e.target.value })} 
                    required 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--outline-variant)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Saldo CC ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.saldo_cuenta_corriente} 
                    onChange={e => setFormData({ ...formData, saldo_cuenta_corriente: e.target.value })} 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--outline-variant)' }}
                  />
                  <small style={{ color: 'var(--on-surface-variant)', display: 'block', marginTop: '4px' }}>Valores positivos indican deuda a favor de AJIEP.</small>
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
