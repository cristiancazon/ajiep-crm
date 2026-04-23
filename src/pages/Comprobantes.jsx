import React from 'react';
import DocumentManager from '../components/DocumentManager';

function Comprobantes() {
  const categories = ['Todas', 'Facturas', 'Transferencia'];
  
  return (
    <DocumentManager 
      title="Comprobantes"
      subtitle="Facturas, transferencia y comprobantes de pago."
      categories={categories}
      basePath="/comprobante"
    />
  );
}

export default Comprobantes;
