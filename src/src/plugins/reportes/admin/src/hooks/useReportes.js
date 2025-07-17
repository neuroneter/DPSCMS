import { useState, useCallback } from 'react';
import { useFetchClient, useNotification } from '@strapi/helper-plugin';

export const useReportes = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [collections, setCollections] = useState([]);
  const [validationRules, setValidationRules] = useState(null);
  
  const { get, post } = useFetchClient();
  const toggleNotification = useNotification();

  // Cargar Collection Types disponibles
  const loadCollections = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await get('/reportes/collections');
      setCollections(response.data || []);
      return response.data;
    } catch (error) {
      console.error('Error loading collections:', error);
      toggleNotification({
        type: 'warning',
        message: 'Error al cargar Collection Types disponibles',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [get, toggleNotification]);

  // Cargar reglas de validación
  const loadValidationRules = useCallback(async (collectionUID) => {
    try {
      setIsLoading(true);
      const response = await get(`/reportes/collections/${collectionUID}/rules`);
      setValidationRules(response.data);
      return response.data;
    } catch (error) {
      console.error('Error loading validation rules:', error);
      toggleNotification({
        type: 'warning',
        message: 'Error al cargar reglas de validación',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [get, toggleNotification]);

  // Descargar plantilla
  const downloadTemplate = useCallback(async (collectionUID) => {
    try {
      setIsLoading(true);
      
      const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
      
      const response = await fetch(`/admin/api/reportes/collections/${collectionUID}/template`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error downloading template');
      }

      // Obtener el nombre del archivo del header
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `template_${collectionUID}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Descargar archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toggleNotification({
        type: 'success',
        message: 'Plantilla descargada exitosamente',
      });

      return true;
    } catch (error) {
      console.error('Error downloading template:', error);
      toggleNotification({
        type: 'warning',
        message: 'Error al descargar la plantilla',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toggleNotification]);

  // Importar archivo
  const importFile = useCallback(async (file, collectionType) => {
    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('collectionType', collectionType);

      const response = await post('/reportes/import', formData);
      
      if (response.data.success) {
        toggleNotification({
          type: 'success',
          message: `Importación completada: ${response.data.data.results.imported} registros procesados`,
        });
      } else {
        toggleNotification({
          type: 'warning',
          message: 'Se encontraron errores durante la importación',
        });
      }

      return response.data;
    } catch (error) {
      console.error('Error importing file:', error);
      toggleNotification({
        type: 'warning',
        message: 'Error durante la importación',
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [post, toggleNotification]);

  return {
    // Estado
    isLoading,
    collections,
    validationRules,
    
    // Acciones
    loadCollections,
    loadValidationRules,
    downloadTemplate,
    importFile,
    
    // Utilidades
    resetValidationRules: () => setValidationRules(null),
  };
};