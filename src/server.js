const path = require('path')
const express = require('express')
const metrics = require('@govuk-pay/pay-js-metrics')
const { configureCsrfMiddleware } = require('@govuk-pay/pay-js-commons/lib/utils/middleware/csrf.middleware')
const nunjucks = require('nunjucks')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const flash = require('connect-flash')
const staticify = require('staticify')(__dirname)
const router = require('@root/routes')
const cookieUtil = require('@utils/cookie')
const noCache = require('@utils/no-cache')
const auth = require('@services/auth.service')
const middlewareUtils = require('@utils/middleware')
const errorHandler = require('@middleware/error-handler')
const { nunjucksFilters } = require('@govuk-pay/pay-js-commons')
const logger = require('@utils/logger')(__filename)
const loggingMiddleware = require('@middleware/logging-middleware')
const { requestContextMiddleware } = require('@services/clients/base/request-context')
const Sentry = require('@utils/sentry.js').initialiseSentry()
const formatPSPName = require('@utils/format-PSP-name')
const smartCaps = require('@utils/custom-nunjucks-filters/smart-caps')
const govukDate = require('@utils/custom-nunjucks-filters/govuk-date')
const formatAccountPathsFor = require('@utils/format-account-paths-for')
const formatServicePathsFor = require('@utils/format-service-paths-for')
const healthcheckController = require('@controllers/healthcheck.controller')
const { healthcheck } = require('@root/paths.js')
const { boolToText, boolToOnOrOff } = require('@utils/on-or-off')
// Global constants
const bindHost = process.env.BIND_HOST || '127.0.0.1'
const port = process.env.PORT || 3000
const unconfiguredApp = express()
const { NODE_ENV, EXPERIMENTAL_FEATURES_FLAG } = process.env
const ANALYTICS_TRACKING_ID = process.env.ANALYTICS_TRACKING_ID || ''
const EXPERIMENTAL_FEATURES = EXPERIMENTAL_FEATURES_FLAG === 'true'
function warnIfAnalyticsNotSet() {
  if (ANALYTICS_TRACKING_ID === '') {
    logger.warn('Google Analytics Tracking ID [ANALYTICS_TRACKING_ID] is not set')
  }
}

function addCsrfMiddleware(app) {
  const csrfMiddleware = configureCsrfMiddleware(logger, 'session', 'csrfSecret', 'csrfToken')
  app.use(csrfMiddleware.setSecret, csrfMiddleware.checkToken, csrfMiddleware.generateToken)
}

function initialiseGlobalMiddleware(app) {
  app.use(staticify.middleware)
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

  app.use(cookieParser())
  app.use(requestContextMiddleware)
  if (process.env.DISABLE_REQUEST_LOGGING !== 'true') {
    app.use(/\/((?!assets|favicon.ico).)*/, loggingMiddleware())
  }

  app.use(function (req, res, next) {
    res.locals.asset_path = '/assets/'
    res.locals.routes = router.paths
    res.locals.paths = router.paths
    res.locals.currentPath = req.path
    res.locals.NEW_GOVUK_HEADER = EXPERIMENTAL_FEATURES
    res.locals.formatAccountPathsFor = formatAccountPathsFor
    res.locals.formatServicePathsFor = formatServicePathsFor
    res.locals.analyticsTrackingId = ANALYTICS_TRACKING_ID
    noCache(res)
    next()
  })

  app.use(healthcheck.path, healthcheckController.healthcheck)
  app.use(
    middlewareUtils.excludingPaths(['/healthcheck'], function (req, res, next) {
      // flash requires sessions which also excludes healthcheck endpoint (see below)
      res.locals.flash = req.flash()
      next()
    })
  )

  addCsrfMiddleware(app)
}

function initialiseTemplateEngine(app) {
  // Configure nunjucks
  // see https://mozilla.github.io/nunjucks/api.html#configure
  const nunjucksEnvironment = nunjucks.configure(
    [path.join(__dirname, 'views')].concat(
      NODE_ENV === 'test' ? [path.join(__dirname, '../node_modules/govuk-frontend/dist')] : []
    ),
    {
      // some tests need to lookup views from node_modules
      express: app, // the express app that nunjucks should install to
      autoescape: true, // controls if output with dangerous characters are escaped automatically
      throwOnUndefined: false, // throw errors when outputting a null/undefined value
      trimBlocks: true, // automatically remove trailing newlines from a block/tag
      lstripBlocks: true, // automatically remove leading whitespace from a block/tag
      watch: NODE_ENV !== 'production', // reload templates when they are changed (server-side). To use watch, make sure optional dependency chokidar is installed
      noCache: NODE_ENV !== 'production', // never use a cache and recompile templates each time (server-side)
    }
  )

  // Set view engine
  app.set('view engine', 'njk')

  // Version static assets on production for better caching
  // if it's not production we want to re-evaluate the assets on each file change
  nunjucksEnvironment.addGlobal('css_path', staticify.getVersionedPath('/assets/stylesheets/application.css'))
  nunjucksEnvironment.addGlobal('js_path', staticify.getVersionedPath('/assets/js/client.js'))
  nunjucksEnvironment.addGlobal('govukRebrand', true)

  // Load custom Nunjucks filters
  for (const name in nunjucksFilters) {
    const filter = nunjucksFilters[name]
    nunjucksEnvironment.addFilter(name, filter)
  }
  nunjucksEnvironment.addFilter('formatPSPname', formatPSPName)
  nunjucksEnvironment.addFilter('isList', (n) => Array.isArray(n))
  nunjucksEnvironment.addFilter('smartCaps', smartCaps)
  nunjucksEnvironment.addFilter('govukDate', govukDate)
  nunjucksEnvironment.addFilter('docsLink', (text, slug) => {
    return new nunjucks.runtime.SafeString(
      `<a class="govuk-link govuk-link--no-visited-state" href="https://docs.payments.service.gov.uk/${slug}">${text}</a>`
    )
  })
  nunjucksEnvironment.addFilter('boolToText', boolToText)
  nunjucksEnvironment.addFilter('boolToOnOrOff', boolToOnOrOff)
  nunjucksEnvironment.addFilter('addKey', (obj, key, value) => {
    return Object.assign({}, obj, { [key]: value })
  })
}

function initialiseRoutes(app) {
  router.bind(app)
}

function initialiseAuth(app) {
  auth.initialise(app)
}

function initialiseCookies(app) {
  app.use(middlewareUtils.excludingPaths(['/healthcheck'], cookieUtil.sessionCookie()))
  app.use(middlewareUtils.excludingPaths(['/healthcheck'], cookieUtil.registrationCookie()))
}

function initialiseErrorHandling(app) {
  app.use(errorHandler)
}

function listen(app) {
  app.listen(port, bindHost)
  logger.info(`Listening on ${bindHost}:${port}`)
}

/**
 * Configures app
 * @return {Express} app
 */
function initialise() {
  const app = unconfiguredApp

  if (NODE_ENV === 'development') {
    const sessionId = crypto.randomUUID()
    app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
      logger.debug(req.url)
      res.json({
        workspace: {
          root: process.env.PROJECT_DIR,
          uuid: sessionId,
        },
      })
    })
  }

  if (NODE_ENV !== 'test') {
    app.use(metrics.initialise())
  }

  app.disable('x-powered-by')
  app.use(flash())

  if (process.env.DISABLE_INTERNAL_HTTPS === 'true') {
    logger.warn('DISABLE_INTERNAL_HTTPS is set.')
  }

  app.use(Sentry.Handlers.requestHandler())
  initialiseCookies(app)
  initialiseGlobalMiddleware(app)
  initialiseAuth(app)
  initialiseTemplateEngine(app)
  initialiseRoutes(app) // This contains the 404 overrider and so should be last
  warnIfAnalyticsNotSet()
  initialiseErrorHandling(app)

  return app
}

function start() {
  const app = initialise()
  if (process.env.LOCAL_HTTPS === 'true') {
    const { listenHttps } = require('./listen-https')
    listenHttps(app)
  } else {
    listen(app)
  }
}

module.exports = {
  start,
  getApp: initialise,
  staticify,
}
