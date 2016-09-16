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
var _ = require('lodash');
var paths = require(__dirname + '/paths.js');
var csrf = require('./middleware/csrf.js');
var retrieveAccount = require('./middleware/retrieve_account.js');
var trimEmail = require('./middleware/trim_email.js');
var passport  = require('passport');


module.exports.generateRoute = generateRoute;
module.exports.paths = paths;

module.exports.bind = function (app) {

  app.get('/style-guide', function (req, res) {
    response(req.headers.accept, res, 'style_guide');
  });

  //  TRANSACTIONS

  var tr = paths.transactions;
  app.get(tr.index, auth.enforce, csrf, transactions.index);
  app.get(tr.download, auth.enforce, csrf, transactions.download);
  app.get(tr.show, auth.enforce, csrf, transactions.show);
  app.post(tr.refund, auth.enforce, csrf, transactions.refund);

  // CREDENTIALS

  var cred = paths.credentials;
  app.get(cred.index, auth.enforce, csrf, credentials.index);
  app.get(cred.edit, auth.enforce, csrf, credentials.editCredentials);
  app.post(cred.index, auth.enforce, csrf, credentials.update);

  var notCred = paths.notificationCredentials;
  app.get(notCred.index, auth.enforce, csrf, credentials.index);
  app.get(notCred.edit, auth.enforce, csrf, credentials.editNotificationCredentials);
  app.post(notCred.update, auth.enforce, csrf, credentials.updateNotificationCredentials);

  // LOGIN
  var user = paths.user;
  app.get(user.logIn, auth.appendLoggedOutCSRF, csrf, login.logInGet);
  app.post(user.logIn, csrf, trimEmail, login.logUserin(), login.postLogin);
  app.get(user.loggedIn, auth.enforce, csrf, login.loggedIn);
  app.get(user.noAccess, auth.enforce, login.noAccess);
  app.get(user.logOut, login.logOut);
  app.get(user.otpSendAgain, auth.enforceUser, csrf, login.sendAgainGet);
  app.post(user.otpSendAgain, auth.enforceUser, csrf, login.sendAgainPost);
  app.get(user.otpLogIn, csrf, auth.enforceUser,  login.otpLogIn);
  app.post(user.otpLogIn, login.logUserinOTP(), csrf, login.afterOTPLogin);


  app.get(user.forgottenPassword, auth.appendLoggedOutCSRF, csrf, forgotPassword.emailGet);
  app.post(user.forgottenPassword,  trimEmail, csrf, forgotPassword.emailPost);
  app.get(user.passwordRequested, forgotPassword.passwordRequested);
  app.get(user.forgottenPasswordReset, auth.appendLoggedOutCSRF, csrf, forgotPassword.newPasswordGet);
  app.post(user.forgottenPasswordReset, csrf, forgotPassword.newPasswordPost);




  // DEV TOKENS

  var dt = paths.devTokens;
  app.get(dt.index, auth.enforce, csrf, devTokens.index);
  app.get(dt.revoked, auth.enforce, csrf, devTokens.revoked);
  app.get(dt.show, auth.enforce, csrf, devTokens.show);
  app.post(dt.create, auth.enforce, csrf, devTokens.create);
  app.put(dt.update, auth.enforce, csrf, devTokens.update);
  app.delete(dt.delete, auth.enforce, csrf, devTokens.destroy);

  // SERVICE NAME

  var sn = paths.serviceName;
  app.get(sn.index, auth.enforce, csrf, serviceName.index);
  app.post(sn.index, auth.enforce, csrf, serviceName.update);

  // PAYMENT TYPES

  var pt = paths.paymentTypes;
  app.get(pt.selectType, auth.enforce, csrf, paymentTypesSelectType.selectType);
  app.post(pt.selectType, auth.enforce, csrf, paymentTypesSelectType.updateType);
  app.get(pt.selectBrand, auth.enforce, csrf, paymentTypesSelectBrand.showBrands);
  app.post(pt.selectBrand, auth.enforce, csrf, paymentTypesSelectBrand.updateBrands);
  app.get(pt.summary, auth.enforce, csrf, paymentTypesSummary.showSummary);

  // EMAIL
  var en = paths.emailNotifications;
  app.get(en.index, auth.enforce, csrf,retrieveAccount, emailNotifications.index);
  app.get(en.edit, auth.enforce, csrf, retrieveAccount, emailNotifications.edit);
  app.post(en.confirm, auth.enforce, csrf,retrieveAccount, emailNotifications.confirm);
  app.post(en.update, auth.enforce, csrf, retrieveAccount, emailNotifications.update);
  app.post(en.off, auth.enforce, csrf, retrieveAccount, emailNotifications.off);
  app.get(en.offConfirm, auth.enforce, csrf, retrieveAccount, emailNotifications.offConfirm);
  app.post(en.on, auth.enforce, csrf, retrieveAccount, emailNotifications.on);




  // HEALTHCHECK
  var hc = paths.healthcheck;
  app.get(hc.path, healthcheck.healthcheck);

  // STATIC
  var st = paths.static;
  app.all(st.naxsiError, static.naxsiError);
};
