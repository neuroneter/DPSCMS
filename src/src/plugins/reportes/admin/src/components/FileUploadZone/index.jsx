import React, { useRef } from 'react';
import { Box, Flex, Typography, Button } from '@strapi/design-system';
import { Upload } from '@strapi/icons';
import styled from 'styled-components';

const UploadZone = styled(Box)`
  border: 2px dashed ${({ theme, $isDragOver }) => 
    $isDragOver ? theme.colors.primary600 : theme.colors.neutral300};
  border-radius: ${({ theme }) => theme.borderRadius};
  transition: border-color 0.2s ease;
  cursor: pointer;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary600};
  }
`;

const FileUploadZone = ({ 
  onFileSelect, 
  accept = '.csv,.xlsx,.xls',
  disabled = false,
  selectedFile = null 
}) => {
  const fileInputRef = useRef();
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const file = event.dataTransfer.files[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />
      
      <UploadZone
        padding={6}
        $isDragOver={isDragOver}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
        background={disabled ? 'neutral100' : 'neutral0'}
      >
        <Flex direction="column" alignItems="center" gap={3}>
          <Upload width="48px" height="48px" fill="neutral500" />
          
          {selectedFile ? (
            <Box textAlign="center">
              <Typography variant="delta" textColor="primary600">
                {selectedFile.name}
              </Typography>
              <Typography variant="pi" textColor="neutral600">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </Typography>
            </Box>
          ) : (
            <Box textAlign="center">
              <Typography variant="delta" textColor="neutral700">
                Arrastra y suelta tu archivo aquí
              </Typography>
              <Typography variant="pi" textColor="neutral600">
                o haz clic para seleccionar
              </Typography>
              <Typography variant="pi" textColor="neutral500">
                Formatos soportados: CSV, Excel (.xlsx, .xls)
              </Typography>
            </Box>
          )}
          
          {!selectedFile && (
            <Button variant="secondary" disabled={disabled}>
              Seleccionar archivo
            </Button>
          )}
        </Flex>
      </UploadZone>
    </>
  );
};

export default FileUploadZone;