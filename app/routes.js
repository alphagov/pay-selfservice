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
var userController = require('./controllers/user_controller.js');
var gatewayController = require('./controllers/gateway_controller.js');


var static = require('./controllers/static_controller.js');
var auth = require('./services/auth_service.js');
var querystring = require('querystring');
var paths = require(__dirname + '/paths.js');
var csrf = require('./middleware/csrf.js');
var retrieveAccount = require('./middleware/retrieve_account.js');
var trimUsername = require('./middleware/trim_username.js');
var loginCounter = require('./middleware/login_counter.js');

var _ = require('lodash');
var passport  = require('passport');


module.exports.generateRoute = generateRoute;
module.exports.paths = paths;

module.exports.bind = function (app) {
  var user = paths.user;

  // FEATURE FLAGGING

  // USER CREATION
  if (process.env.FF_USER_CREATION === 'true') {
    app.get(user.intro, userController.intro);
    app.get(user.new, userController.new);
    app.post(user.create, userController.create);
    app.get(user.index, userController.index);
    app.get(user.show, userController.show);
    app.post(user.disable, userController.disable);
    app.post(user.enable, userController.enable);
    app.post(user.reset, userController.sendPasswordReset);
  }


  // END OF FEATURE FLAGGING

  app.get('/style-guide', function (req, res) {
    response(req.headers.accept, res, 'style_guide');
  });

  //  TRANSACTIONS

  var tr = paths.transactions;
  app.get(tr.index, auth.enforceUserBothFactors, csrf, transactions.index);
  app.get(tr.download, auth.enforceUserBothFactors, csrf, transactions.download);
  app.get(tr.show, auth.enforceUserBothFactors, csrf, transactions.show);
  app.post(tr.refund, auth.enforceUserBothFactors, csrf, transactions.refund);

  // CREDENTIALS

  var cred = paths.credentials;
  app.get(cred.index, auth.enforceUserBothFactors, csrf, credentials.index);
  app.get(cred.edit, auth.enforceUserBothFactors, csrf, credentials.editCredentials);
  app.post(cred.index, auth.enforceUserBothFactors, csrf, credentials.update);

  var notCred = paths.notificationCredentials;
  app.get(notCred.index, auth.enforceUserBothFactors, csrf, credentials.index);
  app.get(notCred.edit, auth.enforceUserBothFactors, csrf, credentials.editNotificationCredentials);
  app.post(notCred.update, auth.enforceUserBothFactors, csrf, credentials.updateNotificationCredentials);

  // LOGIN
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
  app.get(dt.index, auth.enforceUserBothFactors, csrf, devTokens.index);
  app.get(dt.revoked, auth.enforceUserBothFactors, csrf, devTokens.revoked);
  app.get(dt.show, auth.enforceUserBothFactors, csrf, devTokens.show);
  app.post(dt.create, auth.enforceUserBothFactors, csrf, devTokens.create);
  app.put(dt.update, auth.enforceUserBothFactors, csrf, devTokens.update);
  app.delete(dt.delete, auth.enforceUserBothFactors, csrf, devTokens.destroy);

  // SERVICE NAME

  var sn = paths.serviceName;
  app.get(sn.index, auth.enforceUserBothFactors, csrf, serviceName.index);
  app.post(sn.index, auth.enforceUserBothFactors, csrf, serviceName.update);

  // PAYMENT TYPES

  var pt = paths.paymentTypes;
  app.get(pt.selectType, auth.enforceUserBothFactors, csrf, paymentTypesSelectType.selectType);
  app.post(pt.selectType, auth.enforceUserBothFactors, csrf, paymentTypesSelectType.updateType);
  app.get(pt.selectBrand, auth.enforceUserBothFactors, csrf, paymentTypesSelectBrand.showBrands);
  app.post(pt.selectBrand, auth.enforceUserBothFactors, csrf, paymentTypesSelectBrand.updateBrands);
  app.get(pt.summary, auth.enforceUserBothFactors, csrf, paymentTypesSummary.showSummary);

  // EMAIL
  var en = paths.emailNotifications;
  app.get(en.index, auth.enforceUserBothFactors, csrf,retrieveAccount, emailNotifications.index);
  app.get(en.edit, auth.enforceUserBothFactors, csrf, retrieveAccount, emailNotifications.edit);
  app.post(en.confirm, auth.enforceUserBothFactors, csrf,retrieveAccount, emailNotifications.confirm);
  app.post(en.update, auth.enforceUserBothFactors, csrf, retrieveAccount, emailNotifications.update);
  app.post(en.off, auth.enforceUserBothFactors, csrf, retrieveAccount, emailNotifications.off);
  app.get(en.offConfirm, auth.enforceUserBothFactors, csrf, retrieveAccount, emailNotifications.offConfirm);
  app.post(en.on, auth.enforceUserBothFactors, csrf, retrieveAccount, emailNotifications.on);


  // GATEWAY
  var gateway = paths.gateway;
  app.get(gateway.index, auth.enforceUserBothFactors, csrf, gatewayController.index);

  // HEALTHCHECK
  var hc = paths.healthcheck;
  app.get(hc.path, healthcheck.healthcheck);

  // STATIC
  var st = paths.static;
  app.all(st.naxsiError, static.naxsiError);
};
