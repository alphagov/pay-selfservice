if(process.env.ENABLE_NEWRELIC == 'yes') require('newrelic');
var express           = require('express');
var path              = require('path');
var favicon           = require('serve-favicon');
var router            = require(__dirname + '/app/routes.js');
var bodyParser        = require('body-parser');
var noCache           = require(__dirname + '/app/utils/no_cache.js');
var customCertificate = require(__dirname + '/app/utils/custom_certificate.js');
var proxy             = require(__dirname + '/app/utils/proxy.js');
var logger            = require('winston');

var port        = (process.env.PORT || 3000);
var app         = express();

app.enable('trust proxy');

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
    console.log('REDIRECTED ' + oldUrl + ' to ' + req.url);
  }
  
  next();
});

app.use(function (req, res, next) {
  res.locals.assetPath  = '/public/';
  res.locals.routes     = router.paths;
  noCache(res);
  next();
});

if (process.env.NODE_ENV !== 'production') {
  // Will return stack traces to the browser as well - only use in development!
  var errorhandler = require('errorhandler');
  app.use(errorhandler())
}

router.bind(app);

app.listen(port);

console.log('Listening on port ' + port);
console.log('');

module.exports.getApp = app;
