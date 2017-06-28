//Please leave here even though it looks unused - this enables Node.js metrics to be pushed to Hosted Graphite
require(__dirname + '/app/utils/metrics').metrics;

// Node.js core dependencies
const path = require('path');

// NPM dependencies
const express = require('express');
const httpsAgent = require('https').globalAgent;
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('winston');
const loggingMiddleware = require('morgan');
const argv = require('minimist')(process.argv.slice(2));
const flash = require('connect-flash');

// Custom dependencies
const router = require(__dirname + '/app/routes');
const cookieUtil = require(__dirname + '/app/utils/cookie');
const noCache = require(__dirname + '/app/utils/no_cache');
const customCertificate = require(__dirname + '/app/utils/custom_certificate');
const proxy = require(__dirname + '/app/utils/proxy');
const environment = require(__dirname + '/app/services/environment');
const auth = require(__dirname + '/app/services/auth_service');
const middlwareUtils = require(__dirname + '/app/utils/middleware');
const errorHandler = require(__dirname + '/app/middleware/error_handler');

// Global constants
const port = (process.env.PORT || 3000);
const unconfiguredApp = express();

function initialiseGlobalMiddleware (app) {
  app.use(cookieParser());
  logger.stream = {
    write: function(message){
      logger.info(message);
    }
  };
  if (!process.env.DISABLE_REQUEST_LOGGING == "true") {
    app.use(/\/((?!public|favicon.ico).)*/,loggingMiddleware(
      ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - total time :response-time ms'));

  }
  app.use(favicon(path.join(__dirname, 'public', 'images','favicon.ico')));

  app.use(function (req, res, next) {
    res.locals.assetPath  = '/public/';
    res.locals.routes     = router.paths;    
    noCache(res);
    next();
  });
  
  app.use(middlwareUtils.excludingPaths(['/healthcheck'], function(req, res, next) {
    // flash requires sessions which also excludes healthcheck endpoint (see below)
    res.locals.flash      = req.flash();
    next();
  }));

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
}

function initialiseProxy(app) {
    app.enable('trust proxy');
    proxy.use();
}

function initialiseAppVariables(app) {
  app.set('view engine', 'html');
  app.set('vendorViews', __dirname + '/govuk_modules/govuk_template/views/layouts');
  app.set('views', __dirname + '/app/views');
}

function initialiseTemplateEngine(app) {
    app.engine('html', require(__dirname + '/lib/template-engine.js').__express);
}

function initialisePublic(app) {
  app.use('/public', express.static(__dirname + '/public'));
  app.use('/public', express.static(__dirname + '/govuk_modules/govuk_frontend_toolkit'));
  app.use('/public', express.static(__dirname + '/govuk_modules/govuk_template/assets'));
}

function initialiseRoutes(app) {
  router.bind(app);
}

function initialiseTLS() {
  if (process.env.DISABLE_INTERNAL_HTTPS !== "true") {
    customCertificate.addCertsToAgent(httpsAgent);
  }
  else {
    logger.warn('DISABLE_INTERNAL_HTTPS is set.');
  }
}

function initialiseAuth(app) {
  auth.initialise(app);
}

function initialiseCookies(app) {
  app.use(middlwareUtils.excludingPaths(['/healthcheck'], cookieUtil.sessionCookie()));
  app.use(middlwareUtils.excludingPaths(['/healthcheck'], cookieUtil.gatewayAccountCookie()));
  app.use(middlwareUtils.excludingPaths(['/healthcheck'], cookieUtil.registrationCookie()));
}

function initialiseErrorHandling(app) {
  app.use(errorHandler);
}

function listen() {
  const app = initialise();
  app.listen(port);
  logger.log('Listening on port ' + port);
}

/**
 * Configures app
 * @return app
 */
function initialise() {
  const app = unconfiguredApp;

  app.use(flash());
  initialiseTLS(app);
  initialiseProxy(app);

  initialiseCookies(app);
  initialiseAuth(app);
  initialiseGlobalMiddleware(app);
  initialiseAppVariables(app);
  initialiseTemplateEngine(app);
  initialiseRoutes(app);
  initialisePublic(app);
  initialiseErrorHandling(app);

  return app;
}

/**
 * Starts app after ensuring DB is up
 */
function start() {
  listen();
}

//immediately invoke start if -i flag set. Allows script to be run by task runner
if (!!argv.i) {
  start();
}

module.exports = {
  start: start,
  getApp: initialise

};
