// Node.js core dependencies
const path = require('path')

// Please leave here even though it looks unused - this enables Node.js metrics to be pushed to Hosted Graphite
require(path.join(__dirname, '/app/utils/metrics')).metrics()

// NPM dependencies
const express = require('express')
const httpsAgent = require('https').globalAgent
const favicon = require('serve-favicon')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const logger = require('winston')
const loggingMiddleware = require('morgan')
const argv = require('minimist')(process.argv.slice(2))
const flash = require('connect-flash')
const staticify = require('staticify')(path.join(__dirname, 'public'))
const Nunjucks = require('nunjucks')

// Custom dependencies
const router = require(path.join(__dirname, '/app/routes'))
const cookieUtil = require(path.join(__dirname, '/app/utils/cookie'))
const noCache = require(path.join(__dirname, '/app/utils/no_cache'))
const customCertificate = require(path.join(__dirname, '/app/utils/custom_certificate'))
const proxy = require(path.join(__dirname, '/app/utils/proxy'))
const auth = require(path.join(__dirname, '/app/services/auth_service'))
const middlwareUtils = require(path.join(__dirname, '/app/utils/middleware'))
const errorHandler = require(path.join(__dirname, '/app/middleware/error_handler'))

// Global constants
const port = (process.env.PORT || 3000)
const unconfiguredApp = express()
const nodeEnv = process.env.NODE_ENV
const CSS_PATH = staticify.getVersionedPath('/stylesheets/application.css')
const JAVASCRIPT_PATH = staticify.getVersionedPath('/js/application.js')

function initialiseGlobalMiddleware (app) {
  app.use(cookieParser())
  logger.stream = {
    write: function (message) {
      logger.info(message)
    }
  }
  if (!process.env.DISABLE_REQUEST_LOGGING === 'true') {
    app.use(/\/((?!public|favicon.ico).)*/, loggingMiddleware(
      ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - total time :response-time ms'))
  }
  app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')))
  app.use(staticify.middleware)

  app.use(function (req, res, next) {
    res.locals.assetPath = '/public/'
    res.locals.routes = router.paths
    noCache(res)
    next()
  })

  app.use(middlwareUtils.excludingPaths(['/healthcheck'], function (req, res, next) {
    // flash requires sessions which also excludes healthcheck endpoint (see below)
    res.locals.flash = req.flash()
    next()
  }))

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
}

function initialiseProxy (app) {
  app.enable('trust proxy')
  proxy.use()
}

function initialiseAppVariables (app) {
  app.set('view engine', 'html')
  app.set('vendorViews', path.join(__dirname, '/app/views-nunjucks/base'))
  app.set('views', path.join(__dirname, '/app/views-nunjucks'))
}

function initialiseTemplateEngine (app) {
  const environment = Nunjucks.configure(path.join(__dirname, '/app/views-nunjucks'), {
    autoescape: true,
    watch: nodeEnv !== 'production',
    noCache: nodeEnv !== 'production',
    express: app
  })

  environment.addGlobal('cssPath', nodeEnv === 'production' ? CSS_PATH : staticify.getVersionedPath('/stylesheets/application.css'))
  environment.addGlobal('jsPath', nodeEnv === 'production' ? JAVASCRIPT_PATH : staticify.getVersionedPath('/js/application.js'))
}

function initialisePublic (app) {
  app.use('/public', express.static(path.join(__dirname, '/public')))
  app.use('/public', express.static(path.join(__dirname, '/govuk_modules/govuk_frontend_toolkit')))
  app.use('/public', express.static(path.join(__dirname, '/govuk_modules/govuk_template/assets')))
}

function initialiseRoutes (app) {
  router.bind(app)
}

function initialiseTLS () {
  if (process.env.DISABLE_INTERNAL_HTTPS !== 'true') {
    customCertificate.addCertsToAgent(httpsAgent)
  } else {
    logger.warn('DISABLE_INTERNAL_HTTPS is set.')
  }
}

function initialiseAuth (app) {
  auth.initialise(app)
}

function initialiseCookies (app) {
  app.use(middlwareUtils.excludingPaths(['/healthcheck'], cookieUtil.sessionCookie()))
  app.use(middlwareUtils.excludingPaths(['/healthcheck'], cookieUtil.gatewayAccountCookie()))
  app.use(middlwareUtils.excludingPaths(['/healthcheck'], cookieUtil.registrationCookie()))
}

function initialiseErrorHandling (app) {
  app.use(errorHandler)
}

function listen () {
  const app = initialise()
  app.listen(port)
  logger.log('Listening on port ' + port)
}

/**
 * Configures app
 * @return app
 */
function initialise () {
  const app = unconfiguredApp
  app.disable('x-powered-by')
  app.use(flash())
  initialiseTLS(app)
  initialiseProxy(app)

  initialiseCookies(app)
  initialiseAuth(app)
  initialiseGlobalMiddleware(app)
  initialiseAppVariables(app)
  initialiseTemplateEngine(app)
  initialiseRoutes(app)
  initialisePublic(app)
  initialiseErrorHandling(app)

  return app
}

/**
 * Starts app after ensuring DB is up
 */
function start () {
  listen()
}

// immediately invoke start if -i flag set. Allows script to be run by task runner
if (argv.i) {
  start()
}

module.exports = {
  start: start,
  getApp: initialise,
  staticify: staticify
}
