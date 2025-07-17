import { Upload } from '@strapi/icons';

export default {
  register(app) {
    console.log('🎯 Plugin Reportes registrándose...');
    
    app.addMenuLink({
      to: 'reportes',
      icon: Upload,
      intlLabel: {
        id: 'reportes.plugin.name',
        defaultMessage: 'Reportes',
      },
      Component: () => {
        console.log('🚀 Cargando componente simple...');
        // Import directo y simple
        return import('./admin/src/pages/App')
          .then(module => {
            console.log('✅ Módulo cargado:', module);
            return module.default || module;
          })
          .catch(error => {
            console.error('❌ Error importando:', error);
            // Componente fallback
            return () => React.createElement('div', {}, 'Error cargando plugin');
          });
      },
      permissions: [],
    });
  },

  bootstrap(app) {
    console.log('🚀 Bootstrap completado');
  },
};