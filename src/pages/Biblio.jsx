import React from 'react';
import DocumentManager from '../components/DocumentManager';

function Biblio() {
  const categories = ['Todas', 'Estatuto', 'Actas', 'Convenios', 'Otros'];
  
  return (
    <DocumentManager 
      title="Biblioteca Digital"
      subtitle="Estatutos, actas, convenios y documentos institucionales."
      categories={categories}
      basePath="/biblio"
    />
  );
}

export default Biblio;
