import React from 'react';
import DocumentManager from '../components/DocumentManager';

function Biblio() {
  const categories = ['Todas', 'Estatuto', 'Actas', 'Convenios', 'Otros'];
  const allCategories = ['Todas', 'Estatuto', 'Actas', 'Convenios', 'Otros', 'Facturas', 'Transferencia'];
  const searchCategories = [...categories, 'Facturas', 'Transferencia', 'Recibos'];
  const categoryMapping = {
    'Recibos': 'Transferencia'
  };
  
  return (
    <DocumentManager 
      title="Biblioteca Digital"
      subtitle="Estatutos, actas, convenios y documentos institucionales."
      categories={categories}
      allCategories={allCategories}
      searchCategories={searchCategories}
      categoryMapping={categoryMapping}
      basePath="/biblio"
    />
  );
}

export default Biblio;
