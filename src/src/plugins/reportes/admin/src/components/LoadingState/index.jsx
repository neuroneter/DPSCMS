import React from 'react';
import { Box, Flex, Loader, Typography } from '@strapi/design-system';

const LoadingState = ({ message = 'Cargando...' }) => (
  <Box padding={8}>
    <Flex direction="column" alignItems="center" gap={3}>
      <Loader />
      <Typography variant="omega" textColor="neutral600">
        {message}
      </Typography>
    </Flex>
  </Box>
);

export default LoadingState;