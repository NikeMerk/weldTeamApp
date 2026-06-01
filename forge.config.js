module.exports = {
  packagerConfig: {
    asar: true
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {}
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32']
    }
  ]
  // Удали секцию plugins, если она была
};