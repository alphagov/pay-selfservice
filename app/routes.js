var response      = require(__dirname + '/utils/response.js').response;
var generateRoute = require(__dirname + '/utils/generate_route.js');
var transactions  = require('./controllers/transaction_controller.js');
var credentials   = require('./controllers/credentials_controller.js');
var login         = require('./controllers/login_controller.js');
var devTokens     = require('./controllers/dev_tokens_controller.js');
var auth          = require('./services/auth_service.js');
var querystring   = require('querystring');
var _             = require('lodash');
var paths         = require(__dirname + '/paths.js');
var csrf          = require('./middleware/csrf.js');

module.exports.generateRoute = generateRoute;
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
  app.get(tr.index, csrf, auth.enforce, transactions.transactionsIndex);
  app.post(tr.index , auth.enforce, transactions.transactionsIndex);
  app.get(tr.download, csrf, auth.enforce, transactions.transactionsDownload);
  app.get(tr.show, csrf, auth.enforce, transactions.transactionsShow);

  // CREDENTIALS

  var cred = paths.credentials;
  app.get(cred.index, csrf, auth.enforce, credentials.index);
  app.post(cred.index, auth.enforce, credentials.update);

  // LOGIN

  var user = paths.user;
  app.get(user.logIn, csrf, auth.login, login.logIn);
  app.get(user.logOut, csrf, login.logOut);
  app.get(user.callback, csrf, auth.callback, login.callback);
  app.get(user.loggedIn, csrf, auth.enforce, login.loggedIn);
  app.get(user.noAccess, csrf, auth.enforce, login.noAccess);

  // DEV TOKENS

  var dt = paths.devTokens;
  app.get(dt.index, csrf, auth.enforce, devTokens.index);
  app.get(dt.show, csrf, auth.enforce, devTokens.show);
  app.post(dt.create, auth.enforce, devTokens.create);
  app.put(dt.update, auth.enforce, devTokens.update);
  app.delete(dt.delete, auth.enforce, devTokens.destroy);
};
