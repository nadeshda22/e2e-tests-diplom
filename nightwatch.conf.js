const path = require('path');

module.exports = {
  src_folders: ['step_definitions'],
  test_runner: {
    type: 'cucumber',
    options: {
      feature_path: 'features',
      auto_start_session: true,
      tags: 'not @ignore'
    }
  },

  test_settings: {
    default: {
      launch_url:
          'http://localhost:3001',
      silent: true,
      live_output: false,
      detailed_output: false,
      disable_error_log: true,
      desiredCapabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          prefs: {
            'download.default_directory': path.resolve(__dirname, 'test_data/download'),
            'download.prompt_for_download': false,
            'download.directory_upgrade': true,
            'safebrowsing.enabled': false,
            'safebrowsing.disable_download_protection': true,

            'plugins.always_open_pdf_externally': true,
          },
          args: [
            '--remote-debugging-port=9222',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-popup-blocking'
          ]
        }
      },
      webdriver: {
        start_process: true,
        port: 9515,
        cli_args: [
          '--silent'
        ]
      },

      screenshots: {
        enabled: true,
        on_failure: true,
        on_error: true,
        path: 'reports/screenshots'
      },

      globals: {

        waitForConditionTimeout:
            30000,

        asyncHookTimeout:
            120000,

        retryAssertionTimeout:
            5000,

        abortOnAssertionFailure:
            false,

        throwOnMultipleElementsReturned:
            false,

        suppressWarningsOnMultipleElementsReturned:
            true
      }
    }
  }
};