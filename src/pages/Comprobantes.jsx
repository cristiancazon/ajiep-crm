import React from 'react';
import DocumentManager from '../components/DocumentManager';

function Comprobantes() {
  const categories = ['Todas', 'Facturas', 'Recibos'];
  
  return (
    <DocumentManager 
      title="Comprobantes"
      subtitle="Facturas, recibos y comprobantes de pago."
      categories={categories}
      basePath="/comprobante"
    />
  );
}

export default Comprobantes;
