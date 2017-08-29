'use strict'

// NPM Dependencies
const lodash = require('lodash')

// Local Dependencies
const response = require('./utils/response.js').response
const generateRoute = require('./utils/generate_route')
const paths = require('./paths.js')
const CORRELATION_HEADER = require('./utils/correlation_header').CORRELATION_HEADER

// - Middleware
const {lockOutDisabledUsers, enforceUserAuthenticated, enforceUserFirstFactor, redirectLoggedInUser} = require('./services/auth_service')
const {validateAndRefreshCsrf, ensureSessionHasCsrfSecret} = require('./middleware/csrf')
const getEmailNotification = require('./middleware/get_email_notification')
const getAccount = require('./middleware/get_gateway_account')
const hasServices = require('./middleware/has_services')
const resolveService = require('./middleware/resolve_service')
const trimUsername = require('./middleware/trim_username')
const permission = require('./middleware/permission')
const validateRegistrationInviteCookie = require('./middleware/validate_registration_invite_cookie')
const otpVerify = require('./middleware/otp_verify')
const getRequestContext = require('./middleware/get_request_context').middleware

// - Controllers
const staticCtrl = require('./controllers/static_controller')
const transactionsCtrl = require('./controllers/transaction_controller')
const credentialsCtrl = require('./controllers/credentials_controller')
const loginCtrl = require('./controllers/login_controller')
const healthcheckCtrl = require('./controllers/healthcheck_controller')
const devTokensCtrl = require('./controllers/dev_tokens_controller')
const paymentTypesSelectType = require('./controllers/payment_types_select_type_controller')
const paymentTypesSelectBrand = require('./controllers/payment_types_select_brand_controller')
const paymentTypesSummary = require('./controllers/payment_types_summary_controller')
const emailNotifications = require('./controllers/email_notifications_controller')
const forgotPassword = require('./controllers/forgotten_password_controller')
const myServicesCtrl = require('./controllers/my_services_controller')
const editServiceNameCtrl = require('./controllers/edit_service_name_controller')
const serviceUsersController = require('./controllers/service_users_controller')
const inviteUserController = require('./controllers/invite_user_controller')
const registerCtrl = require('./controllers/register_user_controller')
const serviceRolesUpdateController = require('./controllers/service_roles_update_controller')
const toggle3ds = require('./controllers/toggle_3ds_controller')
const selfCreateServiceCtrl = require('./controllers/register_service_controller')
const createServiceCtrl = require('./controllers/create_service_controller')
const inviteValidationCtrl = require('./controllers/invite_validation_controller')

// Assignments
const {
  healthcheck, registerUser, user, selfCreateService, transactions, credentials,
  devTokens, serviceSwitcher, teamMembers, staticPaths, inviteValidation, editServiceName,
  notificationCredentials: nc, paymentTypes: pt, emailNotifications: en, toggle3ds: t3ds} = paths

// Exports
module.exports.generateRoute = generateRoute
module.exports.paths = paths

module.exports.bind = function (app) {
  app.get('/style-guide', (req, res) => response(req, res, 'style_guide'))

  // APPLY CORRELATION MIDDLEWARE
  app.use('*', (req, res, next) => {
    req.correlationId = req.headers[CORRELATION_HEADER] || ''
    next()
  }, getRequestContext)

  app.all(lockOutDisabledUsers) // On all requests, if there is a user, and its disabled, lock out.

  // ----------------------
  // UNAUTHENTICATED ROUTES
  // ----------------------

  // HEALTHCHECK
  app.get(healthcheck.path, healthcheckCtrl.healthcheck)

  // STATIC
  app.all(staticPaths.naxsiError, staticCtrl.naxsiError)

  // VALIDATE INVITE
  app.get(inviteValidation.validateInvite, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, inviteValidationCtrl.validateInvite)

  // REGISTER USER
  app.get(registerUser.registration, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, registerCtrl.showRegistration)
  app.get(registerUser.subscribeService, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, registerCtrl.subscribeService)
  app.post(registerUser.registration, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, registerCtrl.submitRegistration)
  app.get(registerUser.otpVerify, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, registerCtrl.showOtpVerify)
  app.post(registerUser.otpVerify, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, registerCtrl.submitOtpVerify)
  app.get(registerUser.reVerifyPhone, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, registerCtrl.showReVerifyPhone)
  app.post(registerUser.reVerifyPhone, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, registerCtrl.submitReVerifyPhone)
  app.get(registerUser.logUserIn, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, loginCtrl.loginAfterRegister, enforceUserAuthenticated, hasServices, resolveService, getAccount, loginCtrl.loggedIn)

  // LOGIN
  app.get(user.logIn, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, redirectLoggedInUser, loginCtrl.logInGet)
  app.post(user.logIn, validateAndRefreshCsrf, trimUsername, loginCtrl.logUserin, getAccount, loginCtrl.postLogin)
  app.get(user.loggedIn, enforceUserAuthenticated, validateAndRefreshCsrf, hasServices, resolveService, getAccount, loginCtrl.loggedIn)
  app.get(user.noAccess, loginCtrl.noAccess)
  app.get(user.logOut, loginCtrl.logOut)
  app.get(user.otpSendAgain, enforceUserFirstFactor, validateAndRefreshCsrf, loginCtrl.sendAgainGet)
  app.post(user.otpSendAgain, enforceUserFirstFactor, validateAndRefreshCsrf, loginCtrl.sendAgainPost)
  app.get(user.otpLogIn, enforceUserFirstFactor, validateAndRefreshCsrf, loginCtrl.otpLogIn)
  app.post(user.otpLogIn, validateAndRefreshCsrf, loginCtrl.logUserinOTP, loginCtrl.afterOTPLogin)

  // FORGOTTEN PASSWORD
  app.get(user.forgottenPassword, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, forgotPassword.emailGet)
  app.post(user.forgottenPassword, trimUsername, validateAndRefreshCsrf, forgotPassword.emailPost)
  app.get(user.passwordRequested, forgotPassword.passwordRequested)
  app.get(user.forgottenPasswordReset, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, forgotPassword.newPasswordGet)
  app.post(user.forgottenPasswordReset, validateAndRefreshCsrf, forgotPassword.newPasswordPost)

  // SELF CREATE SERVICE
  app.get(selfCreateService.register, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, selfCreateServiceCtrl.showRegistration)
  app.post(selfCreateService.register, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, selfCreateServiceCtrl.submitRegistration)
  app.get(selfCreateService.confirm, selfCreateServiceCtrl.showConfirmation)
  app.get(selfCreateService.otpVerify, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, validateRegistrationInviteCookie, selfCreateServiceCtrl.showOtpVerify)
  app.post(selfCreateService.otpVerify, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, validateRegistrationInviteCookie, otpVerify.verifyOtpForServiceInvite, selfCreateServiceCtrl.createPopulatedService)
  app.get(selfCreateService.otpResend, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, validateRegistrationInviteCookie, selfCreateServiceCtrl.showOtpResend)
  app.post(selfCreateService.otpResend, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, validateRegistrationInviteCookie, selfCreateServiceCtrl.submitOtpResend)
  app.get(selfCreateService.logUserIn, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, loginCtrl.loginAfterRegister, enforceUserAuthenticated, getAccount, selfCreateServiceCtrl.loggedIn)
  app.get(selfCreateService.serviceNaming, enforceUserAuthenticated, validateAndRefreshCsrf, hasServices, getAccount, selfCreateServiceCtrl.showNameYourService)
  app.post(selfCreateService.serviceNaming, enforceUserAuthenticated, validateAndRefreshCsrf, hasServices, getAccount, selfCreateServiceCtrl.submitYourServiceName)

  // ----------------------
  // AUTHENTICATED ROUTES
  // ----------------------

  const authenticatedPaths = [
    ...lodash.values(transactions),
    ...lodash.values(credentials),
    ...lodash.values(nc),
    ...lodash.values(devTokens),
    ...lodash.values(pt),
    ...lodash.values(en),
    ...lodash.values(editServiceName),
    ...lodash.values(serviceSwitcher),
    ...lodash.values(teamMembers),
    ...lodash.values(t3ds)
  ] // Extract all the authenticated paths as a single array

  app.use(authenticatedPaths, enforceUserAuthenticated, validateAndRefreshCsrf) // Enforce authentication on all get requests
  app.use(authenticatedPaths.filter(item => !lodash.values(serviceSwitcher).includes(item)), hasServices) // Require services everywhere but the switcher page

  //  TRANSACTIONS
  app.get(transactions.index, permission('transactions:read'), getAccount, transactionsCtrl.index)
  app.get(transactions.download, permission('transactions-download:read'), getAccount, transactionsCtrl.download)
  app.get(transactions.show, permission('transactions-details:read'), getAccount, transactionsCtrl.show)
  app.post(transactions.refund, permission('refunds:create'), getAccount, transactionsCtrl.refund)

  // CREDENTIALS
  app.get(credentials.index, permission('gateway-credentials:read'), getAccount, credentialsCtrl.index)
  app.get(credentials.edit, permission('gateway-credentials:update'), getAccount, credentialsCtrl.editCredentials)
  app.post(credentials.index, permission('gateway-credentials:update'), getAccount, credentialsCtrl.update)

  app.get(nc.index, permission('gateway-credentials:read'), getAccount, credentialsCtrl.index)
  app.get(nc.edit, permission('gateway-credentials:update'), getAccount, credentialsCtrl.editNotificationCredentials)
  app.post(nc.update, permission('gateway-credentials:update'), getAccount, credentialsCtrl.updateNotificationCredentials)

  // DEV TOKENS
  app.get(devTokens.index, permission('tokens-active:read'), getAccount, devTokensCtrl.index)
  app.get(devTokens.revoked, permission('tokens-revoked:read'), getAccount, devTokensCtrl.revoked)
  app.get(devTokens.show, permission('tokens:create'), getAccount, devTokensCtrl.show)
  app.post(devTokens.create, permission('tokens:create'), getAccount, devTokensCtrl.create)
  app.put(devTokens.update, permission('tokens:update'), getAccount, devTokensCtrl.update)
  app.delete(devTokens.delete, permission('tokens:delete'), getAccount, devTokensCtrl.destroy)

  // PAYMENT TYPES
  app.get(pt.selectType, permission('payment-types:read'), getAccount, paymentTypesSelectType.selectType)
  app.post(pt.selectType, permission('payment-types:update'), getAccount, paymentTypesSelectType.updateType)
  app.get(pt.selectBrand, permission('payment-types:read'), getAccount, paymentTypesSelectBrand.showBrands)
  app.post(pt.selectBrand, permission('payment-types:update'), getAccount, paymentTypesSelectBrand.updateBrands)
  app.get(pt.summary, permission('payment-types:read'), getAccount, paymentTypesSummary.showSummary)

  // EMAIL
  app.get(en.index, permission('email-notification-template:read'), getAccount, getEmailNotification, emailNotifications.index)
  app.get(en.edit, permission('email-notification-paragraph:update'), getAccount, getEmailNotification, emailNotifications.edit)
  app.post(en.confirm, permission('email-notification-paragraph:update'), getAccount, getEmailNotification, emailNotifications.confirm)
  app.post(en.update, permission('email-notification-paragraph:update'), getAccount, getEmailNotification, emailNotifications.update)
  app.post(en.off, permission('email-notification-toggle:update'), getAccount, getEmailNotification, emailNotifications.off)
  app.get(en.offConfirm, permission('email-notification-toggle:update'), getAccount, getEmailNotification, emailNotifications.offConfirm)
  app.post(en.on, permission('email-notification-toggle:update'), getAccount, getEmailNotification, emailNotifications.on)

  // MY SERVICES
  app.get(serviceSwitcher.index, myServicesCtrl.index)
  app.post(serviceSwitcher.switch, myServicesCtrl.switch)
  app.get(serviceSwitcher.create, createServiceCtrl.get)
  app.post(serviceSwitcher.create, createServiceCtrl.post)

  // EDIT SERVICE NAME
  app.get(editServiceName.index, permission('service-name:update'), editServiceNameCtrl.get)
  app.post(editServiceName.update, permission('service-name:update'), editServiceNameCtrl.post)

  // TEAM MEMBERS - USER PROFILE
  app.get(teamMembers.index, resolveService, serviceUsersController.index)
  app.get(teamMembers.show, permission('users-service:read'), serviceUsersController.show)
  app.get(teamMembers.permissions, permission('users-service:create'), serviceRolesUpdateController.index)
  app.post(teamMembers.permissions, permission('users-service:create'), serviceRolesUpdateController.update)
  app.post(teamMembers.delete, permission('users-service:delete'), serviceUsersController.delete)
  app.get(user.profile, enforceUserAuthenticated, serviceUsersController.profile)

  // TEAM MEMBERS - INVITE
  app.get(teamMembers.invite, permission('users-service:create'), inviteUserController.index)
  app.post(teamMembers.invite, permission('users-service:create'), inviteUserController.invite)

  // 3D SECURE TOGGLE
  app.get(t3ds.index, permission('toggle-3ds:read'), getAccount, toggle3ds.index)
  app.post(t3ds.onConfirm, permission('toggle-3ds:update'), getAccount, toggle3ds.onConfirm)
  app.post(t3ds.on, permission('toggle-3ds:update'), getAccount, toggle3ds.on)
  app.post(t3ds.off, permission('toggle-3ds:update'), getAccount, toggle3ds.off)
}
