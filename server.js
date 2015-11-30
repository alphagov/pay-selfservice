if(process.env.ENABLE_NEWRELIC == 'yes') require('newrelic');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var routes = require(__dirname + '/app/routes.js');
var bodyParser = require('body-parser');
var clientSessions = require("client-sessions");

var port = (process.env.PORT || 3000);
var app = express();

app.use(clientSessions({
  cookieName: 'session_state',
  secret: process.env.SESSION_ENCRYPTION_KEY
}));

app.engine('html', require(__dirname + '/lib/template-engine.js').__express);
app.set('view engine', 'html');
app.set('vendorViews', __dirname + '/app/views');
app.set('views', __dirname + '/app/views');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/selfservice/public', express.static(__dirname + '/public'));
app.use('/public', express.static(__dirname + '/govuk_modules/govuk_frontend_toolkit'));
app.use(favicon(path.join(__dirname, 'public', 'images','favicon.ico')));
app.use(function (req, res, next) {
  res.locals.assetPath = '/public/';
  next();
});

if (process.env.NODE_ENV !== 'production') {
  // Will return stack traces to the browser as well - only use in development!
  var errorhandler = require('errorhandler');
  app.use(errorhandler())
}

routes.bind(app);

app.listen(port);
console.log('Listening on port ' + port);
console.log('');

module.exports.getApp = app;
