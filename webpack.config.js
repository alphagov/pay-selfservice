const path = require('path')
const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const hotMiddlewareScript = 'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000'

module.exports = (env = {development: false}) => {
  const isDevelopment = env.development
  const extractSass = new ExtractTextPlugin({
    filename: 'stylesheets/application.css',
    disable: isDevelopment
  })

  return {
    entry: {
      browser: [
        path.resolve(__dirname, 'app/browsered.js'),
        hotMiddlewareScript
      ]
    },
    output: {
      filename: '[name].bundle.js',
      path: path.resolve(__dirname, 'public'),
      publicPath: '/public/'
    },
    resolve: {
      extensions: ['.js', '.css', '.scss', '.njk'],
      alias: {
        'govuk-toolkit': path.join(__dirname, '/node_modules/govuk_frontend_toolkit/stylesheets'),
        'govuk-elements': path.join(__dirname, '/node_modules/govuk-elements-sass/public/sass/_elements.scss')
      }
    },
    module: {
      rules: [{
        test: /application\.scss$/,
        exclude: /-ie8\.scss$/,
        use: extractSass.extract({
          use: [
            {
              loader: 'css-loader',
              options: {
                minimize: !isDevelopment
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
      },
      {
        test: /rfc822-validate/,
        use: {
          loader: 'imports-loader?define=>false'
        }
      }]
    },
    plugins: [
      extractSass,
      new webpack.HotModuleReplacementPlugin(),
      new CopyWebpackPlugin([
        {
          from: path.join(__dirname, '/node_modules/govuk_frontend_toolkit/images'),
          to: path.join(__dirname, '/public/images')
        },
        {
          from: path.join(__dirname, '/node_modules/govuk_frontend_toolkit/javascripts'),
          to: path.join(__dirname, '/public/javascripts')
        },
        {
          from: path.join(__dirname, '/node_modules/govuk_template_jinja/assets/'),
          to: path.join(__dirname, '/public/')
        }
      ])
    ]
  }
}
