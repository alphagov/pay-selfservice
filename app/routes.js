'use strict'

// NPM Dependencies
const lodash = require('lodash')
const AWSXRay = require('aws-xray-sdk')
const logger = require('winston')

// Local Dependencies
const response = require('./utils/response.js').response
const generateRoute = require('./utils/generate_route')
const paths = require('./paths.js')

// - Middleware
const {lockOutDisabledUsers, enforceUserAuthenticated, enforceUserFirstFactor, redirectLoggedInUser} = require('./services/auth_service')
const {validateAndRefreshCsrf, ensureSessionHasCsrfSecret} = require('./middleware/csrf')
const getEmailNotification = require('./middleware/get_email_notification')
const getAccount = require('./middleware/get_gateway_account')
const hasServices = require('./middleware/has_services')
const resolveService = require('./middleware/resolve_service')
const trimUsername = require('./middleware/trim_username')
const permission = require('./middleware/permission')
const paymentMethodIsCard = require('./middleware/payment-method-card')
const validateRegistrationInviteCookie = require('./middleware/validate_registration_invite_cookie')
const otpVerify = require('./middleware/otp_verify')
const correlationIdMiddleware = require('./middleware/correlation_id')
const getRequestContext = require('./middleware/get_request_context').middleware
const restrictToSandbox = require('./middleware/restrict_to_sandbox')

// - Controllers
const staticCtrl = require('./controllers/static_controller')
const transactionsDownloadCtrl = require('./controllers/transactions/transaction_download_controller')
const transactionsListCtrl = require('./controllers/transactions/transaction_list_controller')
const transactionDetailCtrl = require('./controllers/transactions/transaction_detail_controller')
const transactionRefundCtrl = require('./controllers/transactions/transaction_refund_controller')
const credentialsCtrl = require('./controllers/credentials_controller')
const loginCtrl = require('./controllers/login')
const dashboardCtrl = require('./controllers/dashboard')
const healthcheckCtrl = require('./controllers/healthcheck_controller')
const apiKeysCtrl = require('./controllers/api-keys')
const paymentTypesSelectType = require('./controllers/payment_types_select_type_controller')
const paymentTypesSelectBrand = require('./controllers/payment_types_select_brand_controller')
const paymentTypesSummary = require('./controllers/payment_types_summary_controller')
const emailNotifications = require('./controllers/email_notifications_controller')
const forgotPassword = require('./controllers/forgotten_password_controller')
const myServicesCtrl = require('./controllers/my-services')
const editServiceNameCtrl = require('./controllers/edit_service_name_controller')
const serviceUsersController = require('./controllers/service_users_controller')
const merchantDetailsCtrl = require('./controllers/edit_merchant_details')
const inviteUserController = require('./controllers/invite_user_controller')
const registerCtrl = require('./controllers/register_user_controller')
const serviceRolesUpdateController = require('./controllers/service_roles_update_controller')
const toggle3ds = require('./controllers/toggle_3ds_controller')
const selfCreateServiceCtrl = require('./controllers/register_service_controller')
const createServiceCtrl = require('./controllers/create_service_controller')
const inviteValidationCtrl = require('./controllers/invite_validation_controller')
const testWithYourUsers = require('./controllers/test_with_your_users')
const makeADemoPayment = require('./controllers/make_a_demo_payment')
const paymentLinksCtrl = require('./controllers/payment-links')
const twoFactorAuthCtrl = require('./controllers/two-factor-auth-controller')
const feedbackCtrl = require('./controllers/feedback')

// Assignments
const {
  healthcheck, registerUser, user, dashboard, selfCreateService, transactions, credentials,
  apiKeys, serviceSwitcher, teamMembers, staticPaths, inviteValidation, editServiceName, merchantDetails,
  notificationCredentials: nc, paymentTypes: pt, emailNotifications: en, toggle3ds: t3ds, prototyping, paymentLinks} = paths

// Exports
module.exports.generateRoute = generateRoute
module.exports.paths = paths

module.exports.bind = function (app) {

  AWSXRay.captureHTTPsGlobal()
  AWSXRay.enableManualMode()
  AWSXRay.setLogger(logger)
  AWSXRay.middleware.setSamplingRules('aws-xray.rules')
  AWSXRay.config([AWSXRay.plugins.ECSPlugin])
  app.use(AWSXRay.express.openSegment('pay_selfservice'))

  app.get('/style-guide', (req, res) => response(req, res, 'style_guide'))

  // APPLY CORRELATION MIDDLEWARE
  app.use('*', correlationIdMiddleware, getRequestContext)

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
  app.get(registerUser.logUserIn, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, loginCtrl.loginAfterRegister, enforceUserAuthenticated, hasServices, resolveService, getAccount, dashboardCtrl.dashboardActivity)

  // LOGIN
  app.get(user.logIn, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, redirectLoggedInUser, loginCtrl.loginGet)
  app.post(user.logIn, validateAndRefreshCsrf, trimUsername, loginCtrl.loginUser, getAccount, loginCtrl.postLogin)
  app.get(dashboard.index, enforceUserAuthenticated, validateAndRefreshCsrf, hasServices, resolveService, getAccount, dashboardCtrl.dashboardActivity)
  app.get(user.noAccess, loginCtrl.noAccess)
  app.get(user.logOut, loginCtrl.logout)
  app.get(user.otpSendAgain, enforceUserFirstFactor, validateAndRefreshCsrf, loginCtrl.sendAgainGet)
  app.post(user.otpSendAgain, enforceUserFirstFactor, validateAndRefreshCsrf, loginCtrl.sendAgainPost)
  app.get(user.otpLogIn, enforceUserFirstFactor, validateAndRefreshCsrf, loginCtrl.otpLogin)
  app.post(user.otpLogIn, validateAndRefreshCsrf, loginCtrl.loginUserOTP, loginCtrl.afterOTPLogin)

  // FORGOTTEN PASSWORD
  app.get(user.forgottenPassword, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, forgotPassword.emailGet)
  app.post(user.forgottenPassword, trimUsername, validateAndRefreshCsrf, forgotPassword.emailPost)
  app.get(user.passwordRequested, forgotPassword.passwordRequested)
  app.get(user.forgottenPasswordReset, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, forgotPassword.newPasswordGet)
  app.post(user.forgottenPasswordReset, validateAndRefreshCsrf, forgotPassword.newPasswordPost)

  // SELF CREATE SERVICE
  app.get(selfCreateService.register, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, selfCreateServiceCtrl.showRegistration)
  app.post(selfCreateService.register, trimUsername, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, selfCreateServiceCtrl.submitRegistration)
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
    ...lodash.values(apiKeys),
    ...lodash.values(pt),
    ...lodash.values(en),
    ...lodash.values(editServiceName),
    ...lodash.values(serviceSwitcher),
    ...lodash.values(teamMembers),
    ...lodash.values(t3ds),
    ...lodash.values(merchantDetails),
    ...lodash.values(prototyping.demoPayment),
    ...lodash.values(prototyping.demoService),
    ...lodash.values(paymentLinks),
    ...lodash.values(user.twoFactorAuth),
    paths.feedback
  ] // Extract all the authenticated paths as a single array

  app.use(authenticatedPaths, enforceUserAuthenticated, validateAndRefreshCsrf) // Enforce authentication on all get requests
  app.use(authenticatedPaths.filter(item => !lodash.values(serviceSwitcher).includes(item)), hasServices) // Require services everywhere but the switcher page

  //  TRANSACTIONS
  app.get(transactions.index, permission('transactions:read'), getAccount, transactionsListCtrl)
  app.get(transactions.download, permission('transactions-download:read'), getAccount, transactionsDownloadCtrl)
  app.get(transactions.detail, permission('transactions-details:read'), getAccount, transactionDetailCtrl)
  app.post(transactions.refund, permission('refunds:create'), getAccount, transactionRefundCtrl)

  // CREDENTIALS
  app.get(credentials.index, permission('gateway-credentials:read'), getAccount, paymentMethodIsCard, credentialsCtrl.index)
  app.get(credentials.edit, permission('gateway-credentials:update'), getAccount, paymentMethodIsCard, credentialsCtrl.editCredentials)
  app.post(credentials.index, permission('gateway-credentials:update'), getAccount, paymentMethodIsCard, credentialsCtrl.update)

  app.get(nc.index, permission('gateway-credentials:read'), getAccount, paymentMethodIsCard, credentialsCtrl.index)
  app.get(nc.edit, permission('gateway-credentials:update'), getAccount, paymentMethodIsCard, credentialsCtrl.editNotificationCredentials)
  app.post(nc.update, permission('gateway-credentials:update'), getAccount, paymentMethodIsCard, credentialsCtrl.updateNotificationCredentials)

  // MERCHANT DETAILS
  app.get(merchantDetails.index, permission('merchant-details:read'), merchantDetailsCtrl.getIndex)
  app.get(merchantDetails.edit, permission('merchant-details:update'), merchantDetailsCtrl.getEdit)
  app.post(merchantDetails.edit, permission('merchant-details:update'), merchantDetailsCtrl.postEdit)

  // API KEYS
  app.get(apiKeys.index, permission('tokens-active:read'), getAccount, apiKeysCtrl.getIndex)
  app.get(apiKeys.revoked, permission('tokens-revoked:read'), getAccount, apiKeysCtrl.getRevoked)
  app.get(apiKeys.create, permission('tokens:create'), getAccount, apiKeysCtrl.getCreate)
  app.post(apiKeys.create, permission('tokens:create'), getAccount, apiKeysCtrl.postCreate)
  app.post(apiKeys.revoke, permission('tokens:delete'), getAccount, apiKeysCtrl.postRevoke)
  app.post(apiKeys.update, permission('tokens:update'), getAccount, apiKeysCtrl.postUpdate)

  // PAYMENT TYPES
  app.get(pt.selectType, permission('payment-types:read'), getAccount, paymentMethodIsCard, paymentTypesSelectType.selectType)
  app.post(pt.selectType, permission('payment-types:update'), getAccount, paymentMethodIsCard, paymentTypesSelectType.updateType)
  app.get(pt.selectBrand, permission('payment-types:read'), getAccount, paymentMethodIsCard, paymentTypesSelectBrand.showBrands)
  app.post(pt.selectBrand, permission('payment-types:update'), getAccount, paymentMethodIsCard, paymentTypesSelectBrand.updateBrands)
  app.get(pt.summary, permission('payment-types:read'), getAccount, paymentMethodIsCard, paymentTypesSummary.showSummary)

  // EMAIL
  app.get(en.index, permission('email-notification-template:read'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotifications.index)
  app.get(en.edit, permission('email-notification-paragraph:update'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotifications.edit)
  app.post(en.confirm, permission('email-notification-paragraph:update'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotifications.confirm)
  app.post(en.update, permission('email-notification-paragraph:update'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotifications.update)
  app.post(en.off, permission('email-notification-toggle:update'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotifications.off)
  app.get(en.offConfirm, permission('email-notification-toggle:update'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotifications.offConfirm)
  app.post(en.on, permission('email-notification-toggle:update'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotifications.on)

  // SERVICE SWITCHER
  app.get(serviceSwitcher.index, myServicesCtrl.getIndex)
  app.post(serviceSwitcher.switch, myServicesCtrl.postIndex)
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
  app.get(t3ds.index, permission('toggle-3ds:read'), getAccount, paymentMethodIsCard, toggle3ds.index)
  app.post(t3ds.onConfirm, permission('toggle-3ds:update'), getAccount, paymentMethodIsCard, toggle3ds.onConfirm)
  app.post(t3ds.on, permission('toggle-3ds:update'), getAccount, paymentMethodIsCard, toggle3ds.on)
  app.post(t3ds.off, permission('toggle-3ds:update'), getAccount, paymentMethodIsCard, toggle3ds.off)

  // Prototyping
  app.get(prototyping.demoService.index, permission('transactions:read'), resolveService, getAccount, restrictToSandbox, testWithYourUsers.index)
  app.get(prototyping.demoService.links, permission('transactions:read'), resolveService, getAccount, restrictToSandbox, testWithYourUsers.links)
  app.get(prototyping.demoService.create, permission('transactions:read'), resolveService, getAccount, restrictToSandbox, testWithYourUsers.create)
  app.post(prototyping.demoService.confirm, permission('transactions:read'), resolveService, getAccount, restrictToSandbox, testWithYourUsers.submit)
  app.get(prototyping.demoService.disable, permission('transactions:read'), resolveService, getAccount, restrictToSandbox, testWithYourUsers.disable)

  app.get(prototyping.demoPayment.index, permission('transactions:read'), getAccount, restrictToSandbox, makeADemoPayment.index)
  app.post(prototyping.demoPayment.index, permission('transactions:read'), getAccount, restrictToSandbox, makeADemoPayment.index)
  app.get(prototyping.demoPayment.editDescription, permission('transactions:read'), getAccount, restrictToSandbox, makeADemoPayment.edit)
  app.get(prototyping.demoPayment.editAmount, permission('transactions:read'), getAccount, restrictToSandbox, makeADemoPayment.edit)
  app.get(prototyping.demoPayment.mockCardDetails, permission('transactions:read'), getAccount, restrictToSandbox, makeADemoPayment.mockCardDetails)
  app.post(prototyping.demoPayment.goToPaymentScreens, permission('transactions:read'), getAccount, restrictToSandbox, makeADemoPayment.goToPayment)

  // Create payment link
  app.get(paymentLinks.start, permission('tokens:create'), getAccount, paymentLinksCtrl.getStart)
  app.get(paymentLinks.information, permission('tokens:create'), getAccount, paymentLinksCtrl.getInformation)
  app.post(paymentLinks.information, permission('tokens:create'), getAccount, paymentLinksCtrl.postInformation)
  app.get(paymentLinks.webAddress, permission('tokens:create'), getAccount, paymentLinksCtrl.getWebAddress)
  app.post(paymentLinks.webAddress, permission('tokens:create'), getAccount, paymentLinksCtrl.postWebAddress)
  app.get(paymentLinks.reference, permission('tokens:create'), getAccount, paymentLinksCtrl.getReference)
  app.post(paymentLinks.reference, permission('tokens:create'), getAccount, paymentLinksCtrl.postReference)
  app.get(paymentLinks.amount, permission('tokens:create'), getAccount, paymentLinksCtrl.getAmount)
  app.post(paymentLinks.amount, permission('tokens:create'), getAccount, paymentLinksCtrl.postAmount)
  app.get(paymentLinks.review, permission('tokens:create'), getAccount, paymentLinksCtrl.getReview)
  app.post(paymentLinks.review, permission('tokens:create'), getAccount, paymentLinksCtrl.postReview)
  app.get(paymentLinks.manage, permission('transactions:read'), getAccount, paymentLinksCtrl.getManage)
  app.get(paymentLinks.disable, permission('tokens:create'), getAccount, paymentLinksCtrl.getDisable)
  app.get(paymentLinks.delete, permission('tokens:create'), getAccount, paymentLinksCtrl.getDelete)
  app.get(paymentLinks.edit, permission('tokens:create'), getAccount, paymentLinksCtrl.getEdit)
  app.post(paymentLinks.edit, permission('tokens:create'), getAccount, paymentLinksCtrl.postEdit)
  app.get(paymentLinks.editInformation, permission('tokens:create'), getAccount, paymentLinksCtrl.getEditInformation)
  app.post(paymentLinks.editInformation, permission('tokens:create'), getAccount, paymentLinksCtrl.postEditInformation)
  app.get(paymentLinks.editAmount, permission('tokens:create'), getAccount, paymentLinksCtrl.getEditAmount)
  app.post(paymentLinks.editAmount, permission('tokens:create'), getAccount, paymentLinksCtrl.postEditAmount)

  // Configure 2FA
  app.get(user.twoFactorAuth.index, twoFactorAuthCtrl.getIndex)
  app.post(user.twoFactorAuth.index, twoFactorAuthCtrl.postIndex)
  app.get(user.twoFactorAuth.configure, twoFactorAuthCtrl.getConfigure)
  app.post(user.twoFactorAuth.configure, twoFactorAuthCtrl.postConfigure)
  app.post(user.twoFactorAuth.resend, twoFactorAuthCtrl.postResend)

  // Feedback
  app.get(paths.feedback, hasServices, resolveService, getAccount, feedbackCtrl.getIndex)
  app.post(paths.feedback, hasServices, resolveService, getAccount, feedbackCtrl.postIndex)

  app.all('*', (req, res) => {
    res.status(404)
    res.render('404')
  })

  app.use(AWSXRay.express.closeSegment())
}
