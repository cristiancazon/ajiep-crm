import React from 'react';
import DocumentManager from '../components/DocumentManager';

function Comprobantes() {
  const categories = ['Todas', 'Facturas', 'Comprobante'];
  
  return (
    <DocumentManager 
      title="Comprobantes"
      subtitle="Facturas, comprobante y comprobantes de pago."
      categories={categories}
      basePath="/comprobante"
    />
  );
}

export default Comprobantes;
