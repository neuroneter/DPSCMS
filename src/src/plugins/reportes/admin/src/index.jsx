import { prefixPluginTranslations } from '@strapi/helper-plugin';
import pluginId from './pluginId';

export default {
  register(app) {
    // Registrar el plugin y su página principal
    app.registerPlugin({
      id: pluginId,
      initializer: () => import('./pages/App'),
      isReady: false,
      name: pluginId,
    });
  },

  bootstrap(app) {
    // Bootstrap adicional si es necesario
  },

  async registerTrads({ locales }) {
    const importedTrads = await Promise.all(
      locales.map((locale) => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => {
            return {
              data: prefixPluginTranslations(data, pluginId),
              locale,
            };
          })
          .catch(() => {
            return {
              data: {},
              locale,
            };
          });
      })
    );

    return Promise.resolve(importedTrads);
  },
};