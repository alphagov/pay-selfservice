var response = require(__dirname + '/utils/response.js').response;
var generateRoute = require(__dirname + '/utils/generate_route.js');
var transactions = require('./controllers/transaction_controller.js');
var credentials = require('./controllers/credentials_controller.js');
var login = require('./controllers/login_controller.js');
var healthcheck = require('./controllers/healthcheck_controller.js');
var devTokens = require('./controllers/dev_tokens_controller.js');
var serviceName = require('./controllers/service_name_controller.js');
var paymentTypesSelectType = require('./controllers/payment_types_select_type_controller.js');
var paymentTypesSelectBrand = require('./controllers/payment_types_select_brand_controller.js');
var paymentTypesSummary = require('./controllers/payment_types_summary_controller.js');
var emailNotifications = require('./controllers/email_notifications_controller.js');
var forgotPassword = require('./controllers/forgotten_password_controller.js');

var static = require('./controllers/static_controller.js');
var auth = require('./services/auth_service.js');
var querystring = require('querystring');
var paths = require(__dirname + '/paths.js');
var csrf = require('./middleware/csrf.js');
var retrieveAccount = require('./middleware/retrieve_account.js');
var trimUsername = require('./middleware/trim_username.js');
var loginCounter = require('./middleware/login_counter.js');
var permission = require('./middleware/permission.js');

var CORRELATION_HEADER    = require('./utils/correlation_header.js').CORRELATION_HEADER;


var _ = require('lodash');
var passport  = require('passport');


module.exports.generateRoute = generateRoute;
module.exports.paths = paths;

module.exports.bind = function (app) {

  app.get('/style-guide', function (req, res) {
    response(req.headers.accept, res, 'style_guide');
  });

  app.all('*', (req,res,next) => {
    req.correlationId = req.headers[CORRELATION_HEADER] || '';
    next();
  });

  //  TRANSACTIONS
  var tr = paths.transactions;
  app.get(tr.index, auth.enforceUserAuthenticated, csrf, permission('transactions:read'), transactions.index);
  app.get(tr.download, auth.enforceUserAuthenticated, csrf, permission('transactions-download:read'), transactions.download);
  app.get(tr.show, auth.enforceUserAuthenticated, csrf, permission('transactions-details:read'), transactions.show);
  app.post(tr.refund, auth.enforceUserAuthenticated, csrf, permission('refunds:create'), transactions.refund);

  // CREDENTIALS
  var cred = paths.credentials;
  app.get(cred.index, auth.enforceUserAuthenticated, csrf, permission('gateway-credentials:read'), credentials.index);
  app.get(cred.edit, auth.enforceUserAuthenticated, csrf, permission('gateway-credentials:update'), credentials.editCredentials);
  app.post(cred.index, auth.enforceUserAuthenticated, csrf, permission('gateway-credentials:update'), credentials.update);

  var notCred = paths.notificationCredentials;
  app.get(notCred.index, auth.enforceUserAuthenticated, csrf, permission('gateway-credentials:read'), credentials.index);
  app.get(notCred.edit, auth.enforceUserAuthenticated, csrf, permission('gateway-credentials:update'), credentials.editNotificationCredentials);
  app.post(notCred.update, auth.enforceUserAuthenticated, csrf, permission('gateway-credentials:update'), credentials.updateNotificationCredentials);

  // LOGIN
  var user = paths.user;
  app.get(user.logIn, auth.ensureSessionHasCsrfSecret, csrf, login.logInGet);
  app.post(user.logIn, csrf, trimUsername, loginCounter.enforce, login.logUserin(), login.postLogin);
  app.get(user.loggedIn, auth.enforceUserAuthenticated, csrf, login.loggedIn);
  app.get(user.noAccess, login.noAccess);
  app.get(user.logOut, login.logOut);
  app.get(user.otpSendAgain, auth.enforceUserFirstFactor, csrf, login.sendAgainGet);
  app.post(user.otpSendAgain, auth.enforceUserFirstFactor, csrf, login.sendAgainPost);
  app.get(user.otpLogIn, auth.enforceUserFirstFactor, csrf,  login.otpLogIn);
  app.post(user.otpLogIn, csrf, loginCounter.enforce, login.logUserinOTP, login.afterOTPLogin);

  // FORGOTTEN PASSWORD
  app.get(user.forgottenPassword, auth.ensureSessionHasCsrfSecret, csrf, forgotPassword.emailGet);
  app.post(user.forgottenPassword,  trimUsername, csrf, forgotPassword.emailPost);
  app.get(user.passwordRequested, forgotPassword.passwordRequested);
  app.get(user.forgottenPasswordReset, auth.ensureSessionHasCsrfSecret, csrf, forgotPassword.newPasswordGet);
  app.post(user.forgottenPasswordReset, csrf, forgotPassword.newPasswordPost);

  // DEV TOKENS
  var dt = paths.devTokens;
  app.get(dt.index, auth.enforceUserAuthenticated, csrf, permission('tokens-active:read'), devTokens.index);
  app.get(dt.revoked, auth.enforceUserAuthenticated, csrf, permission('tokens-revoked:read'), devTokens.revoked);
  app.get(dt.show, auth.enforceUserAuthenticated, csrf, permission('tokens:create'), devTokens.show);
  app.post(dt.create, auth.enforceUserAuthenticated, csrf, permission('tokens:create'), devTokens.create);
  app.put(dt.update, auth.enforceUserAuthenticated, csrf, permission('tokens:update'), devTokens.update);
  app.delete(dt.delete, auth.enforceUserAuthenticated, csrf, permission('tokens:delete'), devTokens.destroy);

  // SERVICE NAME
  var sn = paths.serviceName;
  app.get(sn.index, auth.enforceUserAuthenticated, csrf, permission('service-name:read'), serviceName.index);
  app.post(sn.index, auth.enforceUserAuthenticated, csrf, permission('service-name:update'), serviceName.update);

  // PAYMENT TYPES
  var pt = paths.paymentTypes;
  app.get(pt.selectType, auth.enforceUserAuthenticated, csrf, permission('payment-types:read'), paymentTypesSelectType.selectType);
  app.post(pt.selectType, auth.enforceUserAuthenticated, csrf, permission('payment-types:update'), paymentTypesSelectType.updateType);
  app.get(pt.selectBrand, auth.enforceUserAuthenticated, csrf, permission('payment-types:read'), paymentTypesSelectBrand.showBrands);
  app.post(pt.selectBrand, auth.enforceUserAuthenticated, csrf, permission('payment-types:update'), paymentTypesSelectBrand.updateBrands);
  app.get(pt.summary, auth.enforceUserAuthenticated, csrf, permission('payment-types:read'), paymentTypesSummary.showSummary);

  // EMAIL
  var en = paths.emailNotifications;
  app.get(en.index, auth.enforceUserAuthenticated, csrf, permission('email-notification-template:read'), retrieveAccount, emailNotifications.index);
  app.get(en.edit, auth.enforceUserAuthenticated, csrf, permission('email-notification-paragraph:update'), retrieveAccount, emailNotifications.edit);
  app.post(en.confirm, auth.enforceUserAuthenticated, csrf, permission('email-notification-paragraph:update'), retrieveAccount, emailNotifications.confirm);
  app.post(en.update, auth.enforceUserAuthenticated, csrf, permission('email-notification-paragraph:update'), retrieveAccount, emailNotifications.update);
  app.post(en.off, auth.enforceUserAuthenticated, csrf, permission('email-notification-toggle:update'), retrieveAccount, emailNotifications.off);
  app.get(en.offConfirm, auth.enforceUserAuthenticated, csrf, permission('email-notification-toggle:update'), retrieveAccount, emailNotifications.offConfirm);
  app.post(en.on, auth.enforceUserAuthenticated, csrf, permission('email-notification-toggle:update'), retrieveAccount, emailNotifications.on);

  // HEALTHCHECK
  var hc = paths.healthcheck;
  app.get(hc.path, healthcheck.healthcheck);

  // STATIC
  var st = paths.static;
  app.all(st.naxsiError, static.naxsiError);
};
