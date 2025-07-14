module.exports = ({ env }) => ({
  
  'csv-uploader': {
    enabled: true,
    resolve: './src/plugins/csv-uploader'
  },

  upload: {
    config: {
      provider: "strapi-provider-upload-azure-storage",
      providerOptions: {
        account: env("STORAGE_ACCOUNT"),
        accountKey: env("STORAGE_ACCOUNT_KEY"),
        containerName: env("STORAGE_CONTAINER_NAME"),
        defaultPath: "assets",
        authType: env("STORAGE_AUTH_TYPE", "default")
      },
    },
  },
  graphql: {
    enabled: true,
    endpoint: '/graphql',
    shadowCRUD: true,
    playgroundAlways: true,
    depthLimit: 7,
    amountLimit: 100,
    apolloServer: {
      tracing: false,
    },
    v4CompatibilityMode: true
  }
});
