if(process.env.ENABLE_NEWRELIC == 'yes') require('newrelic');
var express           = require('express');
var path              = require('path');
var favicon           = require('serve-favicon');
var router            = require(__dirname + '/app/routes.js');
var bodyParser        = require('body-parser');
var cookieParser      = require('cookie-parser');
var session           = require('express-session');
var selfServiceSession= require(__dirname + '/app/utils/session.js').selfServiceSession;
var noCache           = require(__dirname + '/app/utils/no_cache.js');
var customCertificate = require(__dirname + '/app/utils/custom_certificate.js');
var proxy             = require(__dirname + '/app/utils/proxy.js');
var dependenciesCheck = require(__dirname + '/app/utils/dependent_resource_checker.js');
var logger            = require('winston');
var loggingMiddleware = require('morgan');
var argv              = require('minimist')(process.argv.slice(2));
var environment       = require(__dirname + '/app/services/environment.js');
var auth              = require(__dirname + '/app/services/auth_service.js');
var port              = (process.env.PORT || 3000);
var unconfiguredApp   = express();
var models            = require('./app/models/models.js');
var flash             = require('connect-flash');


function initialiseGlobalMiddleware (app) {
  app.use(cookieParser());
  logger.stream = {
    write: function(message){
      logger.info(message);
    }
  };
  app.use(/\/((?!public|favicon.ico).)*/,loggingMiddleware(
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - total time :response-time ms'));
  app.use(favicon(path.join(__dirname, 'public', 'images','favicon.ico')));

  app.use(function (req, res, next) {
    res.locals.assetPath  = '/public/';
    res.locals.routes     = router.paths;
    res.locals.flash      = req.flash();
    noCache(res);
    next();
  });

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
}

function initialiseProxy(app) {
    app.enable('trust proxy');
    proxy.use();
}

function initialiseAppVariables(app) {
  app.set('view engine', 'html');
  app.set('vendorViews', __dirname + '/app/views');
  app.set('views', __dirname + '/app/views');
}

function initialiseTemplateEngine(app) {
    app.engine('html', require(__dirname + '/lib/template-engine.js').__express);
}

function initialiseErrorHandling(app) {
  if (!environment.isProduction()) {
    // Will return stack traces to the browser as well - only use in development!
    var errorhandler = require('errorhandler');
    app.use(errorhandler())
  }
}

function initialisePublic(app) {
  app.use('/public', express.static(__dirname + '/public'));
  app.use('/public', express.static(__dirname + '/govuk_modules/govuk_frontend_toolkit'));
}

function initialiseRoutes(app) {
  router.bind(app);
}

function initialiseTLS() {
  if (process.env.DISABLE_INTERNAL_HTTPS !== "true") {
    customCertificate.use();
  }
  else {
    logger.warn('DISABLE_INTERNAL_HTTPS is set.');
  }
}

function initialiseAuth(app) {
  auth.initialise(app);
}


function listen() {
  var app = initialise();
  app.listen(port);
  logger.log('Listening on port ' + port);
}

/**
 * Configures app
 * @return app
 */
function initialise() {
  var app = unconfiguredApp;

  app.use(flash());
  initialiseTLS(app);
  initialiseProxy(app);
  app.use(session(selfServiceSession()));
  initialiseAuth(app);
  initialiseGlobalMiddleware(app);
  initialiseAppVariables(app);
  initialiseTemplateEngine(app);
  initialiseRoutes(app);
  initialiseErrorHandling(app);
  initialisePublic(app);


  return app;
}

/**
 * Starts app after ensuring DB is up
 */
function start() {
  if (!environment.isProduction()) {
    // startup application immediately on a non-production environment
    listen();
  } else {
    logger.info("Checking Dependent resources before startup....");
    dependenciesCheck.checkDependentResources(listen, 5);
  }
}

//immediately invoke start if -i flag set. Allows script to be run by task runner
if (!!argv.i) {
  start();
}

module.exports = {
  start: start,
  getApp: initialise()
};
