const express = require('express')
const metrics = require('@govuk-pay/pay-js-metrics')
const nunjucks = require('nunjucks')
const favicon = require('serve-favicon')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
// const csrf = require('csurf')
const { csrfSync } = require('csrf-sync')
const argv = require('minimist')(process.argv.slice(2))
const flash = require('connect-flash')
const staticify = require('staticify')('./public')

const router = require('./app/routes')
const cookieUtil = require('./app/utils/cookie')
const noCache = require('./app/utils/no-cache')
const auth = require('./app/services/auth.service')
const middlwareUtils = require('./app/utils/middleware')
const errorHandler = require('./app/middleware/error-handler')
const { nunjucksFilters } = require('@govuk-pay/pay-js-commons')
const logger = require('./app/utils/logger')(__filename)
const loggingMiddleware = require('./app/middleware/logging-middleware')
const { requestContextMiddleware } = require('./app/services/clients/base/request-context')
const Sentry = require('./app/utils/sentry.js').initialiseSentry()
const formatPSPname = require('./app/utils/format-PSP-name')
const smartCaps = require('./app/utils/custom-nunjucks-filters/smart-caps')
const formatAccountPathsFor = require('./app/utils/format-account-paths-for')
const formatFutureStrategyAccountPathsFor = require('./app/utils/format-future-strategy-account-paths-for')
const formatServicePathsFor = require('./app//utils/format-service-paths-for')
const healthcheckController = require('./app/controllers/healthcheck.controller')
const { healthcheck } = require('./app/paths.js')
// Global constants
const bindHost = (process.env.BIND_HOST || '127.0.0.1')
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

function addCsrfMiddleware (app) {
  // app.use(csrf({
  //   value: function (req) {
  //     // supports CSRF validation only through POST requests and ignores csrf tokens in headers/query strings.
  //     return (req.body && req.body.csrfToken) || (req.query && req.query.csrfToken)
  //   }
  // }))
  // sets the csrf token on response local variable scoped to request, so token is available to the views
  // app.use(function (req, res, next) {
  //   res.locals.csrf = req.csrfToken()
  //   next()
  // })
  app.use(csrfSync({
    getTokenFromRequest: function (req) {
      // supports CSRF validation only through POST requests and ignores csrf tokens in headers/query strings.
      return (req.body && req.body.csrfToken) || (req.query && req.query.csrfToken)
    }
  }))
  // sets the csrf token on response local variable scoped to request, so token is available to the views
  app.use(function (req, res, next) {
    res.locals.csrf = req.csrfToken()
    next()
  })
}

function initialiseGlobalMiddleware (app) {
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

  app.use(cookieParser())
  app.use(requestContextMiddleware)
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
    res.locals.formatAccountPathsFor = formatAccountPathsFor
    res.locals.formatFutureStrategyAccountPathsFor = formatFutureStrategyAccountPathsFor
    res.locals.formatServicePathsFor = formatServicePathsFor
    res.locals.analyticsTrackingId = ANALYTICS_TRACKING_ID
    noCache(res)
    next()
  })

  app.use(healthcheck.path, healthcheckController.healthcheck)
  app.use(middlwareUtils.excludingPaths(['/healthcheck'], function (req, res, next) {
    // flash requires sessions which also excludes healthcheck endpoint (see below)
    res.locals.flash = req.flash()
    next()
  }))

  addCsrfMiddleware(app)
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

  // Load custom Nunjucks filters
  for (const name in nunjucksFilters) {
    const filter = nunjucksFilters[name]
    nunjucksEnvironment.addFilter(name, filter)
  }
  nunjucksEnvironment.addFilter('formatPSPname', formatPSPname)
  nunjucksEnvironment.addFilter('isList', (n) => Array.isArray(n))
  nunjucksEnvironment.addFilter('smartCaps', smartCaps)
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
  app.use(middlwareUtils.excludingPaths(['/healthcheck'], cookieUtil.registrationCookie()))
}

function initialiseErrorHandling (app) {
  app.use(errorHandler)
}

function listen () {
  const app = initialise()
  app.listen(port, bindHost)
  logger.info(`Listening on ${bindHost}:${port}`)
}

/**
 * Configures app
 * @return app
 */
function initialise () {
  const app = unconfiguredApp
  if (NODE_ENV !== 'test') {
    app.use(metrics.initialise())
  }

  app.disable('x-powered-by')
  app.use(flash())

  if (process.env.DISABLE_INTERNAL_HTTPS === 'true') {
    logger.warn('DISABLE_INTERNAL_HTTPS is set.')
  }

  app.use(Sentry.Handlers.requestHandler())
  initialisePublic(app)
  initialiseCookies(app)
  initialiseGlobalMiddleware(app)
  initialiseAuth(app)
  initialiseTemplateEngine(app)
  initialiseRoutes(app) // This contains the 404 overrider and so should be last
  warnIfAnalyticsNotSet()
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
  start,
  getApp: initialise,
  staticify
}
