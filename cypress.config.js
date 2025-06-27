const { defineConfig } = require('cypress')
const path = require('path')
const addAccessibilityTasks = require('wick-a11y/accessibility-tasks')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')

const packageJson = require('./package.json')
const aliases = packageJson._moduleAliases || {}

const webpackAliases = Object.entries(aliases).reduce((acc, [key, value]) => {
  acc[key] = path.resolve(__dirname, value)
  return acc
}, {})

module.exports = defineConfig({
  viewportHeight: 1200,
  viewportWidth: 1280,
  env: {
    TEST_SESSION_ENCRYPTION_KEY:
      'naskjwefvwei72rjkwfmjwfi72rfkjwefmjwefiuwefjkbwfiu24fmjbwfk',
    MOCK_HTTP_SERVER_URL: 'http://127.0.0.1:8000',
    MOCK_HTTP_SERVER_PORT: 8000
  },
  fileServerFolder: './test/cypress',
  screenshotsFolder: './test/cypress/screenshots',
  videosFolder: './test/cypress/videos',
  video: false,
  e2e: {
    setupNodeEvents (on, config) {
      addAccessibilityTasks(on)
      on('file:preprocessor', require('@cypress/webpack-preprocessor')({
        webpackOptions: {
          resolve: {
            alias: webpackAliases,
            extensions: ['.ts', '.js', '.json']
          },
          module: {
            rules: [
              {
                test: /\.ts$/,
                use: [
                  {
                    loader: 'ts-loader',
                    options: {
                      transpileOnly: true,
                      compilerOptions: {
                        esModuleInterop: true,
                        allowSyntheticDefaultImports: true,
                        target: 'es2017',
                        lib: ['es2017', 'dom', 'dom.iterable'],
                        types: ['cypress', 'node'],
                        moduleResolution: 'nodenext',
                        module: 'NodeNext',
                        strict: false,
                        skipLibCheck: true
                      }
                    }
                  }
                ],
                exclude: /node_modules/,
              },
            ],
          },
          plugins: [
            new NodePolyfillPlugin({
              additionalAliases: ['process'],
            })
          ],
        }
      }))
      return require('./test/cypress/plugins')(on, config)
    },

    baseUrl: 'http://127.0.0.1:3000',
    specPattern: [
      './test/cypress/integration/**/*.cy.{js,ts}',
      './test/cypress/integration/**/*.rebrand.{js,ts}',
    ],
    supportFile: './test/cypress/support'
  }
})
