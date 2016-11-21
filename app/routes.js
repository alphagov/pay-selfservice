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

var _ = require('lodash');
var passport  = require('passport');


module.exports.generateRoute = generateRoute;
module.exports.paths = paths;

module.exports.bind = function (app) {

  app.get('/style-guide', function (req, res) {
    response(req.headers.accept, res, 'style_guide');
  });

  //  TRANSACTIONS

  var tr = paths.transactions;
  app.get(tr.index, auth.enforceUserBothFactors, csrf, permission(), transactions.index);
  app.get(tr.download, auth.enforceUserBothFactors, csrf, permission(), transactions.download);
  app.get(tr.show, auth.enforceUserBothFactors, csrf, permission(), transactions.show);
  app.post(tr.refund, auth.enforceUserBothFactors, csrf, permission(), transactions.refund);

  // CREDENTIALS

  var cred = paths.credentials;
  app.get(cred.index, auth.enforceUserBothFactors, csrf, permission('gateway-credentials:read'), credentials.index);
  app.get(cred.edit, auth.enforceUserBothFactors, csrf, permission('gateway-credentials:update'), credentials.editCredentials);
  app.post(cred.index, auth.enforceUserBothFactors, csrf, permission('gateway-credentials:update'), credentials.update);

  var notCred = paths.notificationCredentials;
  app.get(notCred.index, auth.enforceUserBothFactors, csrf, permission('gateway-credentials:read'), credentials.index);
  app.get(notCred.edit, auth.enforceUserBothFactors, csrf, permission('gateway-credentials:update'), credentials.editNotificationCredentials);
  app.post(notCred.update, auth.enforceUserBothFactors, csrf, permission('gateway-credentials:update'), credentials.updateNotificationCredentials);

  // LOGIN
  var user = paths.user;
  app.get(user.logIn, auth.ensureSessionHasCsrfSecret, csrf, login.logInGet);
  app.post(user.logIn, csrf, trimUsername, loginCounter.enforce, login.logUserin(), login.postLogin);
  app.get(user.loggedIn, auth.enforceUserBothFactors, csrf, login.loggedIn);
  app.get(user.noAccess, login.noAccess);
  app.get(user.logOut, login.logOut);
  app.get(user.otpSendAgain, auth.enforceUserFirstFactor, csrf, login.sendAgainGet);
  app.post(user.otpSendAgain, auth.enforceUserFirstFactor, csrf, login.sendAgainPost);
  app.get(user.otpLogIn, auth.enforceUserFirstFactor, csrf,  login.otpLogIn);
  app.post(user.otpLogIn, csrf, loginCounter.enforce, login.logUserinOTP(), login.afterOTPLogin);


  app.get(user.forgottenPassword, auth.ensureSessionHasCsrfSecret, csrf, forgotPassword.emailGet);
  app.post(user.forgottenPassword,  trimUsername, csrf, forgotPassword.emailPost);
  app.get(user.passwordRequested, forgotPassword.passwordRequested);
  app.get(user.forgottenPasswordReset, auth.ensureSessionHasCsrfSecret, csrf, forgotPassword.newPasswordGet);
  app.post(user.forgottenPasswordReset, csrf, forgotPassword.newPasswordPost);

  // DEV TOKENS
  var dt = paths.devTokens;
  app.get(dt.index, auth.enforceUserBothFactors, csrf, permission('tokens-active:read'), devTokens.index);
  app.get(dt.revoked, auth.enforceUserBothFactors, csrf, permission('tokens-revoked:read'), devTokens.revoked);
  app.get(dt.show, auth.enforceUserBothFactors, csrf, permission('tokens:create'), devTokens.show);
  app.post(dt.create, auth.enforceUserBothFactors, csrf, permission('tokens:create'), devTokens.create);
  app.put(dt.update, auth.enforceUserBothFactors, csrf, permission('tokens:update'), devTokens.update);
  app.delete(dt.delete, auth.enforceUserBothFactors, csrf, permission('tokens:delete'), devTokens.destroy);

  // SERVICE NAME

  var sn = paths.serviceName;
  app.get(sn.index, auth.enforceUserBothFactors, csrf, permission('service-name:read'), serviceName.index);
  app.post(sn.index, auth.enforceUserBothFactors, csrf, permission('service-name:update'), serviceName.update);

  // PAYMENT TYPES

  var pt = paths.paymentTypes;
  app.get(pt.selectType, auth.enforceUserBothFactors, csrf, permission('payment-types:read'), paymentTypesSelectType.selectType);
  app.post(pt.selectType, auth.enforceUserBothFactors, csrf, permission('payment-types:update'), paymentTypesSelectType.updateType);
  app.get(pt.selectBrand, auth.enforceUserBothFactors, csrf, permission('payment-types:read'), paymentTypesSelectBrand.showBrands);
  app.post(pt.selectBrand, auth.enforceUserBothFactors, csrf, permission('payment-types:update'), paymentTypesSelectBrand.updateBrands);
  app.get(pt.summary, auth.enforceUserBothFactors, csrf, permission('payment-types:read'), paymentTypesSummary.showSummary);

  // EMAIL
  var en = paths.emailNotifications;
  app.get(en.index, auth.enforceUserBothFactors, csrf, permission(), retrieveAccount, emailNotifications.index);
  app.get(en.edit, auth.enforceUserBothFactors, csrf, permission(), retrieveAccount, emailNotifications.edit);
  app.post(en.confirm, auth.enforceUserBothFactors, csrf, permission(), retrieveAccount, emailNotifications.confirm);
  app.post(en.update, auth.enforceUserBothFactors, csrf, permission(), retrieveAccount, emailNotifications.update);
  app.post(en.off, auth.enforceUserBothFactors, csrf, permission(), retrieveAccount, emailNotifications.off);
  app.get(en.offConfirm, auth.enforceUserBothFactors, csrf, permission(), retrieveAccount, emailNotifications.offConfirm);
  app.post(en.on, auth.enforceUserBothFactors, csrf, permission(), retrieveAccount, emailNotifications.on);




  // HEALTHCHECK
  var hc = paths.healthcheck;
  app.get(hc.path, healthcheck.healthcheck);

  // STATIC
  var st = paths.static;
  app.all(st.naxsiError, static.naxsiError);
};
