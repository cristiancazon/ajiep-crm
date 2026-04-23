import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { directus } from '../lib/directus';
import { readItem } from '@directus/sdk';
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Calendar, 
  Tag,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';

function BiblioDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDoc();
  }, [id]);

  async function fetchDoc() {
    setLoading(true);
    try {
      // Pedimos el item y expandimos los metadatos del archivo adjunto
      const response = await directus.request(
        readItem('biblio', id, {
          fields: ['*', 'archivo.*']
        })
      );
      setDoc(response);
    } catch (err) {
      console.error('Error fetching document:', err);
      setError('No se pudo encontrar el documento o no tienes permisos para verlo.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid var(--surface-container-high)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
          <p>Cargando detalles del documento...</p>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <AlertCircle size={48} color="var(--error)" style={{ marginBottom: '1rem' }} />
        <h2>Error</h2>
        <p style={{ color: 'var(--on-surface-variant)', marginBottom: '2rem' }}>{error}</p>
        <button className="btn-primary" onClick={() => navigate('/biblio')}>Volver a la Biblioteca</button>
      </div>
    );
  }

  const fileInfo = doc.archivo;
  const fileUrl = fileInfo ? `${directus.url}assets/${fileInfo.id}` : null;
  const isImage = fileInfo?.type?.startsWith('image/');
  const isVideo = fileInfo?.type?.startsWith('video/');
  const isPDF = fileInfo?.type === 'application/pdf';

  const isComprobante = location.pathname.startsWith('/comprobante');
  const backPath = isComprobante ? '/comprobante' : '/biblio';
  const backLabel = isComprobante ? 'Volver a Comprobantes' : 'Volver a la Biblioteca';

  return (
    <div className="biblio-detail-page">
      <div style={{ marginBottom: '2rem' }}>
        <Link to={backPath} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' }}>
          <ArrowLeft size={18} />
          {backLabel}
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
        {/* Lado izquierdo: Visualizador de Medios */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card ghost-border" 
          style={{ padding: '0', overflow: 'hidden', backgroundColor: 'var(--surface-container-low)' }}
        >
          <div style={{ padding: '2rem', borderBottom: '1px solid var(--outline-variant)', backgroundColor: 'white' }}>
            <h1 style={{ margin: 0, fontSize: '1.75rem', color: 'var(--on-surface)' }}>{doc.titulo}</h1>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>
                <Tag size={16} />
                <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{doc.categoria}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>
                <Calendar size={16} />
                {new Date(doc.fecha_creacion).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {!fileInfo ? (
              <div style={{ textAlign: 'center', padding: '4rem' }}>
                <FileText size={64} color="var(--outline)" />
                <p style={{ marginTop: '1rem', color: 'var(--on-surface-variant)' }}>Este registro no tiene un archivo adjunto.</p>
              </div>
            ) : (
              <>
                {isImage && (
                  <img 
                    src={fileUrl} 
                    alt={doc.titulo} 
                    style={{ maxWidth: '100%', maxHeight: '70vh', display: 'block' }} 
                  />
                )}
                
                {isVideo && (
                  <video 
                    controls 
                    style={{ width: '100%', maxHeight: '70vh', backgroundColor: 'black' }}
                    src={fileUrl}
                  >
                    Tu navegador no soporta la reproducción de videos.
                  </video>
                )}

                {isPDF && (
                  <iframe 
                    src={`${fileUrl}#toolbar=0`} 
                    title={doc.titulo}
                    style={{ width: '100%', height: '75vh', border: 'none' }}
                  />
                )}

                {!isImage && !isVideo && !isPDF && (
                  <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <div style={{ padding: '20px', borderRadius: '50%', backgroundColor: 'var(--surface-container-high)', display: 'inline-flex', marginBottom: '1rem' }}>
                      <FileText size={48} color="var(--primary)" />
                    </div>
                    <h3>Documento: {fileInfo.filename_download}</h3>
                    <p style={{ color: 'var(--on-surface-variant)' }}>El formato de este archivo ({fileInfo.type}) no se puede previsualizar directamente.</p>
                    <a href={fileUrl} target="_blank" rel="noreferrer" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                      <ExternalLink size={18} /> Abrir en nueva pestaña
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>

        {/* Lado derecho: Detalles y Acciones */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          <div className="card shadow-sm" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Información</h3>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--on-surface-variant)', whiteSpace: 'pre-wrap' }}>
              {doc.descripcion || 'Sin descripción adicional.'}
            </p>
          </div>

          {fileInfo && (
            <div className="card ghost-border" style={{ padding: '1.5rem', backgroundColor: 'var(--surface-container-lowest)' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '700', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>Archivo</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', wordBreak: 'break-all' }}>{fileInfo.filename_download}</span>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginTop: '4px' }}>
                  {(fileInfo.filesize / 1024 / 1024).toFixed(2)} MB • {fileInfo.type}
                </span>
              </div>
              
              <a 
                href={fileUrl + '?download'} 
                download={fileInfo.filename_download}
                className="btn-primary" 
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', textDecoration: 'none', padding: '12px' }}
              >
                <Download size={20} />
                Descargar Archivo
              </a>
            </div>
          )}
        </motion.div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .biblio-detail-page {
          max-width: 1200px;
          margin: 0 auto;
          padding-bottom: 4rem;
        }
        @media (max-width: 992px) {
          .biblio-detail-page > div:nth-child(2) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default BiblioDetail;
