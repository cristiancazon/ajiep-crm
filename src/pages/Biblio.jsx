import React from 'react';
import DocumentManager from '../components/DocumentManager';

function Biblio() {
  const categories = ['Todas', 'Estatuto', 'Actas', 'Convenios', 'Otros'];
  const allCategories = ['Todas', 'Estatuto', 'Actas', 'Convenios', 'Otros', 'Facturas', 'Transferencia'];
  const searchCategories = ['Estatuto', 'Actas', 'Convenios', 'Otros'];
  
  return (
    <DocumentManager 
      title="Biblioteca Digital"
      subtitle="Estatutos, actas, convenios y documentos institucionales."
      categories={categories}
      allCategories={allCategories}
      searchCategories={searchCategories}
      basePath="/biblio"
    />
  );
}

export default Biblio;
