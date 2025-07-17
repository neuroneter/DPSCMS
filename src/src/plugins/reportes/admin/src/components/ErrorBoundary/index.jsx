import React from 'react';
import { Alert } from '@strapi/design-system';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Plugin Reportes Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert 
          variant="danger" 
          title="Error en el plugin Reportes"
          onClose={() => this.setState({ hasError: false, error: null })}
        >
          Ha ocurrido un error inesperado. Por favor, recarga la página e intenta nuevamente.
        </Alert>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;