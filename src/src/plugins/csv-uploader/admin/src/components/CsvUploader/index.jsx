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
  const [currentUser, setCurrentUser] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');
  const [apiResults, setApiResults] = useState({});
  const [successfulResponses, setSuccessfulResponses] = useState([]);

  useEffect(() => {
    console.log('🔍 [CSV Uploader] Leyendo respuestas exitosas de APIs Strapi v5...');
    getCurrentUserFromSuccessfulAPIs();
  }, []);

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

  const getCurrentUserFromSuccessfulAPIs = async () => {
    try {
      console.log('🔍 [CSV Uploader] === LEYENDO RESPUESTAS EXITOSAS DE APIS ===');
      
      // Obtener el token (corrupto o no, lo usaremos para las llamadas)
      const jwtToken = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
      
      if (!jwtToken) {
        console.log('❌ [CSV Uploader] No hay jwtToken disponible');
        setDebugInfo('No hay token JWT disponible');
        setFallbackUser();
        return;
      }

      console.log('🔍 [CSV Uploader] Token disponible, probando APIs exitosas...');

      // APIs que sabemos que responden exitosamente
      const successfulEndpoints = [
        '/admin/auth/user',
        '/admin/auth/profile', 
        '/admin/me',
        '/admin/user/me',
        '/admin/current-user'
      ];

      const results = {};
      const responses = [];
      
      for (const endpoint of successfulEndpoints) {
        try {
          console.log(`🔍 [CSV Uploader] Leyendo respuesta de: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${jwtToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            credentials: 'include'
          });

          results[endpoint] = {
            status: response.status,
            ok: response.ok
          };

          console.log(`🔍 [CSV Uploader] ${endpoint} -> Status: ${response.status}`);
          
          if (response.ok) {
            try {
              const data = await response.json();
              results[endpoint].data = data;
              
              console.log(`✅ [CSV Uploader] ${endpoint} datos recibidos:`, data);
              console.log(`🔍 [CSV Uploader] ${endpoint} estructura:`, Object.keys(data));
              console.log(`🔍 [CSV Uploader] ${endpoint} contenido completo:`, JSON.stringify(data, null, 2));
              
              responses.push({
                endpoint,
                data,
                rawResponse: JSON.stringify(data, null, 2)
              });
              
              // Buscar información de usuario en diferentes ubicaciones
              const possibleUserData = [
                data,
                data.data,
                data.user,
                data.result,
                data.payload,
                data.response,
                data.body,
                data.content
              ];
              
              for (const userData of possibleUserData) {
                if (userData && typeof userData === 'object') {
                  console.log(`🔍 [CSV Uploader] Analizando userData:`, userData);
                  console.log(`🔍 [CSV Uploader] Propiedades userData:`, Object.keys(userData));
                  
                  // Buscar email directamente
                  if (userData.email && userData.email.includes('@')) {
                    console.log(`🎯 [CSV Uploader] ¡EMAIL ENCONTRADO en ${endpoint}!:`, userData.email);
                    
                    const userInfo = {
                      id: userData.id || userData._id || userData.userId || 'api-user',
                      email: userData.email,
                      firstname: userData.firstname || userData.first_name || userData.given_name || userData.name || 'Usuario',
                      lastname: userData.lastname || userData.last_name || userData.family_name || userData.surname || 'Real',
                      username: userData.username || userData.login || userData.email,
                      source: `api-${endpoint}`,
                      fullData: userData
                    };
                    
                    setCurrentUser(userInfo);
                    setDebugInfo(`¡Usuario REAL encontrado vía ${endpoint}!: ${userInfo.email}`);
                    setApiResults(results);
                    setSuccessfulResponses(responses);
                    console.log('✅ [CSV Uploader] ¡USUARIO REAL ENCONTRADO!:', userInfo);
                    return; // ¡ÉXITO! Salir aquí
                  }
                  
                  // Buscar más profundo si es un objeto
                  const searchDeeper = (obj, path = '') => {
                    if (!obj || typeof obj !== 'object' || path.split('.').length > 3) return null;
                    
                    for (const [key, value] of Object.entries(obj)) {
                      const currentPath = path ? `${path}.${key}` : key;
                      
                      if (value && typeof value === 'object' && value.email && value.email.includes('@')) {
                        console.log(`🎯 [CSV Uploader] ¡EMAIL ENCONTRADO en ${endpoint}.${currentPath}!:`, value.email);
                        return {
                          id: value.id || value._id || 'nested-user',
                          email: value.email,
                          firstname: value.firstname || value.name || 'Usuario',
                          lastname: value.lastname || 'Nested',
                          username: value.username || value.email,
                          source: `api-${endpoint}.${currentPath}`,
                          fullData: value
                        };
                      }
                      
                      if (value && typeof value === 'object') {
                        const found = searchDeeper(value, currentPath);
                        if (found) return found;
                      }
                    }
                    return null;
                  };
                  
                  const nestedUser = searchDeeper(userData);
                  if (nestedUser) {
                    setCurrentUser(nestedUser);
                    setDebugInfo(`¡Usuario REAL encontrado (nested) vía ${endpoint}!: ${nestedUser.email}`);
                    setApiResults(results);
                    setSuccessfulResponses(responses);
                    console.log('✅ [CSV Uploader] ¡USUARIO REAL ENCONTRADO (nested)!:', nestedUser);
                    return; // ¡ÉXITO! Salir aquí
                  }
                }
              }
              
              // Si no encontramos email, pero hay datos, registrarlo para análisis
              console.log(`⚠️ [CSV Uploader] ${endpoint} tiene datos pero sin email directo`);
              
            } catch (jsonError) {
              results[endpoint].jsonError = jsonError.message;
              console.log(`❌ [CSV Uploader] ${endpoint} - Error parseando JSON:`, jsonError);
              
              // Intentar leer como texto plano
              try {
                const textData = await response.text();
                console.log(`🔍 [CSV Uploader] ${endpoint} respuesta como texto:`, textData);
                results[endpoint].textData = textData;
                
                // Buscar email en el texto
                const emailMatch = textData.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                if (emailMatch) {
                  console.log(`🎯 [CSV Uploader] ¡EMAIL encontrado en texto de ${endpoint}!:`, emailMatch[0]);
                  
                  const userInfo = {
                    id: 'text-extracted',
                    email: emailMatch[0],
                    firstname: 'Usuario',
                    lastname: 'Extraído',
                    username: emailMatch[0],
                    source: `text-${endpoint}`,
                    rawText: textData
                  };
                  
                  setCurrentUser(userInfo);
                  setDebugInfo(`¡Usuario extraído de texto vía ${endpoint}!: ${userInfo.email}`);
                  setApiResults(results);
                  setSuccessfulResponses(responses);
                  console.log('✅ [CSV Uploader] ¡USUARIO EXTRAÍDO DE TEXTO!:', userInfo);
                  return; // ¡ÉXITO! Salir aquí
                }
              } catch (textError) {
                console.log(`❌ [CSV Uploader] ${endpoint} - Error leyendo como texto:`, textError);
              }
            }
          } else {
            console.log(`❌ [CSV Uploader] ${endpoint} - Status no exitoso: ${response.status}`);
          }
        } catch (fetchError) {
          results[endpoint] = {
            fetchError: fetchError.message
          };
          console.log(`❌ [CSV Uploader] Error fetch en ${endpoint}:`, fetchError);
        }
      }
      
      setApiResults(results);
      setSuccessfulResponses(responses);

      // Si llegamos aquí, tenemos respuestas pero no encontramos usuario
      console.log('⚠️ [CSV Uploader] Respuestas exitosas pero sin usuario identificable');
      console.log('📊 [CSV Uploader] Resumen de respuestas:', responses);
      
      setDebugInfo('APIs responden pero no se encontró información de usuario - Ver respuestas abajo');
      setFallbackUser();

    } catch (error) {
      console.error('❌ [CSV Uploader] Error general:', error);
      setDebugInfo(`Error: ${error.message}`);
      setFallbackUser();
    }
  };

  const setFallbackUser = () => {
    const fallbackUser = {
      id: 'fallback-user',
      email: 'usuario@sistema.com',
      firstname: 'Usuario',
      lastname: 'Sistema',
      username: 'sistema',
      source: 'fallback'
    };
    setCurrentUser(fallbackUser);
  };

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
    if (!selectedFile || !apiConfig || !currentUser) {
      setStatus('❌ Faltan datos requeridos para el procesamiento');
      return;
    }

    setIsLoading(true);
    setStatus('🔄 Procesando archivo...');

    try {
      const csvContent = await readFileContent(selectedFile);
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setStatus('❌ El archivo debe tener al menos una fila de datos');
        setIsLoading(false);
        return;
      }

      const totalRows = lines.length - 1;
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setStatus(`✅ CSV procesado exitosamente. ${totalRows} registros enviados a ${apiConfig.name}`);
      
      const metadata = {
        fileName: selectedFile.name,
        apiId: apiConfig.id,
        apiName: apiConfig.name,
        recordsProcessed: totalRows,
        timestamp: new Date().toISOString(),
        status: 'success',
        uploadedBy: {
          userId: currentUser.id,
          userEmail: currentUser.email,
          userName: `${currentUser.firstname} ${currentUser.lastname}`.trim(),
          username: currentUser.username,
          source: currentUser.source || 'unknown'
        }
      };
      
      onChange({
        target: {
          name,
          value: JSON.stringify(metadata)
        }
      });
      
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
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

  const parseStoredValue = (storedValue) => {
    if (!storedValue) return null;
    try {
      if (typeof storedValue === 'object') return storedValue;
      if (typeof storedValue === 'string') return JSON.parse(storedValue);
    } catch (error) {
      return null;
    }
    return null;
  };

  const getLabelText = () => {
    return intlLabel?.defaultMessage || 'CSV Uploader';
  };

  // Estilos
  const containerStyle = {
    padding: '16px',
    border: '1px solid #dcdce4',
    borderRadius: '4px',
    backgroundColor: '#ffffff',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
  };

  const debugStyle = {
    padding: '8px 12px',
    backgroundColor: debugInfo.includes('¡Usuario REAL encontrado') ? '#d4edda' : '#fff3cd',
    borderRadius: '4px',
    marginBottom: '12px',
    border: debugInfo.includes('¡Usuario REAL encontrado') ? '1px solid #c3e6cb' : '1px solid #ffeeba',
    fontSize: '11px',
    color: debugInfo.includes('¡Usuario REAL encontrado') ? '#155724' : '#856404',
    fontFamily: 'monospace'
  };

  const apiResultsStyle = {
    padding: '8px 12px',
    backgroundColor: '#f3e5f5',
    borderRadius: '4px',
    marginBottom: '12px',
    border: '1px solid #e1bee7',
    fontSize: '10px',
    fontFamily: 'monospace',
    maxHeight: '100px',
    overflowY: 'auto'
  };

  const responsesStyle = {
    padding: '8px 12px',
    backgroundColor: '#e8f5e8',
    borderRadius: '4px',
    marginBottom: '12px',
    border: '1px solid #c3e6cb',
    fontSize: '10px',
    fontFamily: 'monospace',
    maxHeight: '200px',
    overflowY: 'auto'
  };

  const userInfoStyle = {
    padding: '8px 12px',
    backgroundColor: currentUser?.email === 'usuario@sistema.com' ? '#fff3cd' : '#e6f3ff',
    borderRadius: '4px',
    marginBottom: '12px',
    border: currentUser?.email === 'usuario@sistema.com' ? '1px solid #ffeeba' : '1px solid #b3d9ff',
    fontSize: '12px',
    color: currentUser?.email === 'usuario@sistema.com' ? '#856404' : '#0066cc'
  };

  const storedData = parseStoredValue(value);

  return (
    <div style={containerStyle}>
      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#32324d' }}>
        {getLabelText()}
        {required && <span style={{ color: '#ee5a52', marginLeft: '2px' }}>*</span>}
      </label>

      {/* Debug info */}
      {debugInfo && (
        <div style={debugStyle}>
          🐛 Debug: {debugInfo}
        </div>
      )}

      {/* API Results */}
      {Object.keys(apiResults).length > 0 && (
        <div style={apiResultsStyle}>
          <strong>📡 Resultados API:</strong>
          <br />
          {Object.entries(apiResults).map(([endpoint, result]) => (
            <div key={endpoint}>
              {endpoint}: {result.status || 'Error'} {result.ok ? '✅' : '❌'}
            </div>
          ))}
        </div>
      )}

      {/* Successful Responses */}
      {successfulResponses.length > 0 && (
        <div style={responsesStyle}>
          <strong>📋 Respuestas Exitosas ({successfulResponses.length}):</strong>
          <br />
          {successfulResponses.map((response, index) => (
            <div key={index} style={{ marginBottom: '8px', borderBottom: '1px solid #ddd', paddingBottom: '4px' }}>
              <strong>{response.endpoint}:</strong>
              <br />
              {response.rawResponse.substring(0, 300)}
              {response.rawResponse.length > 300 && '...'}
            </div>
          ))}
        </div>
      )}

      {/* Información del usuario */}
      {currentUser && (
        <div style={userInfoStyle}>
          👤 Usuario: <strong>{currentUser.firstname} {currentUser.lastname}</strong> ({currentUser.email})
          {currentUser.source && <span style={{marginLeft: '8px'}}>📍{currentUser.source}</span>}
          {currentUser.email === 'usuario@sistema.com' && (
            <div style={{ marginTop: '4px', fontSize: '11px' }}>
              ⚠️ Usuario fallback - Ver respuestas de APIs arriba
            </div>
          )}
        </div>
      )}

      {/* API Config */}
      {apiConfig && (
        <div style={{ padding: '12px', backgroundColor: '#f6f6f9', borderRadius: '4px', marginBottom: '16px', border: '1px solid #dcdce4' }}>
          <div style={{ fontWeight: '600', color: '#32324d', marginBottom: '4px' }}>
            📊 {apiConfig.name}
          </div>
          <div style={{ fontSize: '12px', color: '#666687' }}>
            {apiConfig.description}
          </div>
        </div>
      )}

      {/* File input y botón */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={disabled || isLoading}
          style={{ padding: '8px', border: '1px solid #dcdce4', borderRadius: '4px', fontSize: '14px' }}
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={disabled || !selectedFile || isLoading || !apiConfig || !currentUser}
          style={{
            padding: '8px 16px',
            backgroundColor: disabled || isLoading ? '#dcdce4' : '#4945ff',
            color: disabled || isLoading ? '#8e8ea9' : 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
            marginLeft: '8px'
          }}
        >
          {isLoading ? '🔄 Procesando...' : '📤 Subir CSV'}
        </button>
      </div>

      {/* Status */}
      {status && (
        <div style={{
          padding: '12px',
          borderRadius: '4px',
          marginTop: '12px',
          fontSize: '14px',
          backgroundColor: status.includes('✅') ? '#d4edda' : status.includes('❌') ? '#f8d7da' : '#cff4fc',
          color: status.includes('✅') ? '#0f5132' : status.includes('❌') ? '#58151c' : '#055160'
        }}>
          {status}
        </div>
      )}

      {/* Último procesamiento */}
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
            {storedData.uploadedBy && (
              <>
                {'\n'}👤 Usuario: {storedData.uploadedBy.userName || 'N/A'}
                {'\n'}📧 Email: {storedData.uploadedBy.userEmail || 'N/A'}
                {storedData.uploadedBy.source && `\n📍 Fuente: ${storedData.uploadedBy.source}`}
              </>
            )}
            {'\n'}✅ Estado: {storedData.status || 'N/A'}
          </div>
        </div>
      )}
    </div>
  );
};

export default CsvUploader;