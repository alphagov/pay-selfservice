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
var serviceSwitchController = require('./controllers/service_switch_controller.js');
var serviceUsersController = require('./controllers/service_users_controller.js');
var inviteUserController = require('./controllers/invite_user_controller.js');
var permissionController = require('./controllers/service_roles_update_controller.js');
var toggle3ds = require('./controllers/toggle_3ds_controller.js');

var static = require('./controllers/static_controller.js');
var auth = require('./services/auth_service.js');
var querystring = require('querystring');
var paths = require(__dirname + '/paths.js');
var csrf = require('./middleware/csrf.js');
var retrieveAccount = require('./middleware/retrieve_account.js');
var getAccount = require('./middleware/get_gateway_account');
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
    response(req, res, 'style_guide');
  });

  app.all('*', (req,res,next) => {
    req.correlationId = req.headers[CORRELATION_HEADER] || '';
    next();
  });

  //  TRANSACTIONS
  var tr = paths.transactions;
  app.get(tr.index, auth.enforceUserAuthenticated, csrf, permission('transactions:read'), getAccount,transactions.index);
  app.get(tr.download, auth.enforceUserAuthenticated, csrf, permission('transactions-download:read'), getAccount,transactions.download);
  app.get(tr.show, auth.enforceUserAuthenticated, csrf, permission('transactions-details:read'), getAccount,transactions.show);
  app.post(tr.refund, auth.enforceUserAuthenticated, csrf, permission('refunds:create'), getAccount,transactions.refund);

  // CREDENTIALS
  var cred = paths.credentials;
  app.get(cred.index, auth.enforceUserAuthenticated, csrf, permission('gateway-credentials:read'), getAccount, credentials.index);
  app.get(cred.edit, auth.enforceUserAuthenticated, csrf, permission('gateway-credentials:update'), getAccount,credentials.editCredentials);
  app.post(cred.index, auth.enforceUserAuthenticated, csrf, permission('gateway-credentials:update'), getAccount,credentials.update);

  var notCred = paths.notificationCredentials;
  app.get(notCred.index, auth.enforceUserAuthenticated, csrf, permission('gateway-credentials:read'), getAccount,credentials.index);
  app.get(notCred.edit, auth.enforceUserAuthenticated, csrf, permission('gateway-credentials:update'), getAccount,credentials.editNotificationCredentials);
  app.post(notCred.update, auth.enforceUserAuthenticated, csrf, permission('gateway-credentials:update'), getAccount,credentials.updateNotificationCredentials);

  // LOGIN
  var user = paths.user;
  app.get(user.logIn, auth.ensureSessionHasCsrfSecret, csrf, login.logInGet);
  app.post(user.logIn, csrf, trimUsername, loginCounter.enforce, login.logUserin, getAccount, login.postLogin);
  app.get(user.loggedIn, auth.enforceUserAuthenticated, csrf, getAccount, login.loggedIn);
  app.get(user.noAccess, login.noAccess);
  app.get(user.logOut, login.logOut);
  app.get(user.otpSendAgain, auth.enforceUserFirstFactor, csrf, login.sendAgainGet);
  app.post(user.otpSendAgain, auth.enforceUserFirstFactor, csrf, login.sendAgainPost);
  app.get(user.otpLogIn, auth.enforceUserFirstFactor, csrf,  login.otpLogIn);
  app.post(user.otpLogIn, csrf, loginCounter.enforceOtp, login.logUserinOTP, login.afterOTPLogin);

  // FORGOTTEN PASSWORD
  app.get(user.forgottenPassword, auth.ensureSessionHasCsrfSecret, csrf, forgotPassword.emailGet);
  app.post(user.forgottenPassword,  trimUsername, csrf, forgotPassword.emailPost);
  app.get(user.passwordRequested, forgotPassword.passwordRequested);
  app.get(user.forgottenPasswordReset, auth.ensureSessionHasCsrfSecret, csrf, forgotPassword.newPasswordGet);
  app.post(user.forgottenPasswordReset, csrf, forgotPassword.newPasswordPost);

  // DEV TOKENS
  var dt = paths.devTokens;
  app.get(dt.index, auth.enforceUserAuthenticated, csrf, permission('tokens-active:read'), getAccount,devTokens.index);
  app.get(dt.revoked, auth.enforceUserAuthenticated, csrf, permission('tokens-revoked:read'), getAccount,devTokens.revoked);
  app.get(dt.show, auth.enforceUserAuthenticated, csrf, permission('tokens:create'), getAccount,devTokens.show);
  app.post(dt.create, auth.enforceUserAuthenticated, csrf, permission('tokens:create'), getAccount,devTokens.create);
  app.put(dt.update, auth.enforceUserAuthenticated, csrf, permission('tokens:update'), getAccount,devTokens.update);
  app.delete(dt.delete, auth.enforceUserAuthenticated, csrf, permission('tokens:delete'), getAccount,devTokens.destroy);

  // SERVICE NAME
  var sn = paths.serviceName;
  app.get(sn.index, auth.enforceUserAuthenticated, csrf, permission('service-name:read'), getAccount,serviceName.index);
  app.post(sn.index, auth.enforceUserAuthenticated, csrf, permission('service-name:update'), getAccount,serviceName.update);

  // PAYMENT TYPES
  var pt = paths.paymentTypes;
  app.get(pt.selectType, auth.enforceUserAuthenticated, csrf, permission('payment-types:read'), getAccount,paymentTypesSelectType.selectType);
  app.post(pt.selectType, auth.enforceUserAuthenticated, csrf, permission('payment-types:update'), getAccount,paymentTypesSelectType.updateType);
  app.get(pt.selectBrand, auth.enforceUserAuthenticated, csrf, permission('payment-types:read'), getAccount,paymentTypesSelectBrand.showBrands);
  app.post(pt.selectBrand, auth.enforceUserAuthenticated, csrf, permission('payment-types:update'), getAccount,paymentTypesSelectBrand.updateBrands);
  app.get(pt.summary, auth.enforceUserAuthenticated, csrf, permission('payment-types:read'), getAccount,paymentTypesSummary.showSummary);

  // EMAIL
  var en = paths.emailNotifications;
  app.get(en.index, auth.enforceUserAuthenticated, csrf, permission('email-notification-template:read'), retrieveAccount, emailNotifications.index);
  app.get(en.edit, auth.enforceUserAuthenticated, csrf, permission('email-notification-paragraph:update'), retrieveAccount, emailNotifications.edit);
  app.post(en.confirm, auth.enforceUserAuthenticated, csrf, permission('email-notification-paragraph:update'), retrieveAccount, emailNotifications.confirm);
  app.post(en.update, auth.enforceUserAuthenticated, csrf, permission('email-notification-paragraph:update'), retrieveAccount, emailNotifications.update);
  app.post(en.off, auth.enforceUserAuthenticated, csrf, permission('email-notification-toggle:update'), retrieveAccount, emailNotifications.off);
  app.get(en.offConfirm, auth.enforceUserAuthenticated, csrf, permission('email-notification-toggle:update'), retrieveAccount, emailNotifications.offConfirm);
  app.post(en.on, auth.enforceUserAuthenticated, csrf, permission('email-notification-toggle:update'), retrieveAccount, emailNotifications.on);

  // SERVICE SWITCHER
  var serviceSwitcher = paths.serviceSwitcher;
  app.get(serviceSwitcher.index, auth.enforceUserAuthenticated, csrf, serviceSwitchController.index);
  app.post(serviceSwitcher.switch, auth.enforceUserAuthenticated, csrf, serviceSwitchController.switch);

  // TEAM MEMBERS - USER PROFILE
  var teamMembers = paths.teamMembers;
  app.get(teamMembers.index, auth.enforceUserAuthenticated, csrf, serviceUsersController.index);
  app.get(teamMembers.show, auth.enforceUserAuthenticated, csrf, permission('users-service:read'), serviceUsersController.show);
  app.get(teamMembers.permissions, auth.enforceUserAuthenticated, csrf, permission('users-service:create'), permissionController.index);
  app.post(teamMembers.permissions, auth.enforceUserAuthenticated, csrf, permission('users-service:create'), permissionController.update);
  app.get(user.profile, auth.enforceUserAuthenticated, csrf, serviceUsersController.profile);

  // TEAM MEMBERS - INVITE
  app.get(teamMembers.invite, auth.enforceUserAuthenticated, csrf, permission('users-service:create'), inviteUserController.index);
  app.post(teamMembers.invite, auth.enforceUserAuthenticated, csrf, permission('users-service:create'), inviteUserController.invite);

  // 3D SECURE TOGGLE
  var t3ds = paths.toggle3ds;
  app.get(t3ds.index, auth.enforceUserAuthenticated, csrf, permission('toggle-3ds:read'), getAccount, toggle3ds.index);
  app.post(t3ds.onConfirm, auth.enforceUserAuthenticated, csrf, permission('toggle-3ds:update'), getAccount, toggle3ds.onConfirm);
  app.post(t3ds.on, auth.enforceUserAuthenticated, csrf, permission('toggle-3ds:update'), getAccount, toggle3ds.on);
  app.post(t3ds.off, auth.enforceUserAuthenticated, csrf, permission('toggle-3ds:update'), getAccount, toggle3ds.off);

  // HEALTHCHECK
  var hc = paths.healthcheck;
  app.get(hc.path, healthcheck.healthcheck);

  // STATIC
  var st = paths.static;
  app.all(st.naxsiError, static.naxsiError);
};
