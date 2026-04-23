import React from 'react';
import DocumentManager from '../components/DocumentManager';

function Comprobantes() {
  const categories = ['Todas', 'Facturas', 'Comprobante'];
  const searchCategories = ['Facturas', 'Comprobante', 'Transferencia', 'Recibos'];
  const categoryMapping = {
    'Recibos': 'Comprobante',
    'Transferencia': 'Comprobante'
  };
  
  return (
    <DocumentManager 
      title="Comprobantes"
      subtitle="Facturas, comprobante y comprobantes de pago."
      categories={categories}
      searchCategories={searchCategories}
      categoryMapping={categoryMapping}
      basePath="/comprobante"
    />
  );
}

export default Comprobantes;
