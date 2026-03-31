import React, { useState, useEffect } from 'react';
import { directus } from '../lib/directus';
import { readItems, updateItem, readSingleton, updateSingleton, readMe } from '@directus/sdk';
import { 
  CreditCard, 
  ArrowUpCircle, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Users,
  Settings,
  Save,
  Bell
} from 'lucide-react';

function Dashboard() {
  const [socio, setSocio] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminStats, setAdminStats] = useState({ totalSocios: 0, pendingPayments: 0 });
  const [config, setConfig] = useState({ valor_cuota_actual: 0 });
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const me = await directus.request(readMe());
      setUser(me);

      if (me.es_administrador) {
        const [socList, payList, confData, unreadData] = await Promise.all([
          directus.request(readItems('socios')),
          directus.request(readItems('pagos', { filter: { estado: { _eq: 'Pendiente' } } })),
          directus.request(readSingleton('configuracion')),
          directus.request(readItems('notificaciones', { 
            filter: { 
              receptor_socio_id: { _null: true },
              leido: { _eq: false } 
            } 
          }))
        ]);
        setAdminStats({
          totalSocios: socList.length,
          pendingPayments: payList.length
        });
        setConfig(confData || { valor_cuota_actual: 0 });
        setUnreadCount(unreadData.length);
      } else if (me.socio_id) {
        const [socioData, confData, unreadData] = await Promise.all([
          directus.request(readItems('socios', { filter: { id: { _eq: me.socio_id } } })),
          directus.request(readSingleton('configuracion')),
          directus.request(readItems('notificaciones', { 
            filter: { 
              receptor_socio_id: { _eq: me.socio_id },
              leido: { _eq: false } 
            } 
          }))
        ]);
        if (socioData && socioData.length > 0) {
          setSocio(socioData[0]);
        }
        setConfig(confData || { valor_cuota_actual: 0 });
        setUnreadCount(unreadData.length);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('No se pudo cargar la información.');
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateConfig = async () => {
    setIsSavingConfig(true);
    try {
      await directus.request(updateSingleton('configuracion', config));
      alert('Configuración actualizada correctamente');
    } catch (err) {
      console.error('Error updating config:', err);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const socioStats = [
    { label: 'Estado', value: socio ? socio.estado : 'N/A', icon: <Clock />, color: 'var(--secondary)' },
    { label: 'Cuota Actual', value: `$${parseFloat(config.valor_cuota_actual).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`, icon: <CheckCircle />, color: 'var(--success)' },
    { label: 'Notificaciones', value: unreadCount > 0 ? `${unreadCount} nuevas` : 'Al día', icon: <Bell />, color: unreadCount > 0 ? 'var(--error)' : 'var(--on-surface-variant)' },
  ];

  const adminStatsItems = [
    { label: 'Total Socios', value: adminStats.totalSocios, icon: <Users />, color: 'var(--primary)' },
    { label: 'Pagos Pendientes', value: adminStats.pendingPayments, icon: <Clock />, color: 'var(--error)' },
    { label: 'Nuevos Broadcast', value: unreadCount, icon: <Bell />, color: unreadCount > 0 ? 'var(--primary)' : 'var(--on-surface-variant)' },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando portal...</div>;

  return (
    <div className="dashboard">
      {user?.es_administrador && (
        <div style={{ backgroundColor: 'rgba(0, 94, 184, 0.05)', padding: '12px 24px', borderRadius: '8px', marginBottom: '2rem', border: '1px dashed var(--primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertCircle size={20} color="var(--primary)" />
          <span style={{ fontWeight: '600', color: 'var(--primary)' }}>MODO ADMINISTRADOR ACTIVADO</span>
        </div>
      )}

      <div className="stats-grid" style={{ marginBottom: '3rem' }}>
        {(user?.es_administrador ? adminStatsItems : socioStats).map((stat) => (
          <div key={stat.label} className="card ghost-border" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'var(--surface-container-low)', color: stat.color }}>
              {stat.icon}
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontWeight: '500' }}>{stat.label}</p>
              <h2 style={{ fontSize: '1.5rem' }}>{stat.value}</h2>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: user?.es_administrador ? '1.5fr 1fr' : '1fr 340px', gap: '1.5rem' }}>
        <section className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>{user?.es_administrador ? 'Últimos Movimientos Socios' : 'Información de la Organización'}</h3>
          
          {user?.es_administrador ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
              <p>Monitoreo global de la asociación.</p>
              <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => window.location.href = '/billing'}>Gestionar Pagos</button>
            </div>
          ) : (
            socio ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div><p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>RAZÓN SOCIAL</p><p style={{ fontWeight: '700' }}>{socio.nombre}</p></div>
                <div><p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>CUIT</p><p style={{ fontWeight: '700' }}>{socio.cuit || 'N/A'}</p></div>
                <div><p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>EMAIL</p><p style={{ fontWeight: '700' }}>{socio.email_contacto || 'N/A'}</p></div>
                <div><p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>TELÉFONO</p><p style={{ fontWeight: '700' }}>{socio.telefono || 'N/A'}</p></div>
              </div>
            ) : (
              <p style={{ color: 'var(--on-surface-variant)' }}>Sin vinculación a socio.</p>
            )
          )}
        </section>

        <section className="card" style={{ backgroundColor: 'var(--surface-container-low)' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>{user?.es_administrador ? 'Configuración cuota' : 'Acciones Rápidas'}</h3>
          {user?.es_administrador ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Valor de Cuota Mensual ($)</label>
                <input 
                  type="text" 
                  value={new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(config.valor_cuota_actual || 0)} 
                  onChange={e => {
                    const rawValue = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                    setConfig({...config, valor_cuota_actual: parseInt(rawValue) || 0});
                  }}
                  style={{ backgroundColor: 'white' }}
                />
              </div>
              <button className="btn-primary" onClick={handleUpdateConfig} disabled={isSavingConfig} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <Save size={18} />
                {isSavingConfig ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button className="btn-primary" style={{ width: '100%', height: '48px' }} onClick={() => window.location.href = '/billing'}>Informar Pago</button>
              <button className="card ghost-border" style={{ width: '100%', fontWeight: '600', height: '48px' }} onClick={() => window.location.href = '/biblio'}>Ver Biblioteca</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
