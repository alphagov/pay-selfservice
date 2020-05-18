// Please leave here even though it looks unused - this enables Node.js metrics to be pushed to Hosted Graphite
if (process.env.DISABLE_APPMETRICS !== 'true') {
  require('./app/utils/metrics').metrics()
}

// NPM dependencies
const express = require('express')
const nunjucks = require('nunjucks')
const favicon = require('serve-favicon')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const argv = require('minimist')(process.argv.slice(2))
const flash = require('connect-flash')
const staticify = require('staticify')('./public')

// Custom dependencies
const router = require('./app/routes')
const cookieUtil = require('./app/utils/cookie')
const noCache = require('./app/utils/no_cache')
const auth = require('./app/services/auth_service')
const middlwareUtils = require('./app/utils/middleware')
const errorLogger = require('./app/middleware/error_logger')
const errorHandler = require('./app/middleware/express_unhandled_error_handler')
const { nunjucksFilters } = require('@govuk-pay/pay-js-commons')
const logger = require('./app/utils/logger')(__filename)
const loggingMiddleware = require('./app/middleware/logging_middleware')
const Sentry = require('./app/utils/sentry.js').initialiseSentry()
const formatPSPname = require('./app/utils/format-PSP-name')

// Global constants
const port = (process.env.PORT || 3000)
const unconfiguredApp = express()
const { NODE_ENV } = process.env
const JAVASCRIPT_PATH = staticify.getVersionedPath('/js/application.min.js')
const ANALYTICS_TRACKING_ID = process.env.ANALYTICS_TRACKING_ID || ''

function warnIfAnalyticsNotSet () {
  if (ANALYTICS_TRACKING_ID === '') {
    logger.warn('Google Analytics Tracking ID [ANALYTICS_TRACKING_ID] is not set')
  }
}

function initialiseGlobalMiddleware (app) {
  app.use(cookieParser())
  logger.stream = {
    write: function (message) {
      logger.info(message)
    }
  }
  if (process.env.DISABLE_REQUEST_LOGGING !== 'true') {
    app.use(/\/((?!public|favicon.ico).)*/, loggingMiddleware())
  }
  app.use(favicon('node_modules/govuk-frontend/govuk/assets/images/favicon.ico'))
  app.use(staticify.middleware)

  app.use(function (req, res, next) {
    res.locals.asset_path = '/public/'
    res.locals.routes = router.paths
    res.locals.analyticsTrackingId = ANALYTICS_TRACKING_ID
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

function initialiseTemplateEngine (app) {
  // Configure nunjucks
  // see https://mozilla.github.io/nunjucks/api.html#configure
  const nunjucksEnvironment = nunjucks.configure([
    'node_modules/govuk-frontend/',
    'app/views'
  ], {
    express: app, // the express app that nunjucks should install to
    autoescape: true, // controls if output with dangerous characters are escaped automatically
    throwOnUndefined: false, // throw errors when outputting a null/undefined value
    trimBlocks: true, // automatically remove trailing newlines from a block/tag
    lstripBlocks: true, // automatically remove leading whitespace from a block/tag
    watch: NODE_ENV !== 'production', // reload templates when they are changed (server-side). To use watch, make sure optional dependency chokidar is installed
    noCache: NODE_ENV !== 'production' // never use a cache and recompile templates each time (server-side)
  })

  // Set view engine
  app.set('view engine', 'njk')

  // Version static assets on production for better caching
  // if it's not production we want to re-evaluate the assets on each file change
  nunjucksEnvironment.addGlobal('css_path', staticify.getVersionedPath('/stylesheets/application.min.css'))
  nunjucksEnvironment.addGlobal('js_path', NODE_ENV === 'production' ? JAVASCRIPT_PATH : staticify.getVersionedPath('/js/application.js'))
  nunjucksEnvironment.addGlobal('isDevelopment', NODE_ENV === 'development')

  // Load custom Nunjucks filters
  for (let name in nunjucksFilters) {
    let filter = nunjucksFilters[name]
    nunjucksEnvironment.addFilter(name, filter)
  }
  nunjucksEnvironment.addFilter('formatPSPname', formatPSPname)
}

function initialisePublic (app) {
  app.use('/public', express.static('public'))
  app.use('/', express.static('node_modules/govuk-frontend/govuk'))
}

function initialiseRoutes (app) {
  router.bind(app)
}

function initialiseAuth (app) {
  auth.initialise(app)
}

function initialiseCookies (app) {
  app.use(middlwareUtils.excludingPaths(['/healthcheck'], cookieUtil.sessionCookie()))
  app.use(middlwareUtils.excludingPaths(['/healthcheck'], cookieUtil.gatewayAccountCookie()))
  app.use(middlwareUtils.excludingPaths(['/healthcheck'], cookieUtil.registrationCookie()))
}

function initialiseErrorLogging (app) {
  app.use(errorLogger)
}

function initialiseErrorHandling (app) {
  app.use(errorHandler)
}

function listen () {
  const app = initialise()
  app.listen(port)
  logger.info('Listening on port ' + port)
}

/**
 * Configures app
 * @return app
 */
function initialise () {
  const app = unconfiguredApp

  app.disable('x-powered-by')
  app.use(flash())

  if (process.env.DISABLE_INTERNAL_HTTPS === 'true') {
    logger.warn('DISABLE_INTERNAL_HTTPS is set.')
  }

  app.use(Sentry.Handlers.requestHandler())
  initialisePublic(app)
  initialiseCookies(app)
  initialiseAuth(app)
  initialiseGlobalMiddleware(app)
  initialiseTemplateEngine(app)
  initialiseErrorLogging(app)
  initialiseRoutes(app) // This contains the 404 overrider and so should be last
  warnIfAnalyticsNotSet()
  app.use(Sentry.Handlers.errorHandler())
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
