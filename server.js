if(process.env.ENABLE_NEWRELIC == 'yes') require('newrelic');
var express           = require('express');
var path              = require('path');
var favicon           = require('serve-favicon');
var router            = require(__dirname + '/app/routes.js');
var bodyParser        = require('body-parser');
var cookieParser      = require('cookie-parser');
var session           = require('express-session');
var noCache           = require(__dirname + '/app/utils/no_cache.js');
var customCertificate = require(__dirname + '/app/utils/custom_certificate.js');
var proxy             = require(__dirname + '/app/utils/proxy.js');
var dependenciesCheck = require(__dirname + '/app/utils/dependent_resource_checker.js');
var logger            = require('winston');
var argv              = require('minimist')(process.argv.slice(2));
var environment       = require(__dirname + '/app/services/environment.js');      

var port        = (process.env.PORT || 3000);
var app         = express();

app.enable('trust proxy');
app.use(cookieParser());

proxy.use();
if (process.env.DISABLE_INTERNAL_HTTPS !== "true") {
  customCertificate.use();
}
else {
  logger.warn('DISABLE_INTERNAL_HTTPS is set.');
}

app.engine('html', require(__dirname + '/lib/template-engine.js').__express);
app.set('view engine', 'html');
app.set('vendorViews', __dirname + '/app/views');
app.set('views', __dirname + '/app/views');
app.enable('trust proxy');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/public', express.static(__dirname + '/public'));
app.use('/public', express.static(__dirname + '/govuk_modules/govuk_frontend_toolkit'));
app.use(favicon(path.join(__dirname, 'public', 'images','favicon.ico')));
app.use(function (req, res, next) {
  res.locals.assetPath  = '/public/';
  res.locals.routes     = router.paths;
  noCache(res);
  next();
});

app.use(function (req, res, next) {
  if (req.url.indexOf('/selfservice/') === 0) {
    var oldUrl = req.url;
    req.url = oldUrl.substring('/selfservice'.length);
    logger.info('REDIRECTED ' + oldUrl + ' to ' + req.url);
  }
  
  next();
});

app.use(function (req, res, next) {
  res.locals.assetPath  = '/public/';
  res.locals.routes     = router.paths;
  noCache(res);
  next();
});

if (!environment.isProduction()) {
  // Will return stack traces to the browser as well - only use in development!
  var errorhandler = require('errorhandler');
  app.use(errorhandler())
}

router.bind(app);

/**
 * Starts app
 */
function start() {
  app.listen(port);
  logger.info('Listening on port ' + port);
  logger.info('');
  
  return app;
}

if (!environment.isProduction()) {
  // startup application immediately on a non-production environment
  start();  
} else {
  logger.info("Checking Dependent resources before startup....");
  dependenciesCheck.checkDependentResources(start, 5);
}

//immediately invoke start if -i flag set. Allows script to be run by task runner
if (!!argv.i) {
  start();
}

module.exports = {
  start: start,
  getApp: app
};
