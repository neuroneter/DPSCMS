import React, { useState, useEffect } from 'react';
import {
  Layout,
  HeaderLayout,
  ActionLayout,
  ContentLayout,
  Main,
  Box,
  Flex,
  Button,
  Typography,
  Select,
  Option,
  Alert,
  Card,
  CardHeader,
  CardBody,
  CardContent,
  Badge,
  Stack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Grid,
  GridItem,
} from '@strapi/design-system';
import {
  Download,
  Upload,
  Check,
  CrossCircle,
  Information,
  ArrowRight,
  Database,
  Clock,
} from '@strapi/icons';

import { useReportes } from '../../hooks/useReportes';
import LoadingState from '../../components/LoadingState';
import ErrorBoundary from '../../components/ErrorBoundary';
import FileUploadZone from '../../components/FileUploadZone';

const ImportPage = () => {
  const [selectedCollection, setSelectedCollection] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  const {
    isLoading,
    collections,
    validationRules,
    loadCollections,
    loadValidationRules,
    downloadTemplate,
    importFile,
    resetValidationRules
  } = useReportes();

  // Cargar Collection Types al inicializar
  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  // Cargar reglas cuando se selecciona una colección
  useEffect(() => {
    if (selectedCollection) {
      loadValidationRules(selectedCollection);
    } else {
      resetValidationRules();
    }
  }, [selectedCollection, loadValidationRules, resetValidationRules]);

  const handleFileSelection = (file) => {
    if (!file) return;

    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!validTypes.includes(file.type) && 
        !file.name.match(/\.(csv|xlsx|xls)$/i)) {
      return;
    }

    // Verificar tamaño (15MB máximo)
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      return;
    }

    setSelectedFile(file);
    setImportResults(null);
    setValidationErrors([]);
  };

  const handleDownloadTemplate = async () => {
    if (!selectedCollection) return;
    await downloadTemplate(selectedCollection);
  };

  const handleImport = async () => {
    if (!selectedFile || !selectedCollection) return;

    const result = await importFile(selectedFile, selectedCollection);
    
    if (result) {
      if (result.success) {
        setImportResults(result.data.results);
      } else {
        setValidationErrors(result.errors || []);
      }
    }
  };

  const resetImport = () => {
    setSelectedFile(null);
    setImportResults(null);
    setValidationErrors([]);
  };

  const formatFieldType = (type) => {
    const typeMap = {
      string: 'Texto',
      text: 'Texto largo',
      email: 'Email',
      integer: 'Número entero',
      biginteger: 'Número grande',
      float: 'Número decimal',
      decimal: 'Decimal',
      date: 'Fecha',
      datetime: 'Fecha y hora',
      time: 'Hora',
      boolean: 'Verdadero/Falso',
      enumeration: 'Lista de opciones',
      json: 'JSON',
      relation: 'Relación'
    };
    return typeMap[type] || type;
  };

  const getValidationBadgeColor = (required) => {
    return required ? 'danger' : 'neutral';
  };

  if (isLoading && collections.length === 0) {
    return <LoadingState message="Cargando Collection Types disponibles..." />;
  }

  return (
    <ErrorBoundary>
      <Layout>
        <Main>
          <HeaderLayout
            title="Importación Masiva"
            subtitle="Importa datos desde archivos CSV o Excel a tus Collection Types"
            as="h1"
          />

          <ContentLayout>
            <Stack spacing={6}>
              {/* Selector de Collection Type */}
              <Card>
                <CardHeader>
                  <Box>
                    <Typography variant="delta" tag="h2">
                      <Database style={{ marginRight: '8px' }} />
                      1. Seleccionar Collection Type
                    </Typography>
                  </Box>
                </CardHeader>
                <CardBody>
                  <CardContent>
                    <Stack spacing={2}>
                      <Typography variant="pi" textColor="neutral600">
                        Collection Type de destino
                      </Typography>
                      <Select
                        placeholder="Selecciona un Collection Type..."
                        value={selectedCollection}
                        onChange={setSelectedCollection}
                        disabled={isLoading}
                      >
                        {collections.map((collection) => (
                          <Option key={collection.uid} value={collection.uid}>
                            {collection.displayName} ({collection.uid})
                          </Option>
                        ))}
                      </Select>
                      {collections.length === 0 && !isLoading && (
                        <Alert variant="default" title="Sin Collection Types">
                          No se encontraron Collection Types disponibles o no tienes permisos para acceder a ellos.
                        </Alert>
                      )}
                    </Stack>
                  </CardContent>
                </CardBody>
              </Card>

              {/* Reglas de Validación */}
              {validationRules && (
                <Card>
                  <CardHeader>
                    <Box>
                      <Typography variant="delta" tag="h2">
                        <Information style={{ marginRight: '8px' }} />
                        2. Reglas de Validación
                      </Typography>
                    </Box>
                    <ActionLayout
                      startActions={
                        <Button
                          variant="secondary"
                          startIcon={<Download />}
                          onClick={handleDownloadTemplate}
                          loading={isLoading}
                        >
                          Descargar Plantilla
                        </Button>
                      }
                    />
                  </CardHeader>
                  <CardBody>
                    <CardContent>
                      <Stack spacing={4}>
                        <Alert variant="default" title="Campos del Collection Type">
                          A continuación se muestran todos los campos disponibles y sus reglas de validación.
                          Los campos marcados como "Requerido" son obligatorios.
                        </Alert>
                        
                        <Table colCount={4} rowCount={validationRules.fields.length + 1}>
                          <Thead>
                            <Tr>
                              <Th>
                                <Typography variant="sigma">Campo</Typography>
                              </Th>
                              <Th>
                                <Typography variant="sigma">Tipo</Typography>
                              </Th>
                              <Th>
                                <Typography variant="sigma">Requerido</Typography>
                              </Th>
                              <Th>
                                <Typography variant="sigma">Validaciones</Typography>
                              </Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {validationRules.fields.map((field) => (
                              <Tr key={field.name}>
                                <Td>
                                  <Typography fontWeight="semiBold">
                                    {field.name}
                                  </Typography>
                                </Td>
                                <Td>
                                  <Badge variant="secondary">
                                    {formatFieldType(field.type)}
                                  </Badge>
                                </Td>
                                <Td>
                                  <Badge variant={getValidationBadgeColor(field.required)}>
                                    {field.required ? 'Requerido' : 'Opcional'}
                                  </Badge>
                                </Td>
                                <Td>
                                  <Stack spacing={1}>
                                    {field.validations.length > 0 ? (
                                      field.validations.map((validation, index) => (
                                        <Typography key={index} variant="pi" textColor="neutral600">
                                          {validation}
                                        </Typography>
                                      ))
                                    ) : (
                                      <Typography variant="pi" textColor="neutral500">
                                        Ninguna
                                      </Typography>
                                    )}
                                  </Stack>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Stack>
                    </CardContent>
                  </CardBody>
                </Card>
              )}

              {/* Upload de Archivo */}
              {selectedCollection && (
                <Card>
                  <CardHeader>
                    <Box>
                      <Typography variant="delta" tag="h2">
                        <Upload style={{ marginRight: '8px' }} />
                        3. Cargar Archivo
                      </Typography>
                    </Box>
                  </CardHeader>
                  <CardBody>
                    <CardContent>
                      <Stack spacing={4}>
                        <FileUploadZone
                          onFileSelect={handleFileSelection}
                          selectedFile={selectedFile}
                          disabled={isLoading}
                        />

                        <Flex gap={3}>
                          <Button
                            variant="default"
                            startIcon={<ArrowRight />}
                            onClick={handleImport}
                            disabled={!selectedFile || isLoading}
                            loading={isLoading}
                          >
                            {isLoading ? 'Procesando...' : 'Validar e Importar'}
                          </Button>
                          
                          {(selectedFile || importResults) && (
                            <Button
                              variant="tertiary"
                              onClick={resetImport}
                              disabled={isLoading}
                            >
                              Reiniciar
                            </Button>
                          )}
                        </Flex>
                      </Stack>
                    </CardContent>
                  </CardBody>
                </Card>
              )}

              {/* Errores de Validación */}
              {validationErrors.length > 0 && (
                <Card>
                  <CardHeader>
                    <Box>
                      <Typography variant="delta" tag="h2">
                        <CrossCircle style={{ marginRight: '8px' }} />
                        Errores de Validación
                      </Typography>
                    </Box>
                  </CardHeader>
                  <CardBody>
                    <CardContent>
                      <Stack spacing={2}>
                        {validationErrors.slice(0, 10).map((error, index) => (
                          <Alert key={index} variant="danger" title={`Fila ${error.row || 'N/A'}`}>
                            {error.message}
                          </Alert>
                        ))}
                        {validationErrors.length > 10 && (
                          <Alert variant="warning" title="Más errores">
                            Se muestran solo los primeros 10 errores. Total: {validationErrors.length}
                          </Alert>
                        )}
                      </Stack>
                    </CardContent>
                  </CardBody>
                </Card>
              )}

              {/* Resultados de Importación */}
              {importResults && (
                <Card>
                  <CardHeader>
                    <Box>
                      <Typography variant="delta" tag="h2">
                        <Check style={{ marginRight: '8px' }} />
                        Resultados de Importación
                      </Typography>
                    </Box>
                  </CardHeader>
                  <CardBody>
                    <CardContent>
                      <Grid gap={4}>
                        <GridItem col={3}>
                          <Box padding={4} background="success100" borderRadius="4px">
                            <Typography variant="alpha" textColor="success700">
                              {importResults.imported}
                            </Typography>
                            <Typography variant="pi" textColor="success600">
                              Registros importados
                            </Typography>
                          </Box>
                        </GridItem>
                        <GridItem col={3}>
                          <Box padding={4} background="warning100" borderRadius="4px">
                            <Typography variant="alpha" textColor="warning700">
                              {importResults.skipped || 0}
                            </Typography>
                            <Typography variant="pi" textColor="warning600">
                              Registros omitidos
                            </Typography>
                          </Box>
                        </GridItem>
                        <GridItem col={3}>
                          <Box padding={4} background="danger100" borderRadius="4px">
                            <Typography variant="alpha" textColor="danger700">
                              {importResults.errors || 0}
                            </Typography>
                            <Typography variant="pi" textColor="danger600">
                              Errores
                            </Typography>
                          </Box>
                        </GridItem>
                        <GridItem col={3}>
                          <Box padding={4} background="neutral100" borderRadius="4px">
                            <Flex alignItems="center" gap={2}>
                              <Clock />
                              <Box>
                                <Typography variant="pi" textColor="neutral600">
                                  {new Date(importResults.timestamp).toLocaleString()}
                                </Typography>
                              </Box>
                            </Flex>
                          </Box>
                        </GridItem>
                      </Grid>

                      {importResults.user && (
                        <Box marginTop={4} padding={3} background="neutral100" borderRadius="4px">
                          <Typography variant="pi" textColor="neutral600">
                            Importado por: {importResults.user.name} ({importResults.user.email})
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </CardBody>
                </Card>
              )}
            </Stack>
          </ContentLayout>
        </Main>
      </Layout>
    </ErrorBoundary>
  );
};

export default ImportPage;