module.exports = {
  src_folders: ['step_definitions'],

  test_runner: {
    type: 'cucumber',
    options: {
      feature_path: 'features',
      auto_start_session: true
    }
  },

  test_settings: {
    default: {
      launch_url: 'http://localhost:3001',
      silent: false,

      desiredCapabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          args: [
            '--no-sandbox',
            '--disable-gpu',
            '--disable-dev-shm-usage'
          ]
        }
      },

      webdriver: {
        start_process: true,
        port: 9515
      },

      globals: {
        waitForConditionTimeout: 15000,
        asyncHookTimeout: 30000
      }
    }
  }
};