import React, { useState, useEffect } from 'react';

const CsvUploader = ({
  attribute,
  disabled,
  error,
  intlLabel,
  labelAction,
  name,
  onChange,
  required,
  value,
  description,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [apiConfig, setApiConfig] = useState(null);

  // Cargar configuración de API
  useEffect(() => {
    const selectedApi = attribute?.options?.selectedApi;
    if (selectedApi) {
      const mockConfigs = {
        ofertas: {
          id: 'ofertas',
          name: 'API de Ofertas',
          description: 'API para carga masiva de ofertas laborales',
          maxRows: 5000,
          requiredColumns: ['FECHA', 'DEPARTAMENTO', 'MUNICIPIO', 'NUMERO RIT', 'CATEGORIA', 'ENTIDAD OFERENTE']
        }
      };
      setApiConfig(mockConfigs[selectedApi] || null);
    }
  }, [attribute?.options?.selectedApi]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setStatus('❌ Por favor selecciona un archivo CSV válido');
      return;
    }

    setSelectedFile(file);
    setStatus(`📄 Archivo seleccionado: ${file.name}`);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setStatus('❌ Por favor selecciona un archivo CSV');
      return;
    }

    if (!apiConfig) {
      setStatus('❌ No hay configuración de API disponible');
      return;
    }

    setIsLoading(true);
    setStatus('🔄 Procesando archivo...');

    try {
      // Leer contenido del archivo
      const csvContent = await readFileContent(selectedFile);
      
      // Validar CSV básico
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        setStatus('❌ El archivo debe tener al menos una fila de datos');
        setIsLoading(false);
        return;
      }

      const totalRows = lines.length - 1;

      // Simular procesamiento
      setTimeout(() => {
        setStatus(`✅ CSV procesado exitosamente. ${totalRows} registros enviados a ${apiConfig.name}`);
        
        // Crear objeto con metadatos y convertir a string JSON
        const metadata = {
          fileName: selectedFile.name,
          apiId: apiConfig.id,
          apiName: apiConfig.name,
          recordsProcessed: totalRows,
          timestamp: new Date().toISOString(),
          status: 'success'
        };
        
        // Guardar como string JSON para evitar problemas de renderizado
        onChange({
          target: {
            name,
            value: JSON.stringify(metadata)
          }
        });
        
        setIsLoading(false);
      }, 2000);

    } catch (error) {
      console.error('Error uploading CSV:', error);
      setStatus(`❌ Error: ${error.message}`);
      setIsLoading(false);
    }
  };

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Error al leer el archivo'));
      reader.readAsText(file, 'UTF-8');
    });
  };

  // Función segura para parsear el valor guardado
  const parseStoredValue = (storedValue) => {
    if (!storedValue) return null;
    
    try {
      // Si ya es un objeto, devolverlo
      if (typeof storedValue === 'object') {
        return storedValue;
      }
      // Si es string, parsearlo
      if (typeof storedValue === 'string') {
        return JSON.parse(storedValue);
      }
    } catch (error) {
      console.warn('Error parsing stored value:', error);
      return null;
    }
    return null;
  };

  // Obtener el texto del label
  const getLabelText = () => {
    if (intlLabel?.defaultMessage) {
      return intlLabel.defaultMessage;
    }
    return 'CSV Uploader';
  };

  const containerStyle = {
    padding: '16px',
    border: '1px solid #dcdce4',
    borderRadius: '4px',
    backgroundColor: '#ffffff',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#32324d'
  };

  const apiInfoStyle = {
    padding: '12px',
    backgroundColor: '#f6f6f9',
    borderRadius: '4px',
    marginBottom: '16px',
    border: '1px solid #dcdce4'
  };

  const buttonStyle = {
    padding: '8px 16px',
    backgroundColor: disabled || isLoading ? '#dcdce4' : '#4945ff',
    color: disabled || isLoading ? '#8e8ea9' : 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    marginLeft: '8px'
  };

  const fileInputStyle = {
    padding: '8px',
    border: '1px solid #dcdce4',
    borderRadius: '4px',
    fontSize: '14px'
  };

  const getStatusStyle = () => {
    let backgroundColor = '#cff4fc';
    let color = '#055160';
    
    if (status.includes('✅')) {
      backgroundColor = '#d4edda';
      color = '#0f5132';
    } else if (status.includes('❌')) {
      backgroundColor = '#f8d7da';
      color = '#58151c';
    }
    
    return {
      padding: '12px',
      borderRadius: '4px',
      marginTop: '12px',
      fontSize: '14px',
      backgroundColor,
      color
    };
  };

  // Obtener datos parseados de forma segura
  const storedData = parseStoredValue(value);

  return (
    <div style={containerStyle}>
      <label style={labelStyle}>
        {getLabelText()}
        {required && <span style={{ color: '#ee5a52', marginLeft: '2px' }}>*</span>}
      </label>

      {description && (
        <div style={{ fontSize: '12px', color: '#666687', marginBottom: '12px' }}>
          {description}
        </div>
      )}

      {apiConfig && (
        <div style={apiInfoStyle}>
          <div style={{ fontWeight: '600', color: '#32324d', marginBottom: '4px' }}>
            📊 {apiConfig.name}
          </div>
          <div style={{ fontSize: '12px', color: '#666687', marginBottom: '4px' }}>
            {apiConfig.description}
          </div>
          <div style={{ fontSize: '12px', color: '#666687' }}>
            Máximo {apiConfig.maxRows} filas • {apiConfig.requiredColumns?.length || 0} columnas requeridas
          </div>
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={disabled || isLoading}
          style={fileInputStyle}
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={disabled || !selectedFile || isLoading || !apiConfig}
          style={buttonStyle}
        >
          {isLoading ? '🔄 Procesando...' : '📤 Subir CSV'}
        </button>
      </div>

      {status && (
        <div style={getStatusStyle()}>
          {status}
        </div>
      )}

      {storedData && (
        <div style={{
          backgroundColor: '#f6f6f9',
          border: '1px solid #dcdce4',
          borderRadius: '4px',
          padding: '12px',
          marginTop: '12px'
        }}>
          <div style={{ fontWeight: '600', color: '#32324d', marginBottom: '8px' }}>
            📋 Último procesamiento:
          </div>
          <div style={{ fontSize: '12px', color: '#666687', fontFamily: 'Monaco, Consolas, "Courier New", monospace' }}>
            📄 Archivo: {storedData.fileName || 'N/A'}
            {'\n'}📊 Registros: {storedData.recordsProcessed || 0}
            {'\n'}🔗 API: {storedData.apiName || 'N/A'}
            {'\n'}🕒 Fecha: {storedData.timestamp ? new Date(storedData.timestamp).toLocaleString() : 'N/A'}
            {'\n'}✅ Estado: {storedData.status || 'N/A'}
          </div>
        </div>
      )}

      {error && (
        <div style={{ color: '#ee5a52', fontSize: '14px', marginTop: '8px' }}>
          ❌ {error}
        </div>
      )}
    </div>
  );
};

export default CsvUploader;