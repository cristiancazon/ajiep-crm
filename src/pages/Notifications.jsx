import React, { useState, useEffect } from 'react';
import { directus } from '../lib/directus';
import { readItems, createItem, updateItem, readMe } from '@directus/sdk';
import { 
  Bell, 
  Send, 
  Search, 
  MessageCircle, 
  CheckCheck, 
  CornerDownRight, 
  UserCircle 
} from 'lucide-react';

function Notifications() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMsg, setNewMsg] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [socios, setSocios] = useState([]);
  const [me, setMe] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      const userData = await directus.request(readMe());
      setMe(userData);
      
      const socioList = await directus.request(readItems('socios'));
      setSocios(socioList.filter(s => s.id !== userData.socio_id));

      const msgData = await directus.request(readItems('notificaciones', {
        filter: { 
          _or: [
            { emisor_socio_id: { _eq: userData.socio_id } },
            { receptor_socio_id: { _eq: userData.socio_id } },
            { receptor_socio_id: { _null: true } }
          ]
        },
        sort: ['-fecha_envio'],
        limit: 50
      }));
      setMessages(msgData);

      // Auto-marcar como leídas las notificaciones para mí que están pendientes
      const unreadIds = msgData
        .filter(m => m.receptor_socio_id === userData.socio_id && !m.leido)
        .map(m => m.id);

      if (unreadIds.length > 0) {
        await Promise.all(unreadIds.map(id => 
          directus.request(updateItem('notificaciones', id, { leido: true }))
        ));
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg) return;
    try {
      await directus.request(createItem('notificaciones', {
        emisor_socio_id: me.socio_id,
        receptor_socio_id: selectedRecipient || null,
        mensaje: newMsg,
        fecha_envio: new Date().toISOString()
      }));
      setNewMsg('');
      fetchInitialData();
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return (
    <div className="notifications-page">
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.75rem' }}>Mensajería y Notificaciones</h2>
        <p style={{ color: 'var(--on-surface-variant)' }}>Comunícate directamente con otros afiliados o envía mensajes a la administración.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '2rem' }}>
        <aside className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3>Enviar Mensaje</h3>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>Para (Socio)</label>
              <select 
                value={selectedRecipient} 
                onChange={e => setSelectedRecipient(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-low)' }}
              >
                <option value="">A todos los afiliados (Broadcast)</option>
                {socios.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600' }}>Mensaje</label>
              <textarea 
                rows="4"
                placeholder="Escribe tu mensaje aquí..." 
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                required
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-low)', resize: 'none' }}
              />
            </div>
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '48px' }}>
              <Send size={18} />
              Enviar Mensaje
            </button>
          </form>
          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--surface-container-low)', borderRadius: '12px' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: '500' }}>Sugerencia:</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Los mensajes marcados como "Broadcast" serán visibles para todos los miembros de la asociación.</p>
          </div>
        </aside>

        <section className="card">
          <div style={{ borderBottom: '1px solid var(--outline-variant)', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MessageCircle size={24} color="var(--primary)" />
            <h3 style={{ margin: 0 }}>Bandeja de Entrada</h3>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando mensajes...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {messages.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--on-surface-variant)' }}>No se encontraron notificaciones.</p>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className="ghost-border" style={{ padding: '1.5rem', borderRadius: '12px', backgroundColor: msg.emisor_socio_id === me.socio_id ? 'var(--surface-container-lowest)' : 'var(--surface-container-low)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserCircle size={20} color={msg.emisor_socio_id === me.socio_id ? 'var(--primary)' : 'var(--secondary)'} />
                        <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>
                          {msg.emisor_socio_id === me.socio_id ? 'Tú' : socios.find(s => s.id === msg.emisor_socio_id)?.nombre || 'Broadcast'}
                        </span>
                        {!msg.receptor_socio_id && <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', padding: '2px 8px', backgroundColor: 'var(--surface-container-high)', borderRadius: '20px', fontWeight: '600' }}>Broadcast</span>}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{new Date(msg.fecha_envio).toLocaleString()}</span>
                    </div>
                    <p style={{ color: 'var(--on-surface)', fontSize: '0.95rem' }}>{msg.mensaje}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Notifications;
