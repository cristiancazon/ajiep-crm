import React, { useState, useEffect } from 'react';
import { directus, SOCIO_ROLE_ID } from '../lib/directus';
import { 
  readUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  readItems, 
  readMe 
} from '@directus/sdk';
import { 
  UserCog,
  Search,
  Mail,
  Shield,
  Circle,
  Plus,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function Usuarios() {
  const [users, setUsers] = useState([]);
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    status: 'active',
    socio_id: '',
    role: SOCIO_ROLE_ID
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const me = await directus.request(readMe());
      setCurrentUser(me);

      if (me.es_administrador) {
        const [usersRes, sociosRes] = await Promise.all([
          directus.request(readUsers({
            filter: {
              role: {
                _eq: SOCIO_ROLE_ID
              }
            }
          })),
          directus.request(readItems('socios'))
        ]);
        setUsers(usersRes);
        setSocios(sociosRes);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        password: '', // Password always empty initially for security
        status: user.status || 'active',
        socio_id: user.socio_id || '',
        role: SOCIO_ROLE_ID
      });
    } else {
      setEditingUser(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        status: 'active',
        socio_id: '',
        role: SOCIO_ROLE_ID
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData };
      
      // Si estamos editando y el password está vacío, no lo enviamos para no resetearlo
      if (editingUser && !payload.password) {
        delete payload.password;
      }
      
      // Si socio_id está vacío, lo enviamos como null
      if (!payload.socio_id) payload.socio_id = null;

      if (editingUser) {
        await directus.request(updateUser(editingUser.id, payload));
      } else {
        await directus.request(createUser(payload));
      }
      
      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error al guardar el usuario: ' + (error.message || 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este usuario permanentemente?')) {
      try {
        await directus.request(deleteUser(id));
        await fetchData();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('No se pudo eliminar el usuario.');
      }
    }
  };

  const getSocioName = (id) => {
    const s = socios.find(socio => socio.id === id);
    return s ? s.nombre : 'Sin asignar';
  };

  const filteredUsers = users.filter(u => 
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando usuarios...</div>;

  if (!currentUser?.es_administrador) {
    return <div className="card">Acceso restringido a administradores.</div>;
  }

  return (
    <div className="usuarios-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: '1', minWidth: '280px' }}>
          <div className="card ghost-border" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', backgroundColor: 'var(--surface-container-low)' }}>
            <Search size={18} color="var(--on-surface-variant)" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o correo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem' }}
            />
          </div>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: 'auto', whiteSpace: 'nowrap' }}>
          <Plus size={18} />
          <span className="hide-mobile">Nuevo Usuario</span>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {filteredUsers.map(user => (
          <div key={user.id} className="card ghost-border" style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                backgroundColor: 'rgba(0, 94, 184, 0.1)', 
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <UserCog size={24} />
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.first_name} {user.last_name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--on-surface-variant)', fontSize: '0.8rem', marginBottom: '4px' }}>
                  <Mail size={12} />
                  {user.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '500' }}>
                  <Shield size={12} />
                  {getSocioName(user.socio_id)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--outline-variant)', paddingTop: '1rem' }}>
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px', 
                fontSize: '0.7rem', 
                padding: '2px 8px', 
                borderRadius: '10px', 
                backgroundColor: user.status === 'active' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(0,0,0,0.05)',
                color: user.status === 'active' ? '#166534' : 'var(--on-surface-variant)',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>
                <Circle size={8} fill={user.status === 'active' ? '#166534' : 'gray'} />
                {user.status === 'active' ? 'Activo' : 'Inactivo'}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleOpenModal(user)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--outline-variant)', backgroundColor: 'transparent', cursor: 'pointer', color: 'var(--primary)' }}>
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(user.id)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--outline-variant)', backgroundColor: 'transparent', cursor: 'pointer', color: 'var(--error)' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredUsers.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--on-surface-variant)' }}>
            No se encontraron usuarios.
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card"
              style={{ padding: '2rem', width: '95%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>{editingUser ? 'Editar Usuario Socio' : 'Nuevo Usuario Socio'}</h3>
                <button onClick={handleCloseModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem' }}>Nombre</label>
                    <input 
                      type="text" 
                      value={formData.first_name} 
                      onChange={e => setFormData({ ...formData, first_name: e.target.value })} 
                      required 
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--outline-variant)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem' }}>Apellido</label>
                    <input 
                      type="text" 
                      value={formData.last_name} 
                      onChange={e => setFormData({ ...formData, last_name: e.target.value })} 
                      required 
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--outline-variant)' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem' }}>Correo Electrónico</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({ ...formData, email: e.target.value })} 
                    required 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--outline-variant)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem' }}>Contraseña {editingUser && '(dejar en blanco para mantener)'}</label>
                  <input 
                    type="password" 
                    value={formData.password} 
                    onChange={e => setFormData({ ...formData, password: e.target.value })} 
                    required={!editingUser}
                    placeholder={editingUser ? 'Sin cambios' : 'Mínimo 8 caracteres'}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--outline-variant)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem' }}>Asignar Socio (Empresa)</label>
                  <select 
                    value={formData.socio_id} 
                    onChange={e => setFormData({ ...formData, socio_id: e.target.value })} 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--outline-variant)', backgroundColor: 'white' }}
                  >
                    <option value="">-- Sin asignar --</option>
                    {socios.map(socio => (
                      <option key={socio.id} value={socio.id}>{socio.nombre}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.85rem' }}>Estado</label>
                    <select 
                      value={formData.status} 
                      onChange={e => setFormData({ ...formData, status: e.target.value })} 
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--outline-variant)', backgroundColor: 'white' }}
                    >
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo / Bloqueado</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'var(--surface-container-high)', fontSize: '0.75rem', color: 'var(--on-surface-variant)', width: '100%' }}>
                      <strong>Rol:</strong> Socio Filial
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={handleCloseModal} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--outline-variant)', background: 'transparent', cursor: 'pointer', fontWeight: '600' }}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '10px 24px' }}>
                    {saving ? 'Guardando...' : 'Guardar Usuario'}
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

export default Usuarios;
