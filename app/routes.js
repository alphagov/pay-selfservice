'use strict'

const lodash = require('lodash')
const AWSXRay = require('aws-xray-sdk')
const { getNamespace, createNamespace } = require('continuation-local-storage')

const logger = require('./utils/logger')(__filename)
const response = require('./utils/response.js').response
const generateRoute = require('./utils/generate-route')
const paths = require('./paths.js')

// Middleware
const { lockOutDisabledUsers, enforceUserAuthenticated, enforceUserFirstFactor, redirectLoggedInUser } = require('./services/auth.service')
const { validateAndRefreshCsrf, ensureSessionHasCsrfSecret } = require('./middleware/csrf')
const getEmailNotification = require('./middleware/get-email-notification')
const getAccount = require('./middleware/get-gateway-account')
const hasServices = require('./middleware/has-services')
const resolveService = require('./middleware/resolve-service')
const trimUsername = require('./middleware/trim-username')
const permission = require('./middleware/permission')
const paymentMethodIsCard = require('./middleware/payment-method-card')
const correlationIdMiddleware = require('./middleware/correlation-id')
const getRequestContext = require('./middleware/get-request-context').middleware
const restrictToSandbox = require('./middleware/restrict-to-sandbox')
const xraySegmentCls = require('./middleware/x-ray')
const restrictToLiveStripeAccount = require('./middleware/stripe-setup/restrict-to-live-stripe-account')
const getStripeAccount = require('./middleware/stripe-setup/get-stripe-account')
const checkBankDetailsNotSubmitted = require('./middleware/stripe-setup/check-bank-details-not-submitted')
const checkResponsiblePersonNotSubmitted = require('./middleware/stripe-setup/check-responsible-person-not-submitted')
const checkVatNumberNotSubmitted = require('./middleware/stripe-setup/check-vat-number-not-submitted')
const checkCompanyNumberNotSubmitted = require('./middleware/stripe-setup/check-company-number-not-submitted')

// Controllers
const staticController = require('./controllers/static.controller')
const transactionsDownloadController = require('./controllers/transactions/transaction-download.controller')
const transactionsListController = require('./controllers/transactions/transaction-list.controller')
const transactionDetailController = require('./controllers/transactions/transaction-detail.controller')
const transactionRefundController = require('./controllers/transactions/transaction-refund.controller')
const transactionDetailRedirectController = require('./controllers/transactions/transaction-detail-redirect.controller')
const credentialsController = require('./controllers/credentials.controller')
const loginController = require('./controllers/login')
const dashboardController = require('./controllers/dashboard')
const healthcheckController = require('./controllers/healthcheck.controller')
const apiKeysController = require('./controllers/api-keys')
const digitalWalletController = require('./controllers/digital-wallet')
const emailNotificationsController = require('./controllers/email-notifications/email-notifications.controller')
const forgotPasswordController = require('./controllers/forgotten-password.controller')
const myServicesController = require('./controllers/my-services')
const editServiceNameController = require('./controllers/edit-service-name.controller')
const serviceUsersController = require('./controllers/service-users.controller')
const merchantDetailsController = require('./controllers/edit-merchant-details')
const inviteUserController = require('./controllers/invite-user.controller')
const registerController = require('./controllers/register-user.controller')
const serviceRolesUpdateController = require('./controllers/service-roles-update.controller')
const toggle3dsController = require('./controllers/toggle-3ds')
const toggleMotoMaskCardNumber = require('./controllers/toggle-moto-mask-card-number')
const toggleMotoMaskSecurityCode = require('./controllers/toggle-moto-mask-security-code')
const selfCreateServiceController = require('./controllers/register-service.controller')
const createServiceController = require('./controllers/create-service.controller')
const inviteValidationController = require('./controllers/invite-validation.controller')
const testWithYourUsersController = require('./controllers/test-with-your-users')
const makeADemoPaymentController = require('./controllers/make-a-demo-payment')
const paymentLinksController = require('./controllers/payment-links')
const twoFactorAuthController = require('./controllers/two-factor-auth-controller')
const feedbackController = require('./controllers/feedback')
const toggleBillingAddressController = require('./controllers/billing-address/toggle-billing-address.controller')
const requestToGoLiveIndexController = require('./controllers/request-to-go-live/index')
const requestToGoLiveOrganisationNameController = require('./controllers/request-to-go-live/organisation-name')
const requestToGoLiveOrganisationAddressController = require('./controllers/request-to-go-live/organisation-address')
const requestToGoLiveChooseHowToProcessPaymentsController = require('./controllers/request-to-go-live/choose-how-to-process-payments')
const requestToGoLiveAgreementController = require('./controllers/request-to-go-live/agreement')
const policyDocumentsController = require('./controllers/policy')
const stripeSetupBankDetailsController = require('./controllers/stripe-setup/bank-details')
const stripeSetupResponsiblePersonController = require('./controllers/stripe-setup/responsible-person')
const stripeSetupVatNumberController = require('./controllers/stripe-setup/vat-number')
const stripeSetupCompanyNumberController = require('./controllers/stripe-setup/company-number')
const stripeSetupAddPspAccountDetailsController = require('./controllers/stripe-setup/add-psp-account-details')
const paymentTypesController = require('./controllers/payment-types')
const settingsController = require('./controllers/settings')
const userPhoneNumberController = require('./controllers/user/phone-number')
const goCardlessRedirect = require('./controllers/partnerapp/handle-redirect-to-gocardless-connect.controller')
const goCardlessOAuthGet = require('./controllers/partnerapp/handle-gocardless-connect-get.controller')
const yourPspController = require('./controllers/your-psp')
const allTransactionsController = require('./controllers/all-service-transactions/index')
const payoutsController = require('./controllers/payouts/payout-list.controller')
const stripeSetupDashboardRedirectController = require('./controllers/stripe-setup/stripe-setup-link')

// Assignments
const {
  healthcheck, registerUser, user, dashboard, selfCreateService, transactions, credentials,
  apiKeys, serviceSwitcher, teamMembers, staticPaths, inviteValidation, editServiceName, merchantDetails,
  notificationCredentials: nc, paymentTypes: pt, emailNotifications: en, toggle3ds: t3ds, toggleMotoMaskCardNumberAndSecurityCode, prototyping, paymentLinks,
  partnerApp, toggleBillingAddress: billingAddress, requestToGoLive, policyPages, stripeSetup, stripe, digitalWallet,
  settings, yourPsp, allServiceTransactions, payouts
} = paths

// Exports
module.exports.generateRoute = generateRoute
module.exports.paths = paths

// Constants
const clsXrayConfig = require('../config/xray-cls')

module.exports.bind = function (app) {
  AWSXRay.enableManualMode()
  AWSXRay.setLogger(logger)
  AWSXRay.middleware.setSamplingRules('aws-xray.rules')
  AWSXRay.config([AWSXRay.plugins.ECSPlugin])
  app.use(AWSXRay.express.openSegment('pay_selfservice'))

  createNamespace(clsXrayConfig.nameSpaceName)

  app.get('/style-guide', (req, res) => response(req, res, 'style_guide'))

  // APPLY CORRELATION MIDDLEWARE
  app.use('*', correlationIdMiddleware, getRequestContext)

  app.use((req, res, next) => {
    const namespace = getNamespace(clsXrayConfig.nameSpaceName)
    namespace.bindEmitter(req)
    namespace.bindEmitter(res)
    namespace.run(() => {
      next()
    })
  })

  app.all(lockOutDisabledUsers) // On all requests, if there is a user, and its disabled, lock out.

  // ----------------------
  // UNAUTHENTICATED ROUTES
  // ----------------------

  // HEALTHCHECK
  app.get(healthcheck.path, healthcheckController.healthcheck)

  // STATIC
  app.all(staticPaths.naxsiError, xraySegmentCls, staticController.naxsiError)

  // VALIDATE INVITE
  app.get(inviteValidation.validateInvite, xraySegmentCls, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, inviteValidationController.validateInvite)

  // REGISTER USER
  app.get(registerUser.registration, xraySegmentCls, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, registerController.showRegistration)
  app.get(registerUser.subscribeService, xraySegmentCls, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, registerController.subscribeService)
  app.post(registerUser.registration, xraySegmentCls, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, registerController.submitRegistration)
  app.get(registerUser.otpVerify, xraySegmentCls, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, registerController.showOtpVerify)
  app.post(registerUser.otpVerify, xraySegmentCls, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, registerController.submitOtpVerify)
  app.get(registerUser.reVerifyPhone, xraySegmentCls, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, registerController.showReVerifyPhone)
  app.post(registerUser.reVerifyPhone, xraySegmentCls, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, registerController.submitReVerifyPhone)
  app.get(registerUser.logUserIn, xraySegmentCls, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, loginController.loginAfterRegister, enforceUserAuthenticated, hasServices, resolveService, getAccount, dashboardController.dashboardActivity)

  // LOGIN
  app.get(user.logIn, xraySegmentCls, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, redirectLoggedInUser, loginController.loginGet)
  app.post(user.logIn, xraySegmentCls, validateAndRefreshCsrf, trimUsername, loginController.loginUser, hasServices, resolveService, getAccount, loginController.postLogin)
  app.get(dashboard.index, xraySegmentCls, enforceUserAuthenticated, validateAndRefreshCsrf, hasServices, resolveService, getAccount, dashboardController.dashboardActivity)
  app.get(user.noAccess, xraySegmentCls, loginController.noAccess)
  app.get(user.logOut, xraySegmentCls, loginController.logout)
  app.get(user.otpSendAgain, xraySegmentCls, enforceUserFirstFactor, validateAndRefreshCsrf, loginController.sendAgainGet)
  app.post(user.otpSendAgain, xraySegmentCls, enforceUserFirstFactor, validateAndRefreshCsrf, loginController.sendAgainPost)
  app.get(user.otpLogIn, xraySegmentCls, enforceUserFirstFactor, validateAndRefreshCsrf, loginController.otpLogin)
  app.post(user.otpLogIn, xraySegmentCls, validateAndRefreshCsrf, loginController.loginUserOTP, loginController.afterOTPLogin)

  // FORGOTTEN PASSWORD
  app.get(user.forgottenPassword, xraySegmentCls, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, forgotPasswordController.emailGet)
  app.post(user.forgottenPassword, xraySegmentCls, trimUsername, validateAndRefreshCsrf, forgotPasswordController.emailPost)
  app.get(user.passwordRequested, xraySegmentCls, forgotPasswordController.passwordRequested)
  app.get(user.forgottenPasswordReset, xraySegmentCls, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, forgotPasswordController.newPasswordGet)
  app.post(user.forgottenPasswordReset, xraySegmentCls, validateAndRefreshCsrf, forgotPasswordController.newPasswordPost)

  // SELF CREATE SERVICE
  app.get(selfCreateService.register, xraySegmentCls, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, selfCreateServiceController.showRegistration)
  app.post(selfCreateService.register, xraySegmentCls, trimUsername, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, selfCreateServiceController.submitRegistration)
  app.get(selfCreateService.confirm, xraySegmentCls, selfCreateServiceController.showConfirmation)
  app.get(selfCreateService.otpVerify, xraySegmentCls, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, selfCreateServiceController.showOtpVerify)
  app.post(selfCreateService.otpVerify, xraySegmentCls, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, selfCreateServiceController.createPopulatedService)
  app.get(selfCreateService.otpResend, xraySegmentCls, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, selfCreateServiceController.showOtpResend)
  app.post(selfCreateService.otpResend, xraySegmentCls, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, selfCreateServiceController.submitOtpResend)
  app.get(selfCreateService.logUserIn, xraySegmentCls, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, loginController.loginAfterRegister, enforceUserAuthenticated, getAccount, selfCreateServiceController.loggedIn)
  app.get(selfCreateService.serviceNaming, xraySegmentCls, enforceUserAuthenticated, validateAndRefreshCsrf, hasServices, getAccount, selfCreateServiceController.showNameYourService)
  app.post(selfCreateService.serviceNaming, xraySegmentCls, enforceUserAuthenticated, validateAndRefreshCsrf, hasServices, getAccount, selfCreateServiceController.submitYourServiceName)

  // GOCARDLESS PARTNER APP
  app.get(partnerApp.oauthComplete, xraySegmentCls, resolveService, getAccount, goCardlessOAuthGet.index)

  // ----------------------
  // AUTHENTICATED ROUTES
  // ----------------------

  const authenticatedPaths = [
    ...lodash.values(transactions),
    ...lodash.values(allServiceTransactions),
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
    ...lodash.values(user.profile),
    ...lodash.values(partnerApp),
    ...lodash.values(billingAddress),
    ...lodash.values(requestToGoLive),
    ...lodash.values(policyPages),
    ...lodash.values(stripeSetup),
    ...lodash.values(stripe),
    ...lodash.values(digitalWallet),
    ...lodash.values(settings),
    ...lodash.values(yourPsp),
    ...lodash.values(payouts),
    paths.feedback
  ] // Extract all the authenticated paths as a single array

  app.use(authenticatedPaths, xraySegmentCls, enforceUserAuthenticated, validateAndRefreshCsrf) // Enforce authentication on all get requests
  app.use(authenticatedPaths.filter(item => !lodash.values(serviceSwitcher).includes(item)), xraySegmentCls, hasServices) // Require services everywhere but the switcher page

  app.get(settings.index, xraySegmentCls, permission('transactions-details:read'), getAccount, getEmailNotification, settingsController.index)

  //  TRANSACTIONS
  app.get(transactions.index, xraySegmentCls, permission('transactions:read'), getAccount, paymentMethodIsCard, transactionsListController)
  app.get(transactions.download, xraySegmentCls, permission('transactions-download:read'), getAccount, paymentMethodIsCard, transactionsDownloadController)
  app.get(transactions.detail, xraySegmentCls, permission('transactions-details:read'), resolveService, getAccount, paymentMethodIsCard, transactionDetailController)
  app.post(transactions.refund, xraySegmentCls, permission('refunds:create'), getAccount, paymentMethodIsCard, transactionRefundController)
  app.get(transactions.redirectDetail, xraySegmentCls, permission('transactions-details:read'), getAccount, transactionDetailRedirectController)

  // ALL SERVICE TRANSACTIONS
  app.get(allServiceTransactions.index, xraySegmentCls, permission('transactions:read'), getAccount, allTransactionsController.getController)
  app.get(allServiceTransactions.download, xraySegmentCls, permission('transactions-download:read'), getAccount, allTransactionsController.downloadTransactions)

  app.get(payouts.list, permission('transactions:read'), payoutsController.listAllServicesPayouts)

  // YOUR PSP
  app.get(yourPsp.index, xraySegmentCls, permission('gateway-credentials:read'), getAccount, paymentMethodIsCard, yourPspController.getIndex)
  app.post(yourPsp.worldpay3dsFlex, xraySegmentCls, permission('toggle-3ds:update'), getAccount, paymentMethodIsCard, yourPspController.postToggleWorldpay3dsFlex)
  app.get(yourPsp.flex, xraySegmentCls, permission('gateway-credentials:update'), getAccount, paymentMethodIsCard, yourPspController.getFlex)
  app.post(yourPsp.flex, xraySegmentCls, permission('gateway-credentials:update'), getAccount, paymentMethodIsCard, yourPspController.postFlex)

  // CREDENTIALS
  app.get(credentials.index, xraySegmentCls, permission('gateway-credentials:read'), getAccount, paymentMethodIsCard, credentialsController.index)
  app.get(credentials.edit, xraySegmentCls, permission('gateway-credentials:update'), getAccount, paymentMethodIsCard, credentialsController.editCredentials)
  app.post(credentials.index, xraySegmentCls, permission('gateway-credentials:update'), getAccount, paymentMethodIsCard, credentialsController.update)

  app.get(nc.index, xraySegmentCls, permission('gateway-credentials:read'), getAccount, paymentMethodIsCard, credentialsController.index)
  app.get(nc.edit, xraySegmentCls, permission('gateway-credentials:update'), getAccount, paymentMethodIsCard, credentialsController.editNotificationCredentials)
  app.post(nc.update, xraySegmentCls, permission('gateway-credentials:update'), getAccount, paymentMethodIsCard, credentialsController.updateNotificationCredentials)

  // MERCHANT DETAILS
  app.get(merchantDetails.index, xraySegmentCls, permission('merchant-details:read'), merchantDetailsController.getIndex)
  app.get(merchantDetails.edit, xraySegmentCls, permission('merchant-details:update'), merchantDetailsController.getEdit)
  app.post(merchantDetails.edit, xraySegmentCls, permission('merchant-details:update'), merchantDetailsController.postEdit)

  // API KEYS
  app.get(apiKeys.index, xraySegmentCls, permission('tokens-active:read'), getAccount, apiKeysController.getIndex)
  app.get(apiKeys.revoked, xraySegmentCls, permission('tokens-revoked:read'), getAccount, apiKeysController.getRevoked)
  app.get(apiKeys.create, xraySegmentCls, permission('tokens:create'), getAccount, apiKeysController.getCreate)
  app.post(apiKeys.create, xraySegmentCls, permission('tokens:create'), getAccount, apiKeysController.postCreate)
  app.post(apiKeys.revoke, xraySegmentCls, permission('tokens:delete'), getAccount, apiKeysController.postRevoke)
  app.post(apiKeys.update, xraySegmentCls, permission('tokens:update'), getAccount, apiKeysController.postUpdate)

  // PAYMENT TYPES
  app.get(pt.index, xraySegmentCls, permission('payment-types:read'), getAccount, paymentMethodIsCard, paymentTypesController.getIndex)
  app.post(pt.index, xraySegmentCls, permission('payment-types:update'), getAccount, paymentMethodIsCard, paymentTypesController.postIndex)

  // DIGITAL WALLET
  app.get(digitalWallet.applePay, xraySegmentCls, permission('payment-types:update'), getAccount, paymentMethodIsCard, digitalWalletController.getApplePay)
  app.post(digitalWallet.applePay, xraySegmentCls, permission('payment-types:update'), getAccount, paymentMethodIsCard, digitalWalletController.postApplePay)
  app.get(digitalWallet.googlePay, xraySegmentCls, permission('payment-types:update'), getAccount, paymentMethodIsCard, digitalWalletController.getGooglePay)
  app.post(digitalWallet.googlePay, xraySegmentCls, permission('payment-types:update'), getAccount, paymentMethodIsCard, digitalWalletController.postGooglePay)

  // EMAIL
  app.get(en.index, xraySegmentCls, permission('email-notification-template:read'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotificationsController.index)
  app.get(en.indexRefundTabEnabled, xraySegmentCls, permission('email-notification-template:read'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotificationsController.indexRefundTabEnabled)
  app.get(en.edit, xraySegmentCls, permission('email-notification-paragraph:update'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotificationsController.edit)
  app.post(en.confirm, xraySegmentCls, permission('email-notification-paragraph:update'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotificationsController.confirm)
  app.post(en.update, xraySegmentCls, permission('email-notification-paragraph:update'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotificationsController.update)
  app.get(en.collection, xraySegmentCls, permission('email-notification-template:read'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotificationsController.collectionEmailIndex)
  app.post(en.collection, xraySegmentCls, permission('email-notification-toggle:update'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotificationsController.collectionEmailUpdate)
  app.get(en.confirmation, xraySegmentCls, permission('email-notification-template:read'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotificationsController.confirmationEmailIndex)
  app.post(en.confirmation, xraySegmentCls, permission('email-notification-toggle:update'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotificationsController.confirmationEmailUpdate)
  app.post(en.off, xraySegmentCls, permission('email-notification-toggle:update'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotificationsController.confirmationEmailOff)
  app.post(en.on, xraySegmentCls, permission('email-notification-toggle:update'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotificationsController.confirmationEmailOn)
  app.get(en.refund, xraySegmentCls, permission('email-notification-template:read'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotificationsController.refundEmailIndex)
  app.post(en.refund, xraySegmentCls, permission('email-notification-toggle:update'), getAccount, getEmailNotification, paymentMethodIsCard, emailNotificationsController.refundEmailUpdate)

  // SERVICE SWITCHER
  app.get(serviceSwitcher.index, xraySegmentCls, myServicesController.getIndex)
  app.post(serviceSwitcher.switch, xraySegmentCls, myServicesController.postIndex)
  app.get(serviceSwitcher.create, xraySegmentCls, createServiceController.get)
  app.post(serviceSwitcher.create, xraySegmentCls, createServiceController.post)

  // EDIT SERVICE NAME
  app.get(editServiceName.index, xraySegmentCls, permission('service-name:update'), editServiceNameController.get)
  app.post(editServiceName.update, xraySegmentCls, permission('service-name:update'), editServiceNameController.post)

  // TEAM MEMBERS - USER PROFILE
  app.get(teamMembers.index, xraySegmentCls, resolveService, serviceUsersController.index)
  app.get(teamMembers.show, xraySegmentCls, permission('users-service:read'), serviceUsersController.show)
  app.get(teamMembers.permissions, xraySegmentCls, permission('users-service:create'), serviceRolesUpdateController.index)
  app.post(teamMembers.permissions, xraySegmentCls, permission('users-service:create'), serviceRolesUpdateController.update)
  app.post(teamMembers.delete, xraySegmentCls, permission('users-service:delete'), serviceUsersController.delete)
  app.get(user.profile.index, xraySegmentCls, enforceUserAuthenticated, serviceUsersController.profile)

  // TEAM MEMBERS - INVITE
  app.get(teamMembers.invite, xraySegmentCls, permission('users-service:create'), inviteUserController.index)
  app.post(teamMembers.invite, xraySegmentCls, permission('users-service:create'), inviteUserController.invite)

  // 3D SECURE TOGGLE
  app.get(t3ds.index, xraySegmentCls, permission('toggle-3ds:read'), getAccount, paymentMethodIsCard, toggle3dsController.get)
  app.post(t3ds.index, xraySegmentCls, permission('toggle-3ds:update'), getAccount, paymentMethodIsCard, toggle3dsController.post)

  // MOTO MASK CARD NUMBER & SECURITY CODE TOGGLE
  app.get(toggleMotoMaskCardNumberAndSecurityCode.cardNumber, xraySegmentCls, permission('moto-mask-input:read'), getAccount, paymentMethodIsCard, toggleMotoMaskCardNumber.get)
  app.post(toggleMotoMaskCardNumberAndSecurityCode.cardNumber, xraySegmentCls, permission('moto-mask-input:update'), getAccount, paymentMethodIsCard, toggleMotoMaskCardNumber.post)
  app.get(toggleMotoMaskCardNumberAndSecurityCode.securityCode, xraySegmentCls, permission('moto-mask-input:read'), getAccount, paymentMethodIsCard, toggleMotoMaskSecurityCode.get)
  app.post(toggleMotoMaskCardNumberAndSecurityCode.securityCode, xraySegmentCls, permission('moto-mask-input:update'), getAccount, paymentMethodIsCard, toggleMotoMaskSecurityCode.post)

  // BILLING ADDRESS TOGGLE
  app.get(billingAddress.index, xraySegmentCls, permission('toggle-billing-address:read'), getAccount, paymentMethodIsCard, toggleBillingAddressController.getIndex)
  app.post(billingAddress.index, xraySegmentCls, permission('toggle-billing-address:update'), getAccount, paymentMethodIsCard, toggleBillingAddressController.postIndex)

  // Prototyping
  app.get(prototyping.demoService.index, xraySegmentCls, permission('transactions:read'), resolveService, getAccount, restrictToSandbox, testWithYourUsersController.index)
  app.get(prototyping.demoService.links, xraySegmentCls, permission('transactions:read'), resolveService, getAccount, restrictToSandbox, testWithYourUsersController.links)
  app.get(prototyping.demoService.create, xraySegmentCls, permission('transactions:read'), resolveService, getAccount, restrictToSandbox, testWithYourUsersController.create)
  app.post(prototyping.demoService.confirm, xraySegmentCls, permission('transactions:read'), resolveService, getAccount, restrictToSandbox, testWithYourUsersController.submit)
  app.get(prototyping.demoService.disable, xraySegmentCls, permission('transactions:read'), resolveService, getAccount, restrictToSandbox, testWithYourUsersController.disable)

  app.get(prototyping.demoPayment.index, xraySegmentCls, permission('transactions:read'), getAccount, restrictToSandbox, makeADemoPaymentController.index)
  app.post(prototyping.demoPayment.index, xraySegmentCls, permission('transactions:read'), getAccount, restrictToSandbox, makeADemoPaymentController.index)
  app.get(prototyping.demoPayment.editDescription, xraySegmentCls, permission('transactions:read'), getAccount, restrictToSandbox, makeADemoPaymentController.edit)
  app.get(prototyping.demoPayment.editAmount, xraySegmentCls, permission('transactions:read'), getAccount, restrictToSandbox, makeADemoPaymentController.edit)
  app.get(prototyping.demoPayment.mockCardDetails, xraySegmentCls, permission('transactions:read'), getAccount, restrictToSandbox, makeADemoPaymentController.mockCardDetails)
  app.post(prototyping.demoPayment.goToPaymentScreens, xraySegmentCls, permission('transactions:read'), getAccount, restrictToSandbox, makeADemoPaymentController.goToPayment)

  // Create payment link
  app.get(paymentLinks.start, xraySegmentCls, permission('tokens:create'), getAccount, paymentLinksController.getStart)
  app.get(paymentLinks.information, xraySegmentCls, permission('tokens:create'), getAccount, paymentLinksController.getInformation)
  app.post(paymentLinks.information, xraySegmentCls, permission('tokens:create'), getAccount, paymentLinksController.postInformation)
  app.get(paymentLinks.webAddress, xraySegmentCls, permission('tokens:create'), getAccount, paymentLinksController.getWebAddress)
  app.post(paymentLinks.webAddress, xraySegmentCls, permission('tokens:create'), getAccount, paymentLinksController.postWebAddress)
  app.get(paymentLinks.reference, xraySegmentCls, permission('tokens:create'), getAccount, paymentLinksController.getReference)
  app.post(paymentLinks.reference, xraySegmentCls, permission('tokens:create'), getAccount, paymentLinksController.postReference)
  app.get(paymentLinks.amount, xraySegmentCls, permission('tokens:create'), getAccount, paymentLinksController.getAmount)
  app.post(paymentLinks.amount, xraySegmentCls, permission('tokens:create'), getAccount, paymentLinksController.postAmount)
  app.get(paymentLinks.review, xraySegmentCls, permission('tokens:create'), getAccount, paymentLinksController.getReview)
  app.post(paymentLinks.review, xraySegmentCls, permission('tokens:create'), getAccount, paymentLinksController.postReview)

  app.get(paymentLinks.addMetadata, permission('tokens:create'), getAccount, paymentLinksController.getAddReportingColumn.showAddMetadataPage)
  app.get(paymentLinks.editMetadata, permission('tokens:create'), getAccount, paymentLinksController.getAddReportingColumn.showEditMetadataPage)
  app.post(paymentLinks.addMetadata, permission('tokens:create'), getAccount, paymentLinksController.postUpdateReportingColumn.addMetadata)
  app.post(paymentLinks.editMetadata, permission('tokens:create'), getAccount, paymentLinksController.postUpdateReportingColumn.editMetadata)
  app.post(paymentLinks.deleteMetadata, permission('tokens:create'), getAccount, paymentLinksController.postUpdateReportingColumn.deleteMetadata)

  app.get(paymentLinks.manage, xraySegmentCls, permission('transactions:read'), getAccount, paymentLinksController.getManage)
  app.get(paymentLinks.disable, xraySegmentCls, permission('tokens:create'), getAccount, paymentLinksController.getDisable)
  app.get(paymentLinks.delete, xraySegmentCls, permission('tokens:create'), getAccount, paymentLinksController.getDelete)
  app.get(paymentLinks.edit, xraySegmentCls, permission('tokens:create'), getAccount, paymentLinksController.getEdit)
  app.post(paymentLinks.edit, xraySegmentCls, permission('tokens:create'), getAccount, paymentLinksController.postEdit)
  app.get(paymentLinks.editInformation, xraySegmentCls, permission('tokens:create'), getAccount, paymentLinksController.getEditInformation)
  app.post(paymentLinks.editInformation, xraySegmentCls, permission('tokens:create'), getAccount, paymentLinksController.postEditInformation)
  app.get(paymentLinks.editReference, xraySegmentCls, permission('tokens:create'), getAccount, paymentLinksController.getEditReference)
  app.post(paymentLinks.editReference, xraySegmentCls, permission('tokens:create'), getAccount, paymentLinksController.postEditReference)
  app.get(paymentLinks.editAmount, xraySegmentCls, permission('tokens:create'), getAccount, paymentLinksController.getEditAmount)
  app.post(paymentLinks.editAmount, xraySegmentCls, permission('tokens:create'), getAccount, paymentLinksController.postEditAmount)

  app.get(paymentLinks.metadata.add, xraySegmentCls, permission('tokens:create'), getAccount, paymentLinksController.metadata.add)
  app.post(paymentLinks.metadata.add, xraySegmentCls, permission('tokens:create'), getAccount, paymentLinksController.metadata.post)
  app.get(paymentLinks.metadata.edit, xraySegmentCls, permission('tokens:create'), getAccount, paymentLinksController.metadata.editPage)
  app.post(paymentLinks.metadata.edit, xraySegmentCls, permission('tokens:create'), getAccount, paymentLinksController.metadata.editPagePost)
  app.post(paymentLinks.metadata.delete, xraySegmentCls, permission('tokens:create'), getAccount, paymentLinksController.metadata.deletePagePost)

  // Configure 2FA
  app.get(user.profile.twoFactorAuth.index, xraySegmentCls, twoFactorAuthController.getIndex)
  app.post(user.profile.twoFactorAuth.index, xraySegmentCls, twoFactorAuthController.postIndex)
  app.get(user.profile.twoFactorAuth.configure, xraySegmentCls, twoFactorAuthController.getConfigure)
  app.post(user.profile.twoFactorAuth.configure, xraySegmentCls, twoFactorAuthController.postConfigure)
  app.post(user.profile.twoFactorAuth.resend, xraySegmentCls, twoFactorAuthController.postResend)

  // Feedback
  app.get(paths.feedback, xraySegmentCls, hasServices, resolveService, getAccount, feedbackController.getIndex)
  app.post(paths.feedback, xraySegmentCls, hasServices, resolveService, getAccount, feedbackController.postIndex)

  // Partner app link GoCardless account
  app.get(paths.partnerApp.linkAccount, xraySegmentCls, permission('connected-gocardless-account:update'), getAccount, goCardlessRedirect.index)

  // Request to go live: index
  app.get(requestToGoLive.index, xraySegmentCls, permission('go-live-stage:read'), getAccount, requestToGoLiveIndexController.get)
  app.post(requestToGoLive.index, xraySegmentCls, permission('go-live-stage:update'), getAccount, requestToGoLiveIndexController.post)
  // Request to go live: organisation name
  app.get(requestToGoLive.organisationName, xraySegmentCls, permission('go-live-stage:update'), getAccount, requestToGoLiveOrganisationNameController.get)
  app.post(requestToGoLive.organisationName, xraySegmentCls, permission('go-live-stage:update'), getAccount, requestToGoLiveOrganisationNameController.post)
  // Request to go live: organisation address
  app.get(requestToGoLive.organisationAddress, xraySegmentCls, permission('go-live-stage:update'), getAccount, requestToGoLiveOrganisationAddressController.get)
  app.post(requestToGoLive.organisationAddress, xraySegmentCls, permission('go-live-stage:update'), getAccount, requestToGoLiveOrganisationAddressController.post)
  // Request to go live: choose how to process payments
  app.get(requestToGoLive.chooseHowToProcessPayments, xraySegmentCls, permission('go-live-stage:update'), getAccount, requestToGoLiveChooseHowToProcessPaymentsController.get)
  app.post(requestToGoLive.chooseHowToProcessPayments, xraySegmentCls, permission('go-live-stage:update'), getAccount, requestToGoLiveChooseHowToProcessPaymentsController.post)
  // Request to go live: agreement
  app.get(requestToGoLive.agreement, xraySegmentCls, permission('go-live-stage:update'), getAccount, requestToGoLiveAgreementController.get)
  app.post(requestToGoLive.agreement, xraySegmentCls, permission('go-live-stage:update'), getAccount, requestToGoLiveAgreementController.post)

  // Private policy document downloads
  app.get(policyPages.download, xraySegmentCls, policyDocumentsController.download)

  // Stripe setup: bank details
  app.get(
    stripeSetup.bankDetails,
    xraySegmentCls,
    permission('stripe-bank-details:update'),
    getAccount,
    paymentMethodIsCard,
    restrictToLiveStripeAccount,
    checkBankDetailsNotSubmitted,
    getStripeAccount,
    stripeSetupBankDetailsController.get
  )
  app.post(
    stripeSetup.bankDetails,
    xraySegmentCls,
    permission('stripe-bank-details:update'),
    getAccount,
    paymentMethodIsCard,
    restrictToLiveStripeAccount,
    checkBankDetailsNotSubmitted,
    getStripeAccount,
    stripeSetupBankDetailsController.post
  )

  // Stripe setup: responsible person
  app.get(stripeSetup.responsiblePerson,
    xraySegmentCls,
    permission('stripe-responsible-person:update'),
    getAccount,
    paymentMethodIsCard,
    restrictToLiveStripeAccount,
    getStripeAccount,
    checkResponsiblePersonNotSubmitted,
    stripeSetupResponsiblePersonController.get
  )
  app.post(stripeSetup.responsiblePerson,
    xraySegmentCls,
    permission('stripe-responsible-person:update'),
    getAccount,
    paymentMethodIsCard,
    restrictToLiveStripeAccount,
    getStripeAccount,
    checkResponsiblePersonNotSubmitted,
    stripeSetupResponsiblePersonController.post)

  // Stripe setup: VAT number
  app.get(stripeSetup.vatNumber,
    xraySegmentCls,
    permission('stripe-vat-number-company-number:update'),
    getAccount,
    paymentMethodIsCard,
    restrictToLiveStripeAccount,
    checkVatNumberNotSubmitted,
    stripeSetupVatNumberController.get
  )
  app.post(stripeSetup.vatNumber,
    xraySegmentCls,
    permission('stripe-vat-number-company-number:update'),
    getAccount,
    paymentMethodIsCard,
    restrictToLiveStripeAccount,
    getStripeAccount,
    checkVatNumberNotSubmitted,
    stripeSetupVatNumberController.post
  )

  // Stripe setup: company number
  app.get(stripeSetup.companyNumber,
    xraySegmentCls,
    permission('stripe-vat-number-company-number:update'),
    getAccount,
    paymentMethodIsCard,
    restrictToLiveStripeAccount,
    checkCompanyNumberNotSubmitted,
    stripeSetupCompanyNumberController.get
  )
  app.post(stripeSetup.companyNumber,
    xraySegmentCls,
    permission('stripe-vat-number-company-number:update'),
    getAccount,
    paymentMethodIsCard,
    restrictToLiveStripeAccount,
    getStripeAccount,
    checkCompanyNumberNotSubmitted,
    stripeSetupCompanyNumberController.post
  )

  app.get(stripeSetup.stripeSetupLink, stripeSetupDashboardRedirectController.get)

  app.get(stripe.addPspAccountDetails,
    xraySegmentCls,
    permission('stripe-account-details:update'),
    getAccount,
    paymentMethodIsCard,
    restrictToLiveStripeAccount,
    stripeSetupAddPspAccountDetailsController.get
  )

  app.get(user.profile.phoneNumber ,
    xraySegmentCls,
    userPhoneNumberController.get
  )

  app.post(user.profile.phoneNumber ,
    xraySegmentCls,
    userPhoneNumberController.post
  )

  app.all('*', (req, res) => {
    res.status(404)
    res.render('404')
  })

  app.use(AWSXRay.express.closeSegment())
}
