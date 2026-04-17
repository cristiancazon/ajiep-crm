import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { directus, DIRECTUS_URL } from '../lib/directus';
import { readItem } from '@directus/sdk';
import { 
  ArrowLeft, 
  Download, 
  Maximize2, 
  X,
  PlayCircle,
  FileText,
  Image as ImageIcon,
  Film
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function MultimediaDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  async function fetchDetail() {
    setLoading(true);
    try {
      const res = await directus.request(readItem('multimedia', id, {
        fields: ['*', 'archivos.*', 'archivos.directus_files_id.*']
      }));
      setItem(res);
    } catch (err) {
      console.error('Error fetching multimedia detail:', err);
    } finally {
      setLoading(false);
    }
  }

  const getFileUrl = (fileId) => `${DIRECTUS_URL}assets/${fileId}`;
  const isVideo = (type) => type?.startsWith('video/');

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando galería...</div>;
  if (!item) return <div style={{ textAlign: 'center', padding: '3rem' }}>No se encontró el registro.</div>;

  return (
    <div className="multimedia-detail">
      <button 
        onClick={() => navigate('/multimedia')}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          background: 'transparent', 
          border: 'none', 
          color: 'var(--primary)', 
          cursor: 'pointer',
          fontWeight: '600',
          marginBottom: '2rem'
        }}
      >
        <ArrowLeft size={20} />
        Volver a Galería
      </button>

      <div className="card ghost-border" style={{ marginBottom: '2.5rem', padding: '2rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{item.nombre}</h2>
        <p style={{ color: 'var(--on-surface-variant)', lineHeight: '1.6', fontSize: '1.1rem' }}>{item.descripcion}</p>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>
           <span>📅 {new Date(item.date_created).toLocaleDateString()}</span>
           <span>📁 {item.archivos?.length || 0} Archivos</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
        {item.archivos?.map((archivo, idx) => {
          const file = archivo.directus_files_id;
          const url = getFileUrl(file.id);
          const typeVideo = isVideo(file.type);

          return (
            <motion.div 
              key={file.id}
              whileHover={{ scale: 1.02 }}
              className="card ghost-border"
              style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', position: 'relative', height: '200px' }}
              onClick={() => setSelectedAsset(file)}
            >
              {typeVideo ? (
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    <PlayCircle size={40} color="white" />
                  </div>
                </div>
              ) : (
                <img src={url} alt={file.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', color: 'white', fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80%' }}>{file.filename_download}</span>
                 <Maximize2 size={14} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Lightbox / Preview Modal */}
      <AnimatePresence>
        {selectedAsset && (
          <div 
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              backgroundColor: 'rgba(0,0,0,0.9)', 
              zIndex: 2000, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '2rem'
            }}
            onClick={() => setSelectedAsset(null)}
          >
            <button 
              onClick={() => setSelectedAsset(null)}
              style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              <X size={32} />
            </button>

            <div 
              style={{ maxWidth: '90vw', maxHeight: '85vh', position: 'relative' }} 
              onClick={e => e.stopPropagation()}
            >
              {isVideo(selectedAsset.type) ? (
                <video 
                  src={getFileUrl(selectedAsset.id)} 
                  controls 
                  autoPlay 
                  style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px' }} 
                />
              ) : (
                <img 
                  src={getFileUrl(selectedAsset.id)} 
                  alt={selectedAsset.title} 
                  style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', objectFit: 'contain' }} 
                />
              )}
              
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                <div>
                  <h4 style={{ margin: 0 }}>{selectedAsset.filename_download}</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7 }}>{(selectedAsset.filesize / 1024 / 1024).toFixed(2)} MB • {selectedAsset.type}</p>
                </div>
                <a 
                  href={getFileUrl(selectedAsset.id) + '?download'} 
                  download 
                  className="btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', textDecoration: 'none' }}
                >
                  <Download size={18} />
                  Descargar
                </a>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MultimediaDetail;
