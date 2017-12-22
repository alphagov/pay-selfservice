const path = require('path')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

const extractSass = new ExtractTextPlugin({
  filename: 'stylesheets/[name].css',
  disable: process.env.NODE_ENV === 'development'
})

module.exports = {
  entry: {
    'browser': path.resolve(__dirname, 'app/browsered.js'),
    'application': path.resolve(__dirname, 'app/assets/sass/application.scss'),
    'application-ie6': path.resolve(__dirname, 'app/assets/sass/application-ie6.scss'),
    'application-ie7': path.resolve(__dirname, 'app/assets/sass/application-ie7.scss'),
    'application-ie8': path.resolve(__dirname, 'app/assets/sass/application-ie8.scss')
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'public')
  },
  resolve: {
    extensions: ['.js', '.css', '.scss', '.njk'],
    alias: {
      'govuk-toolkit': path.join(__dirname, '/node_modules/govuk_frontend_toolkit/stylesheets'),
      'govuk-elements': path.join(__dirname, '/node_modules/govuk-elements-sass/public/sass/_elements.scss')
    }
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: extractSass.extract({
          use: [
            {
              loader: 'css-loader',
              options: {
                minimize: process.env.NODE_ENV === 'production'
              }
            },
            { loader: 'sass-loader' }
          ],
          // use style-loader in development
          fallback: 'style-loader'
        })
      },
      {
        test: /\.njk$/,
        loader: 'nunjucks-loader'
      }
    ]
  },
  plugins: [
    extractSass
  ]
}
