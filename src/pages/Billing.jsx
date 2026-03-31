import React, { useState, useEffect } from 'react';
import { directus } from '../lib/directus';
import { readItems, createItem, uploadFiles, updateItem, readMe } from '@directus/sdk';
import { 
  CreditCard, 
  Upload, 
  FileText, 
  Download, 
  History, 
  CheckCircle, 
  Clock, 
  XCircle,
  AlertCircle,
  Plus,
  Eye,
  Check
} from 'lucide-react';

function Billing() {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [formData, setFormData] = useState({ monto: '', fecha: '', file: null, socio_id: '' });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      const me = await directus.request(readMe());
      setCurrentUser(me);

      if (me.es_administrador) {
        const [pData, fData, sData] = await Promise.all([
          directus.request(readItems('pagos', { sort: ['-fecha_transferencia'], limit: 50 })),
          directus.request(readItems('facturas', { sort: ['-fecha_emision'], limit: 50 })),
          directus.request(readItems('socios'))
        ]);
        setPayments(pData);
        setInvoices(fData);
        setSocios(sData);
      } else if (me.socio_id) {
        const [pData, fData] = await Promise.all([
          directus.request(readItems('pagos', { 
            filter: { socio_id: { _eq: me.socio_id } },
            sort: ['-fecha_transferencia']
          })),
          directus.request(readItems('facturas', {
            filter: { socio_id: { _eq: me.socio_id } },
            sort: ['-fecha_emision']
          }))
        ]);
        setPayments(pData);
        setInvoices(fData);
      }
    } catch (err) {
      console.error('Error fetching billing data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleUploadPayment = async (e) => {
    e.preventDefault();
    if (!formData.file || !formData.monto) return;
    setUploading(true);
    setError(null);

    try {
      const fileFormData = new FormData();
      fileFormData.append('file', formData.file);
      const uploadRes = await directus.request(uploadFiles(fileFormData));
      
      await directus.request(createItem('pagos', {
        socio_id: currentUser.es_administrador ? formData.socio_id : currentUser.socio_id,
        monto: parseFloat(formData.monto),
        fecha_transferencia: formData.fecha,
        comprobante: uploadRes.id,
        estado: 'Pendiente'
      }));

      setShowUpload(false);
      setFormData({ monto: '', fecha: '', file: null, socio_id: '' });
      fetchInitialData();
    } catch (err) {
      setError('Error al subir el comprobante.');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmPayment = async (pago) => {
    if (!pago || !currentUser.es_administrador) return;
    try {
      await directus.request(updateItem('pagos', pago.id, { estado: 'Confirmado' }));
      // Logic for updating Socio current account balance should ideally be server-side (Flows/Hooks)
      fetchInitialData();
    } catch (err) {
      console.error('Error confirming payment:', err);
    }
  };

  const handleFileUpload = async (e, type, relatedId, targetSocioId) => {
    // For Admin to upload Invoice (Factura)
    const file = e.target.files[0];
    if (!file || !currentUser.es_administrador) return;
    setUploading(true);
    try {
      const fData = new FormData();
      fData.append('file', file);
      const res = await directus.request(uploadFiles(fData));
      
      await directus.request(createItem('facturas', {
        socio_id: targetSocioId,
        pago_id: relatedId,
        archivo: res.id,
        fecha_emision: new Date().toISOString()
      }));
      fetchInitialData();
    } catch (err) {
      console.error('Error uploading invoice:', err);
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Confirmado': return <CheckCircle size={16} color="var(--success)" />;
      case 'Rechazado': return <XCircle size={16} color="var(--error)" />;
      default: return <Clock size={16} color="var(--secondary)" />;
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="billing-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ flex: '1', minWidth: '280px' }}>
          <h2 style={{ fontSize: '1.75rem' }}>{currentUser.es_administrador ? 'Gestión de Pagos' : 'Mis Pagos'}</h2>
          <p style={{ color: 'var(--on-surface-variant)' }}>{currentUser.es_administrador ? 'Valida transferencias y carga recibos oficiales.' : 'Historial y reporte de transferencias.'}</p>
        </div>
        {!currentUser.es_administrador && (
          <button className="btn-primary" onClick={() => setShowUpload(!showUpload)} style={{ width: 'auto' }}>Informar Pago</button>
        )}
      </div>

      {showUpload && (
        <section className="card ghost-border" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Subir Comprobante</h3>
          <form onSubmit={handleUploadPayment} className="stats-grid" style={{ marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>Monto</label>
              <input type="number" placeholder="Monto" value={formData.monto} onChange={e => setFormData({...formData, monto: e.target.value})} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>Fecha de Pago</label>
              <input type="date" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600' }}>Adjuntar Foto/PDF</label>
              <input type="file" onChange={e => setFormData({...formData, file: e.target.files[0]})} required />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn-primary" disabled={uploading} style={{ width: '100%', padding: '12px' }}>{uploading ? 'Enviando...' : 'Enviar Informe'}</button>
            </div>
          </form>
        </section>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem' }}>
        <section className="table-container card ghost-border" style={{ padding: 0 }}>
          <h3 style={{ padding: '1.5rem', paddingBottom: 0 }}>Listado de Transferencias</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--outline-variant)', textAlign: 'left', color: 'var(--on-surface-variant)', fontSize: '0.8rem' }}>
                <th style={{ padding: '12px' }}>Socio</th>
                <th style={{ padding: '12px' }}>Fecha</th>
                <th style={{ padding: '12px' }}>Monto</th>
                <th style={{ padding: '12px' }}>Estado</th>
                <th style={{ padding: '12px' }}>Documentos</th>
                {currentUser.es_administrador && <th style={{ padding: '12px' }}>Acciones Admin</th>}
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                  <td style={{ padding: '12px' }}>{currentUser.es_administrador ? (socios.find(s => s.id === p.socio_id)?.nombre || p.socio_id) : 'Tú'}</td>
                  <td style={{ padding: '12px' }}>{new Date(p.fecha_transferencia).toLocaleDateString()}</td>
                  <td style={{ padding: '12px', fontWeight: '700' }}>${p.monto.toLocaleString()}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {getStatusIcon(p.estado)}
                      <span style={{ fontSize: '0.85rem' }}>{p.estado}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <a href={`${directus.url}/assets/${p.comprobante}`} target="_blank" rel="noreferrer" title="Ver Mi Comprobante" style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '600' }}>
                        <Eye size={18} /> Comprobante
                      </a>
                      {invoices.find(inv => inv.pago_id === p.id) && (
                        <a 
                          href={`${directus.url}/assets/${invoices.find(inv => inv.pago_id === p.id).archivo}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          title="Descargar Recibo Oficial"
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'var(--success)', fontSize: '0.8rem', fontWeight: '600' }}
                        >
                          <FileText size={18} /> Recibo
                        </a>
                      )}
                    </div>
                  </td>
                  {currentUser.es_administrador && (
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {p.estado === 'Pendiente' && (
                          <button 
                            onClick={() => handleConfirmPayment(p)}
                            style={{ padding: '4px 8px', backgroundColor: 'var(--success)', color: 'white', borderRadius: '4px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', border: 'none' }}
                          >
                            <Check size={14} /> Confirmar
                          </button>
                        )}
                        <label style={{ cursor: 'pointer', padding: '4px 8px', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '4px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Plus size={14} /> Recibo
                          <input type="file" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'recibo', p.id, p.socio_id)} />
                        </label>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

export default Billing;
