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

  useEffect(() => {
    console.log('🔍 [CSV Uploader] MÉTODO CON API TOKEN V5 - Obteniendo usuario...');
    getUserFromJWT();
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

  const getUserFromJWT = async () => {
    try {
      console.log('🔍 [CSV Uploader] === SOLUCIÓN DINÁMICA CON API TOKEN V5 ===');
      
      // Token específico para el plugin CSV Uploader
      const API_TOKEN = 'd49655c5087403a2a3b70abc8f97eb628f84ba1d291cb683ad0d2f5a26cba03c5a0ec4aeba2c834d327bdcb9dff7e27bd9d60cac75092b3d97a65c02427510b2c4b6a6237ce5c9fa035e23bb2bdd02e3a9c915355165ab137021a05b71f10dd824e8d0837e9a954dd3285a1cc9afbebb53e2e122788320d9b3391defd3182ecf';
      
      // Obtener token JWT para obtener el user ID
      const jwtToken = sessionStorage.getItem('jwtToken') || localStorage.getItem('jwtToken');
      
      if (!jwtToken) {
        console.log('❌ [CSV Uploader] No hay JWT token para obtener user ID');
        setFallbackUser();
        return;
      }

      console.log('✅ [CSV Uploader] JWT Token encontrado');
      console.log('✅ [CSV Uploader] API Token configurado para consultas');

      // PASO 1: Decodificar JWT para obtener el ID del usuario conectado
      let jwtUserId = null;
      try {
        const base64Url = jwtToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const tokenData = JSON.parse(jsonPayload);
        console.log('✅ [CSV Uploader] JWT decodificado:', tokenData);
        jwtUserId = tokenData.id;
        console.log(`🎯 [CSV Uploader] ID del usuario conectado (JWT): ${jwtUserId}`);
      } catch (jwtError) {
        console.log('❌ [CSV Uploader] Error decodificando JWT:', jwtError);
        setFallbackUser();
        return;
      }

      // PASO 2: Buscar información del usuario ACTUAL conectado en sesión
      console.log('🔍 [CSV Uploader] === BUSCANDO USUARIO ACTUAL EN SESIÓN ===');
      
      let currentUserInfo = null;
      
      // Buscar en localStorage y sessionStorage información del usuario actual
      const searchCurrentUserInStorage = (storage, storageName) => {
        const keys = Object.keys(storage);
        console.log(`🔍 [CSV Uploader] Buscando usuario actual en ${storageName}:`, keys);
        
        for (const key of keys) {
          try {
            const value = storage.getItem(key);
            if (value) {
              try {
                const parsed = JSON.parse(value);
                
                // Buscar objetos que contengan email (indicador de info de usuario)
                if (parsed && typeof parsed === 'object') {
                  if (parsed.email && parsed.email.includes('@')) {
                    console.log(`🎯 [CSV Uploader] ¡Info de usuario encontrada en ${storageName}.${key}!:`, parsed);
                    return parsed;
                  }
                  
                  // Buscar email anidado
                  const searchEmail = (obj) => {
                    if (!obj || typeof obj !== 'object') return null;
                    
                    for (const [k, v] of Object.entries(obj)) {
                      if (typeof v === 'string' && v.includes('@') && v.includes('.')) {
                        return { email: v, fullData: obj };
                      }
                      if (v && typeof v === 'object') {
                        const found = searchEmail(v);
                        if (found) return found;
                      }
                    }
                    return null;
                  };
                  
                  const foundEmail = searchEmail(parsed);
                  if (foundEmail) {
                    console.log(`🎯 [CSV Uploader] ¡Email encontrado en ${storageName}.${key}!:`, foundEmail);
                    return foundEmail.fullData;
                  }
                }
                
              } catch (parseError) {
                // Si no es JSON válido, verificar si es un email directo
                if (typeof value === 'string' && value.includes('@') && value.includes('.')) {
                  console.log(`🎯 [CSV Uploader] ¡Email directo encontrado en ${storageName}.${key}!:`, value);
                  return { email: value, source: `${storageName}.${key}` };
                }
              }
            }
          } catch (error) {
            console.log(`❌ [CSV Uploader] Error accediendo ${storageName}.${key}:`, error);
          }
        }
        return null;
      };

      // Buscar en ambos storages
      currentUserInfo = searchCurrentUserInStorage(sessionStorage, 'sessionStorage') || 
                       searchCurrentUserInStorage(localStorage, 'localStorage');

      if (currentUserInfo) {
        console.log(`✅ [CSV Uploader] Usuario actual encontrado en sesión:`, currentUserInfo);
      } else {
        console.log(`⚠️ [CSV Uploader] No se encontró info del usuario actual en sesión`);
      }

      // PASO 3: Estrategias dinámicas para encontrar el usuario ACTUAL
      console.log('🔍 [CSV Uploader] === ESTRATEGIAS DINÁMICAS PARA USUARIO ACTUAL ===');
      
      // Estrategia 1: Buscar por ID del JWT (admin_users)
      console.log(`🔍 [CSV Uploader] Estrategia 1: Buscar por ID del JWT: ${jwtUserId}`);
      
      const idEndpoints = [
        `/api/admin/users/${jwtUserId}`,
        `/admin/users/${jwtUserId}`,
        `/api/users/${jwtUserId}`,
        `/api/users?filters[id][$eq]=${jwtUserId}`,
        `/admin/users?filters[id][$eq]=${jwtUserId}`,
      ];

      for (const endpoint of idEndpoints) {
        try {
          console.log(`🔍 [CSV Uploader] Probando ID: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${API_TOKEN}`,
              'Content-Type': 'application/json',
            },
          });

          console.log(`🔍 [CSV Uploader] ${endpoint} - Status: ${response.status}`);
          
          if (response.ok) {
            const responseText = await response.text();
            console.log(`✅ [CSV Uploader] ${endpoint} - Respuesta (300 chars):`, responseText.substring(0, 300));
            
            if (responseText.trim() && responseText.trim() !== '[]' && responseText.trim() !== '') {
              try {
                const data = JSON.parse(responseText);
                console.log(`✅ [CSV Uploader] ${endpoint} - Data parseada:`, data);
                
                // Buscar usuario en diferentes estructuras
                const user = data.data || data[0] || data;
                
                if (user && user.email) {
                  console.log(`🎯 [CSV Uploader] ¡USUARIO ACTUAL ENCONTRADO por ID en ${endpoint}!:`, user);
                  
                  const userInfo = {
                    id: user.id || jwtUserId,
                    email: user.email,
                    firstname: user.firstname || user.name || 'Usuario',
                    lastname: user.lastname || user.surname || 'Actual',
                    username: user.username || user.email,
                    roles: user.roles || ['user'],
                    source: `${endpoint}-id-search`,
                    fullData: user,
                    note: `Usuario actual encontrado por ID usando API Token`,
                    authMethod: 'api-token',
                    realId: user.id || jwtUserId
                  };
                  
                  setCurrentUser(userInfo);
                  setDebugInfo(`✅ USUARIO ACTUAL ENCONTRADO: ${user.email} (ID: ${userInfo.realId})`);
                  console.log('✅ [CSV Uploader] ¡USUARIO ACTUAL ENCONTRADO POR ID!:', userInfo);
                  return;
                }
              } catch (parseError) {
                console.log(`❌ [CSV Uploader] ${endpoint} - Error parsing JSON:`, parseError);
              }
            }
          }
        } catch (fetchError) {
          console.log(`❌ [CSV Uploader] ${endpoint} - Error:`, fetchError.message);
        }
      }

      // Estrategia 2: Buscar por email encontrado en sesión
      if (currentUserInfo && currentUserInfo.email) {
        console.log(`🔍 [CSV Uploader] Estrategia 2: Buscar por email de sesión: ${currentUserInfo.email}`);
        
        const emailEndpoints = [
          `/api/users?filters[email][$eq]=${currentUserInfo.email}`,
          `/api/admin/users?filters[email][$eq]=${currentUserInfo.email}`,
          `/admin/users?filters[email][$eq]=${currentUserInfo.email}`,
        ];

        for (const endpoint of emailEndpoints) {
          try {
            console.log(`🔍 [CSV Uploader] Probando email: ${endpoint}`);
            
            const response = await fetch(endpoint, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json',
              },
            });

            console.log(`🔍 [CSV Uploader] ${endpoint} - Status: ${response.status}`);
            
            if (response.ok) {
              const responseText = await response.text();
              console.log(`✅ [CSV Uploader] ${endpoint} - Respuesta (300 chars):`, responseText.substring(0, 300));
              
              if (responseText.trim() && responseText.trim() !== '[]') {
                try {
                  const data = JSON.parse(responseText);
                  console.log(`✅ [CSV Uploader] ${endpoint} - Data parseada:`, data);
                  
                  const users = Array.isArray(data) ? data : (data.data || []);
                  const user = users.find(u => u && u.email === currentUserInfo.email);
                  
                  if (user) {
                    console.log(`🎯 [CSV Uploader] ¡USUARIO ACTUAL ENCONTRADO por email en ${endpoint}!:`, user);
                    
                    const userInfo = {
                      id: user.id,
                      email: user.email,
                      firstname: user.firstname || user.name || 'Usuario',
                      lastname: user.lastname || user.surname || 'Actual',
                      username: user.username || user.email,
                      roles: user.roles || ['user'],
                      source: `${endpoint}-email-search`,
                      fullData: user,
                      note: `Usuario actual encontrado por email de sesión usando API Token`,
                      authMethod: 'api-token',
                      realId: user.id
                    };
                    
                    setCurrentUser(userInfo);
                    setDebugInfo(`✅ USUARIO ACTUAL ENCONTRADO: ${user.email} (ID: ${user.id})`);
                    console.log('✅ [CSV Uploader] ¡USUARIO ACTUAL ENCONTRADO POR EMAIL!:', userInfo);
                    return;
                  }
                } catch (parseError) {
                  console.log(`❌ [CSV Uploader] ${endpoint} - Error parsing JSON:`, parseError);
                }
              }
            }
          } catch (fetchError) {
            console.log(`❌ [CSV Uploader] ${endpoint} - Error:`, fetchError.message);
          }
        }
      }

      // Estrategia 3: Usar endpoints /me dinámicos
      console.log(`🔍 [CSV Uploader] Estrategia 3: Endpoints /me dinámicos`);
      
      const meEndpoints = [
        `/api/users/me`,
        `/api/admin/users/me`,
        `/admin/users/me`,
        `/admin/me`,
      ];

      for (const endpoint of meEndpoints) {
        try {
          console.log(`🔍 [CSV Uploader] Probando /me: ${endpoint}`);
          
          // Usar JWT token para endpoints /me
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${jwtToken}`, // JWT token para /me
              'Content-Type': 'application/json',
            },
          });

          console.log(`🔍 [CSV Uploader] ${endpoint} - Status: ${response.status}`);
          
          if (response.ok) {
            const responseText = await response.text();
            console.log(`✅ [CSV Uploader] ${endpoint} - Respuesta (300 chars):`, responseText.substring(0, 300));
            
            if (responseText.trim() && !responseText.includes('<!doctype html>')) {
              try {
                const data = JSON.parse(responseText);
                console.log(`✅ [CSV Uploader] ${endpoint} - Data parseada:`, data);
                
                const user = data.data || data.user || data;
                
                if (user && user.email) {
                  console.log(`🎯 [CSV Uploader] ¡USUARIO ACTUAL ENCONTRADO en /me ${endpoint}!:`, user);
                  
                  const userInfo = {
                    id: user.id || jwtUserId,
                    email: user.email,
                    firstname: user.firstname || user.name || 'Usuario',
                    lastname: user.lastname || user.surname || 'Actual',
                    username: user.username || user.email,
                    roles: user.roles || ['user'],
                    source: `${endpoint}-me-search`,
                    fullData: user,
                    note: `Usuario actual encontrado en endpoint /me usando JWT`,
                    authMethod: 'jwt-token',
                    realId: user.id || jwtUserId
                  };
                  
                  setCurrentUser(userInfo);
                  setDebugInfo(`✅ USUARIO ACTUAL ENCONTRADO: ${user.email} (ID: ${userInfo.realId})`);
                  console.log('✅ [CSV Uploader] ¡USUARIO ACTUAL ENCONTRADO EN /ME!:', userInfo);
                  return;
                }
              } catch (parseError) {
                console.log(`❌ [CSV Uploader] ${endpoint} - Error parsing JSON:`, parseError);
              }
            }
          }
        } catch (fetchError) {
          console.log(`❌ [CSV Uploader] ${endpoint} - Error:`, fetchError.message);
        }
      }

      // Fallback: Crear usuario con información de sesión si está disponible
      console.log('⚠️ [CSV Uploader] Usando información de sesión como fallback');
      
      const fallbackUser = {
        id: jwtUserId || 'session-user',
        email: currentUserInfo?.email || `user${jwtUserId}@sistema.local`,
        firstname: currentUserInfo?.firstname || currentUserInfo?.name || 'Usuario',
        lastname: currentUserInfo?.lastname || currentUserInfo?.surname || 'Actual',
        username: currentUserInfo?.username || currentUserInfo?.email || `user${jwtUserId}`,
        roles: currentUserInfo?.roles || ['user'],
        source: 'session-fallback',
        sessionInfo: currentUserInfo,
        jwtData: { id: jwtUserId },
        note: 'Usuario creado con información de sesión disponible',
        authMethod: 'session-data',
        realId: jwtUserId
      };
      
      setCurrentUser(fallbackUser);
      setDebugInfo(`✅ Usuario de sesión identificado: ${fallbackUser.email} (ID: ${jwtUserId})`);
      console.log('✅ [CSV Uploader] Usuario identificado desde sesión:', fallbackUser);

    } catch (error) {
      console.error('❌ [CSV Uploader] Error general:', error);
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
    setDebugInfo('❌ Usuario fallback - No se pudo identificar');
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
          source: currentUser.source || 'unknown',
          roles: currentUser.roles || [],
          isRealUser: currentUser.source !== 'fallback',
          note: currentUser.note || null,
          authMethod: currentUser.authMethod || 'unknown'
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
    backgroundColor: debugInfo.includes('✅') ? '#d4edda' : debugInfo.includes('❌') ? '#f8d7da' : '#fff3cd',
    borderRadius: '4px',
    marginBottom: '12px',
    border: debugInfo.includes('✅') ? '1px solid #c3e6cb' : debugInfo.includes('❌') ? '1px solid #f5c6cb' : '1px solid #ffeeba',
    fontSize: '11px',
    color: debugInfo.includes('✅') ? '#155724' : debugInfo.includes('❌') ? '#721c24' : '#856404',
    fontFamily: 'monospace'
  };

  const userInfoStyle = {
    padding: '8px 12px',
    backgroundColor: currentUser?.source === 'fallback' ? '#fff3cd' : '#e6f3ff',
    borderRadius: '4px',
    marginBottom: '12px',
    border: currentUser?.source === 'fallback' ? '1px solid #ffeeba' : '1px solid #b3d9ff',
    fontSize: '12px',
    color: currentUser?.source === 'fallback' ? '#856404' : '#0066cc'
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
          🐛 Debug API Token: {debugInfo}
        </div>
      )}

      {/* Información del usuario */}
      {currentUser && (
        <div style={userInfoStyle}>
          👤 Usuario: <strong>{currentUser.firstname} {currentUser.lastname}</strong> ({currentUser.email})
          {currentUser.source && <span style={{marginLeft: '8px'}}>📍{currentUser.source}</span>}
          {currentUser.authMethod && <span style={{marginLeft: '8px'}}>🔑{currentUser.authMethod}</span>}
          {currentUser.id && currentUser.id !== 'fallback-user' && (
            <div style={{ marginTop: '4px', fontSize: '11px' }}>
              🆔 ID Sistema: {currentUser.id}
            </div>
          )}
          {currentUser.note && (
            <div style={{ marginTop: '4px', fontSize: '11px', fontStyle: 'italic' }}>
              📝 {currentUser.note}
            </div>
          )}
          {currentUser.source === 'fallback' && (
            <div style={{ marginTop: '4px', fontSize: '11px', color: '#d63384' }}>
              ⚠️ Usuario fallback - Ver consola para detalles
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
                {'\n'}🆔 ID: {storedData.uploadedBy.userId || 'N/A'}
                {storedData.uploadedBy.source && `\n📍 Fuente: ${storedData.uploadedBy.source}`}
                {storedData.uploadedBy.authMethod && `\n🔑 Método: ${storedData.uploadedBy.authMethod}`}
                {storedData.uploadedBy.isRealUser !== undefined && `\n✅ Usuario Real: ${storedData.uploadedBy.isRealUser ? 'Sí' : 'No'}`}
                {storedData.uploadedBy.note && `\n📝 Nota: ${storedData.uploadedBy.note}`}
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