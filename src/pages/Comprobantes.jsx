import React from 'react';
import DocumentManager from '../components/DocumentManager';

function Comprobantes() {
  const categories = ['Todas', 'Facturas', 'Transferencia'];
  const searchCategories = ['Facturas', 'Transferencia', 'Recibos', 'Comprobante'];
  const categoryMapping = {
    'Recibos': 'Transferencia',
    'Comprobante': 'Transferencia'
  };
  
  return (
    <DocumentManager 
      title="Comprobantes"
      subtitle="Facturas, transferencias y comprobantes de pago."
      categories={categories}
      searchCategories={searchCategories}
      categoryMapping={categoryMapping}
      basePath="/comprobante"
    />
  );
}

export default Comprobantes;
