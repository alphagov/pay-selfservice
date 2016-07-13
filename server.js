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
var loggingMiddleware = require('morgan');
var argv              = require('minimist')(process.argv.slice(2));
var environment       = require(__dirname + '/app/services/environment.js');
var auth              = require(__dirname + '/app/services/auth_service.js');
var port              = (process.env.PORT || 3000);
var unconfiguredApp   = express();
var userModel         = require(__dirname + '/app/models/user.js');
base32                = require('thirty-two');
var passport = require('passport');
var utils = require('./utils');
var TotpStrategy = require('passport-totp').Strategy;

function findKeyForUserId(id, fn) {
  return fn(null, keys[id]);
}
var keys = {}


function saveKeyForUserId(id, key, fn) {
  keys[id] = key;
  return fn(null);
}


function initialiseGlobalMiddleware (app) {
  app.use(cookieParser());
  logger.stream = {
    write: function(message){
      logger.info(message);
    }
  };
  app.use(/\/((?!public|favicon.ico).)*/,loggingMiddleware('combined', {'stream' : logger.stream}));
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
  console.log('Listening on port ' + port);
  console.log('');
}

/**
 * Configures app
 * @return app
 */
function initialise() {
  var app = unconfiguredApp;

  initialiseTLS(app);
  initialiseProxy(app);
  initialisePublic(app);
  initialiseAuth(app);
  initialiseGlobalMiddleware(app);
  initialiseAppVariables(app);
  initialiseTemplateEngine(app);
  initialiseRoutes(app);
  initialiseErrorHandling(app);


  passport.use(new TotpStrategy(
    function(user, done) {
      // setup function, supply key and period to done callback
        return done(null, user.key, user.period);
    }
  ));
  nasty2factor(app);
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

function  nasty2factor(app){
  app.get('/login-otp',
    function(req, res) {
      res.render('login-otp', { user: req.user });
    });

  app.post('/login-otp',
    passport.authenticate('totp', { failureRedirect: '/login-otp' }),
    function(req, res) {
      req.session.secondFactor = 'totp';
      res.redirect('/');
    });

  app.get('/setup', function(req, res, next){
    var obj = req.user;
      if (obj) {
        // two-factor auth has already been setup
        var encodedKey = base32.encode(obj.key);

        // generate QR code for scanning into Google Authenticator
        // reference: https://code.google.com/p/google-authenticator/wiki/KeyUriFormat
        var otpUrl = 'otpauth://totp/' + req.user.email
                   + '?secret=' + encodedKey + '&period=' + (obj.period || 30);
        var qrImage = 'https://chart.googleapis.com/chart?chs=166x166&chld=L|0&cht=qr&chl=' + encodeURIComponent(otpUrl);

        res.render('setup', { user: req.user, key: encodedKey, qrImage: qrImage });
      } else {
        // new two-factor setup.  generate and save a secret key
        var key = utils.randomKey(10);
        var encodedKey = base32.encode(key);

        // generate QR code for scanning into Google Authenticator
        // reference: https://code.google.com/p/google-authenticator/wiki/KeyUriFormat
        var otpUrl = 'otpauth://totp/' + req.user.email
                   + '?secret=' + encodedKey + '&period=30';
        var qrImage = 'https://chart.googleapis.com/chart?chs=166x166&chld=L|0&cht=qr&chl=' + encodeURIComponent(otpUrl);
        userModel.updateTotpKey(req.user.email,key).then(function(user){
          res.render('setup', { user: user, key: encodedKey, qrImage: qrImage });
        },function(){ console.log('BROKE')});
      }
  });

}


