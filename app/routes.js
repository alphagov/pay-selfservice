var response      = require(__dirname + '/utils/response.js').response;
var generateRoute = require(__dirname + '/utils/generate_route.js');
var transactions  = require('./controllers/transaction_controller.js');
var credentials   = require('./controllers/credentials_controller.js');
var login         = require('./controllers/login_controller.js');
var devTokens     = require('./controllers/dev_tokens_controller.js');
var auth          = require('./services/auth_service.js');
var querystring   = require('querystring');
var _             = require('lodash');

module.exports.generateRoute = generateRoute;

var paths = {
    transactions: {
      index: '/transactions',
      download: '/transactions/download',
      show: '/transactions/:chargeId'
    },
    credentials: {
      index: '/credentials',
      edit: '/credentials?edit', // TODO LOLWUT?
      create: '/credentials'
    },
    user: {
      logIn: '/login',
      logOut: '/logout',
      callback: '/callback',
      loggedIn: '/',
      noAccess: '/noaccess'
    },
    devTokens: {
      index: '/tokens',
      // we only show the token once, hence strange url
      show: '/tokens/generate',
      create: '/tokens/generate',
      // should these two not rely take an id in the url?
      update: '/tokens',
      delete: '/tokens'
    }
};

module.exports.paths = paths;

module.exports.bind = function (app) {

  auth.bind(app);

  app.get('/greeting', function (req, res) {
    var data = {'greeting': 'Hello', 'name': 'World'};
    response(req.headers.accept, res, 'greeting', data);
  });

  app.get('/style-guide', function (req, res) {
    response(req.headers.accept, res, 'style_guide');
  });

  //  TRANSACTIONS

  var tr = paths.transactions;
  app.get(tr.index, auth.enforce, transactions.transactionsIndex);
  app.post(tr.index, auth.enforce, transactions.transactionsIndex);
  app.get(tr.download, auth.enforce, transactions.transactionsDownload);
  app.get(tr.show, auth.enforce, transactions.transactionsShow);

  // CREDENTIALS

  var cred = paths.credentials;
  app.get(cred.index, auth.enforce, credentials.index);
  app.post(cred.index, auth.enforce, credentials.update);

  // LOGIN

  var user = paths.user;
  app.get(user.logIn, auth.login, login.logIn);
  app.get(user.logOut, login.logOut);
  app.get(user.callback, auth.callback, login.callback);
  app.get(user.loggedIn,  auth.enforce, login.loggedIn);
  app.get(user.noAccess, auth.enforce, login.noAccess);

  // DEV TOKENS

  var dt = paths.devTokens;
  app.get(dt.index, auth.enforce, devTokens.index);
  app.get(dt.show, auth.enforce, devTokens.show);
  app.post(dt.create, auth.enforce, devTokens.create);
  app.put(dt.update, auth.enforce, devTokens.update);
  app.delete(dt.delete, auth.enforce, devTokens.destroy);
};
