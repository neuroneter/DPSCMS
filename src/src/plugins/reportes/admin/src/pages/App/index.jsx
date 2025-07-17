import React, { useState, useEffect } from 'react';


const FileUploadZone = ({ onFileSelect, selectedFile, disabled }) => {
  const handleDrop = (e) => {
    e.preventDefault();
    if (disabled) return;
    
    const file = e.dataTransfer.files[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  };

  return (
    <div
      style={{
        border: '2px dashed #ddd',
        borderRadius: '6px',
        padding: '30px',
        textAlign: 'center',
        backgroundColor: disabled ? '#f8f9fa' : '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => !disabled && document.getElementById('fileInput').click()}
    >
      <input
        id="fileInput"
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileInput}
        style={{ display: 'none' }}
        disabled={disabled}
      />
      
      {selectedFile ? (
        <div>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>📄</div>
          <p style={{ fontSize: '16px', color: '#007bff' }}>
            <strong>{selectedFile.name}</strong>
          </p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Haz clic para cambiar el archivo
          </p>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>📁</div>
          <p style={{ fontSize: '16px', marginBottom: '5px' }}>
            Arrastra y suelta tu archivo aquí
          </p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            o haz clic para seleccionar
          </p>
          <p style={{ fontSize: '12px', color: '#999' }}>
            Formatos: CSV, Excel (.xlsx, .xls) • Máximo: 15MB
          </p>
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [backendStatus, setBackendStatus] = useState('Conectando...');
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationRules, setValidationRules] = useState(null);
  const [isLoadingRules, setIsLoadingRules] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResults, setImportResults] = useState(null);
    const [importErrors, setImportErrors] = useState([]);
    const [csvSeparator, setCsvSeparator] = useState(','); // Valor por defecto: coma

  // Test de backend
  useEffect(() => {
    fetch('/api/reportes/test')
      .then(res => res.json())
      .then(data => {
        console.log('✅ Backend OK:', data);
        setBackendStatus(`✅ Conectado: ${data.message}`);
        // Una vez conectado, cargar Collection Types
        loadCollections();
      })
      .catch(err => {
        console.error('❌ Backend Error:', err);
        setBackendStatus('❌ Error de conexión');
      });
  }, []);

  useEffect(() => {
  if (selectedCollection) {
    console.log(`🎯 Collection seleccionado: ${selectedCollection}`);
    loadValidationRules(selectedCollection);
  } else {
    setValidationRules(null);
  }
}, [selectedCollection]);

const loadCollections = async () => {
  try {
    setIsLoading(true);
    console.log('🔍 Cargando Collection Types REALES desde Strapi...');
    
    // Usar controlador REAL que consulta Strapi
    const response = await fetch('/api/reportes/collections');
    
    console.log('📡 Respuesta status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Collection Types REALES cargados:', data);
      console.log('📊 Total encontrados:', data.meta?.total || 0);
      console.log('🏷️ Fuente:', data.meta?.source || 'unknown');
      setCollections(data.data || []);
    } else {
      const errorText = await response.text();
      console.error('❌ Error HTTP:', response.status, errorText);
      setCollections([]);
    }
  } catch (error) {
    console.error('❌ Error cargando collections:', error);
    setCollections([]);
  } finally {
    setIsLoading(false);
  }
};

const loadValidationRules = async (collectionUID) => {
  try {
    setIsLoadingRules(true);
    console.log(`🔍 Cargando reglas REALES para: ${collectionUID}`);
    
    // Usar controlador REAL (no la ruta de prueba)
    const url = `/api/reportes/collections/${collectionUID}/rules`;
    console.log(`📡 URL real: ${url}`);
    
    const response = await fetch(url);
    console.log(`📡 Status response: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Reglas REALES cargadas:', data);
      console.log('🏷️ Fuente:', data.meta?.source || 'unknown');
      console.log('📋 Campos reales:', data.data?.fields?.map(f => f.name) || []);
      setValidationRules(data.data);
    } else {
      const responseText = await response.text();
      console.error('❌ Error cargando reglas:', response.status, responseText);
      setValidationRules(null);
    }
  } catch (error) {
    console.error('❌ Error completo:', error);
    setValidationRules(null);
  } finally {
    setIsLoadingRules(false);
  }
};

const downloadTemplate = async (collectionUID) => {
  try {
    console.log(`📥 Descargando plantilla para: ${collectionUID}`);
    
    const fields = validationRules?.fields || [];
    const collectionName = validationRules?.collectionType?.displayName || 'collection';
    
    const headers = fields.map(field => field.name).join(',');
    const examples = fields.map(field => {
      if (field.name === 'nombre') return 'Ejemplo Municipio';
      if (field.name === 'codigo') return '12345';
      return `ejemplo_${field.name}`;
    }).join(',');
    
    const csvContent = `${headers}\n${examples}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `plantilla_${collectionName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('✅ Plantilla descargada exitosamente');
    
  } catch (error) {
    console.error('❌ Error descargando plantilla:', error);
  }
};

  const selectStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: '#fff'
  };

const translateFieldType = (type) => {
  const typeTranslations = {
    // Tipos básicos
    'string': 'Texto',
    'text': 'Texto largo',
    'email': 'Correo electrónico',
    'password': 'Contraseña',
    'richtext': 'Texto enriquecido',
    
    // Números
    'integer': 'Número entero',
    'biginteger': 'Número grande',
    'float': 'Número decimal',
    'decimal': 'Decimal',
    
    // Fechas
    'date': 'Fecha',
    'datetime': 'Fecha y hora',
    'time': 'Hora',
    
    // Otros
    'boolean': 'Verdadero/Falso',
    'enumeration': 'Lista de opciones',
    'json': 'JSON',
    'uid': 'Identificador único',
    
    // Relaciones
    'relation': 'Relación',
    'media': 'Archivo/Imagen',
    'component': 'Componente',
    'dynamiczone': 'Zona dinámica'
  };
  
  return typeTranslations[type] || type;
};

const handleFileSelection = (file) => {
  console.log('📁 Archivo seleccionado:', file);
  
  // Validar tipo de archivo
  const validTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  const validExtensions = /\.(csv|xlsx|xls)$/i;
  
  if (!validTypes.includes(file.type) && !validExtensions.test(file.name)) {
    alert('⚠️ Tipo de archivo no válido. Solo se permiten archivos CSV, XLS, y XLSX.');
    return;
  }
  
  // Validar tamaño (máximo 15MB)
  const maxSize = 15 * 1024 * 1024;
  if (file.size > maxSize) {
    alert('⚠️ El archivo es muy grande. Tamaño máximo permitido: 15MB.');
    return;
  }
  
  setSelectedFile(file);
  console.log('✅ Archivo válido seleccionado');
};

const handleImportFile = async () => {
  if (!selectedFile || !selectedCollection) {
    alert('⚠️ Selecciona un Collection Type y un archivo primero.');
    return;
  }
  
  try {
    setIsProcessing(true);
    setImportResults(null);
    setImportErrors([]);
    console.log('🚀 Iniciando importación REAL...');
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('collectionType', selectedCollection);
    formData.append('csvSeparator', csvSeparator); // ← AGREGAR ESTA LÍNEA
    
    // Usar ruta REAL de importación
    const response = await fetch('/api/reportes/import', {
      method: 'POST',
      body: formData
    });
    
    console.log('📡 Respuesta importación:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Importación REAL exitosa:', data);
      
      setImportResults(data.data.results);
      
      if (data.data.errors && data.data.errors.length > 0) {
        setImportErrors(data.data.errors);
      }
      
      alert(`✅ Importación completada!\n\n📊 Importados: ${data.data.results.imported}\n⚠️ Errores: ${data.data.results.errors}\n🎯 Collection: ${selectedCollection}`);
    } else {
      const errorData = await response.text();
      console.error('❌ Error en importación:', errorData);
      alert('❌ Error durante la importación. Revisa la consola para más detalles.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    alert('❌ Error inesperado durante la importación.');
  } finally {
    setIsProcessing(false);
  }
};

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Inter, Arial, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1 style={{ color: '#2e44a7', marginBottom: '10px' }}>
        🎯 Plugin Reportes - Importación Masiva
      </h1>
      
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Importa datos desde archivos CSV y Excel a tus Reportes
      </p>

      {/* Estado de conexión */}
      <div style={{ 
        padding: '15px', 
        border: '1px solid #ddd', 
        borderRadius: '6px', 
        marginBottom: '20px',
        backgroundColor: '#f8f9fa'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>📊 Estado del Sistema</h3>
        <p style={{ margin: 0 }}>{backendStatus}</p>
      </div>

      {/* Selector de Collection Types */}
      <div style={{ 
        padding: '20px', 
        border: '1px solid #ddd', 
        borderRadius: '6px',
        backgroundColor: '#fff',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>📁 1. Selecciona un reporte</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
            Reportes:
          </label>
          <select 
  style={selectStyle}
  value={selectedCollection}
  onChange={(e) => setSelectedCollection(e.target.value)}
  disabled={isLoading}
>



    
  <option value="">
    {isLoading ? 'Cargando...' : 'Selecciona un Collection Type...'}
  </option>
  {collections.map((collection) => (
    <option key={collection.uid} value={collection.uid}>
      {collection.displayName}
    </option>
  ))}
</select>
        </div>

        {collections.length === 0 && !isLoading && (
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            color: '#856404'
          }}>
            ⚠️ No se encontraron Collection Types disponibles o no tienes permisos para acceder a ellos.
          </div>
        )}

        {collections.length > 0 && (
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#d4edda', 
            border: '1px solid #c3e6cb',
            borderRadius: '4px',
            color: '#155724'
          }}>
            ✅ {collections.length} Collection Type(s) disponible(s)
          </div>
        )}

        {selectedCollection && (
  <div style={{ 
    marginTop: '15px',
    padding: '10px', 
    backgroundColor: '#e6f3ff', 
    border: '1px solid #b3d9ff',
    borderRadius: '4px',
    color: '#0066cc'
  }}>
    Selecciona un reporte: <strong>
      {collections.find(c => c.uid === selectedCollection)?.displayName || selectedCollection}
    </strong>
  </div>
        )}

        {/* Reglas de Validación */}
        {selectedCollection && (
        <div style={{ 
            padding: '20px', 
            border: '1px solid #ddd', 
            borderRadius: '6px',
            backgroundColor: '#fff',
            marginBottom: '20px'
        }}>
            <h3 style={{ margin: '0 0 15px 0' }}>📋 2. Reglas de Validación</h3>
            
            {isLoadingRules ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                🔄 Cargando reglas de validación...
            </div>
            ) : validationRules ? (
            <div>
                <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '15px',
                gap: '15px'
                }}>
                <div style={{ 
                    padding: '10px', 
                    backgroundColor: '#e6f3ff', 
                    border: '1px solid #b3d9ff',
                    borderRadius: '4px',
                    color: '#0066cc',
                    flex: 1
                }}>
                    📊 Collection Type: <strong>{validationRules.collectionType.displayName}</strong><br/>
                    📝 Campos importables: <strong>{validationRules.importableFields}</strong><br/>
                    ⚠️ Campos requeridos: <strong>{validationRules.requiredFields}</strong>
                </div>
                
                <button
                    style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    whiteSpace: 'nowrap'
                    }}
                    onClick={() => downloadTemplate(selectedCollection)}
                    disabled={isLoadingRules}
                >
                    📥 Descargar Plantilla
                </button>
                </div>
                
                <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                border: '1px solid #ddd'
                }}>
                <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Campo</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Tipo</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Requerido</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Validaciones</th>
                    </tr>
                </thead>
                <tbody>
                    {validationRules.fields.map((field) => (
                    <tr key={field.name}>
                        <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: '500' }}>
                        {field.name}
                        </td>
                        
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                        <span style={{ 
                            padding: '2px 6px', 
                            backgroundColor: '#e9ecef', 
                            borderRadius: '3px',
                            fontSize: '12px'
                        }}>
                            {translateFieldType(field.type)}
                        </span>
                        </td>

                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                        <span style={{ 
                            padding: '2px 6px', 
                            backgroundColor: field.required ? '#f8d7da' : '#d4edda',
                            color: field.required ? '#721c24' : '#155724',
                            borderRadius: '3px',
                            fontSize: '12px'
                        }}>
                            {field.required ? 'Requerido' : 'Opcional'}
                        </span>
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', fontSize: '12px' }}>
                        {field.validations.length > 0 ? field.validations.join(', ') : 'Ninguna'}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            ) : (
            <div style={{ 
                padding: '15px', 
                backgroundColor: '#fff3cd', 
                border: '1px solid #ffeaa7',
                borderRadius: '4px',
                color: '#856404'
            }}>
                ⚠️ No se pudieron cargar las reglas de validación
            </div>
            )}
        </div>
        )}
        
      </div>

        {/* Sistema de Carga de Archivos */}
        {validationRules && (
        <div style={{ 
            padding: '20px', 
            border: '1px solid #ddd', 
            borderRadius: '6px',
            backgroundColor: '#fff',
            marginBottom: '20px'
        }}>
            <h3 style={{ margin: '0 0 15px 0' }}>📤 3. Cargar Archivo para Importar</h3>
            
            <div style={{ marginBottom: '15px' }}>
            <div style={{ 
                padding: '10px', 
                backgroundColor: '#fff3cd', 
                border: '1px solid #ffeaa7',
                borderRadius: '4px',
                color: '#856404',
                marginBottom: '15px'
            }}>
                💡 <strong>Tip:</strong> Descarga primero la plantilla, llénala con tus datos, y súbela aquí para importar.
            </div>
            
            <FileUploadZone 
                onFileSelect={handleFileSelection}
                selectedFile={selectedFile}
                disabled={false}
            />

            <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                    Separador de columnas:
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                    type="text"
                    value={csvSeparator}
                    onChange={(e) => setCsvSeparator(e.target.value)}
                    style={{
                        width: '60px',
                        padding: '6px 8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        textAlign: 'center',
                        fontSize: '14px'
                    }}
                    maxLength="1"
                    placeholder=","
                    />
                    <span style={{ fontSize: '14px', color: '#666' }}>
                    Carácter que separa las columnas en tu archivo
                    </span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                        type="button"
                        onClick={() => setCsvSeparator(',')}
                        style={{
                        padding: '4px 8px',
                        backgroundColor: csvSeparator === ',' ? '#007bff' : '#e9ecef',
                        color: csvSeparator === ',' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: '12px',
                        cursor: 'pointer'
                        }}
                    >
                        Coma (,)
                    </button>
                    <button
                        type="button"
                        onClick={() => setCsvSeparator(';')}
                        style={{
                        padding: '4px 8px',
                        backgroundColor: csvSeparator === ';' ? '#007bff' : '#e9ecef',
                        color: csvSeparator === ';' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: '12px',
                        cursor: 'pointer'
                        }}
                    >
                        Punto y coma (;)
                    </button>
                    </div>
                </div>
                </div>

            </div>

            {selectedFile && (
            <div style={{ 
                padding: '15px', 
                backgroundColor: '#e6f3ff', 
                border: '1px solid #b3d9ff',
                borderRadius: '4px',
                marginBottom: '15px'
            }}>
                <h4 style={{ margin: '0 0 10px 0' }}>📋 Archivo Seleccionado</h4>
                <p style={{ margin: '5px 0' }}><strong>Nombre:</strong> {selectedFile.name}</p>
                <p style={{ margin: '5px 0' }}><strong>Tamaño:</strong> {(selectedFile.size / 1024).toFixed(2)} KB</p>
                <p style={{ margin: '5px 0' }}><strong>Tipo:</strong> {selectedFile.type || 'Desconocido'}</p>
                
                <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                <button
                    style={{
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                    }}
                    onClick={handleImportFile}
                    disabled={isProcessing}
                >
                    {isProcessing ? '🔄 Procesando...' : '🚀 Validar e Importar'}
                </button>
                
                <button
                    style={{
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                    }}
                    onClick={() => setSelectedFile(null)}
                    disabled={isProcessing}
                >
                    🗑️ Quitar Archivo
                </button>
                </div>
            </div>
            )}
        </div>
        )}

      {/* Funcionalidades */}
      <div style={{ 
        padding: '15px', 
        border: '1px solid #ddd', 
        borderRadius: '6px',
        backgroundColor: '#fff'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>🚀 Progreso de Implementación</h3>
        <ul style={{ paddingLeft: '20px' }}>
          <li>✅ Plugin base funcionando</li>
          <li>✅ Selector de Collection Types funcionando</li>
          <li>🔄 Próximo: Reglas de validación...</li>
          <li>⏳ Próximo: Generador de plantillas...</li>
          <li>⏳ Próximo: Carga de archivos...</li>
        </ul>
      </div>

      {/* Resultados de Importación */}
{importResults && (
  <div style={{ 
    padding: '20px', 
    border: '1px solid #ddd', 
    borderRadius: '6px',
    backgroundColor: '#fff',
    marginBottom: '20px'
  }}>
    <h3 style={{ margin: '0 0 15px 0' }}>📊 4. Resultados de Importación</h3>
    
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
      <div style={{ padding: '15px', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '4px', textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 5px 0', color: '#155724' }}>✅ Importados</h4>
        <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#155724' }}>{importResults.imported}</span>
      </div>
      <div style={{ padding: '15px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px', textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 5px 0', color: '#856404' }}>⏭️ Omitidos</h4>
        <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#856404' }}>{importResults.skipped || 0}</span>
      </div>
      <div style={{ padding: '15px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px', textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 5px 0', color: '#721c24' }}>❌ Errores</h4>
        <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#721c24' }}>{importResults.errors}</span>
      </div>
      <div style={{ padding: '15px', backgroundColor: '#e2e3e5', border: '1px solid #d6d8db', borderRadius: '4px', textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 5px 0', color: '#383d41' }}>📄 Total</h4>
        <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#383d41' }}>{importResults.total}</span>
      </div>
    </div>
    
    {importResults.timestamp && (
      <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
        🕒 Procesado el: {new Date(importResults.timestamp).toLocaleString()}
      </p>
    )}
  </div>
)}

{/* Errores de Validación */}
{importErrors.length > 0 && (
  <div style={{ 
    padding: '20px', 
    border: '1px solid #f5c6cb', 
    borderRadius: '6px',
    backgroundColor: '#f8d7da',
    marginBottom: '20px'
  }}>
    <h3 style={{ margin: '0 0 15px 0', color: '#721c24' }}>⚠️ Errores Encontrados</h3>
    
    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
      {importErrors.slice(0, 20).map((error, index) => (
        <div key={index} style={{ 
          padding: '8px', 
          backgroundColor: '#fff', 
          border: '1px solid #f5c6cb', 
          borderRadius: '3px', 
          marginBottom: '5px',
          fontSize: '14px'
        }}>
          <strong>Fila {error.row}:</strong> {error.message}
        </div>
      ))}
    </div>
    
    {importErrors.length > 20 && (
      <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#721c24' }}>
        ... y {importErrors.length - 20} errores más
      </p>
    )}
  </div>
)}

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#999' }}>
        🕒 Actualizado: {new Date().toLocaleString()}
      </div>
    </div>
  );
};

export default App;