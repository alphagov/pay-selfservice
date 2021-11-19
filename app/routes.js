'use strict'

const { Router } = require('express')

const logger = require('./utils/logger')(__filename)
const response = require('./utils/response.js').response
const generateRoute = require('./utils/generate-route')
const paths = require('./paths.js')
const accountUrls = require('./utils/gateway-account-urls')

const userIsAuthorised = require('./middleware/user-is-authorised')
const getServiceAndAccount = require('./middleware/get-service-and-gateway-account.middleware')
const { NotFoundError } = require('./errors')

// Middleware
const { lockOutDisabledUsers, enforceUserFirstFactor, redirectLoggedInUser } = require('./services/auth.service')
const trimUsername = require('./middleware/trim-username')
const permission = require('./middleware/permission')
const correlationIdMiddleware = require('./middleware/correlation-id')
const getRequestContext = require('./middleware/get-request-context').middleware
const restrictToSandboxOrStripeTestAccount = require('./middleware/restrict-to-sandbox-or-stripe-test-account')
const restrictToStripeAccountContext = require('./middleware/stripe-setup/restrict-to-stripe-account-context')
const restrictToSwitchingAccount = require('./middleware/restrict-to-switching-account')

// Controllers
const staticController = require('./controllers/static.controller')
const rootController = require('./controllers/root/index.controller')
const transactionsDownloadController = require('./controllers/transactions/transaction-download.controller')
const transactionsListController = require('./controllers/transactions/transaction-list.controller')
const transactionDetailController = require('./controllers/transactions/transaction-detail.controller')
const transactionRefundController = require('./controllers/transactions/transaction-refund.controller')
const transactionDetailRedirectController = require('./controllers/transactions/transaction-detail-redirect.controller')
const credentialsController = require('./controllers/credentials.controller')
const worldpayCredentialsController = require('./controllers/credentials/worldpay.controller')
const loginController = require('./controllers/login')
const dashboardController = require('./controllers/dashboard')
const apiKeysController = require('./controllers/api-keys')
const digitalWalletController = require('./controllers/digital-wallet')
const emailNotificationsController = require('./controllers/email-notifications/email-notifications.controller')
const forgotPasswordController = require('./controllers/forgotten-password.controller')
const myServicesController = require('./controllers/my-services')
const editServiceNameController = require('./controllers/edit-service-name.controller')
const serviceUsersController = require('./controllers/service-users.controller')
const organisationDetailsController = require('./controllers/organisation-details.controller')
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
const stripeSetupDirectorController = require('./controllers/stripe-setup/director')
const stripeSetupAddPspAccountDetailsController = require('./controllers/stripe-setup/add-psp-account-details')
const paymentTypesController = require('./controllers/payment-types')
const settingsController = require('./controllers/settings')
const userPhoneNumberController = require('./controllers/user/phone-number')
const yourPspController = require('./controllers/your-psp')
const switchPSPController = require('./controllers/switch-psp/switch-psp.controller')
const verifyPSPIntegrationController = require('./controllers/switch-psp/verify-psp-integration.controller')
const allTransactionsController = require('./controllers/all-service-transactions/index')
const payoutsController = require('./controllers/payouts/payout-list.controller')
const stripeSetupDashboardRedirectController = require('./controllers/stripe-setup/stripe-setup-link')
const requestPspTestAccountController = require('./controllers/request-psp-test-account')
const defaultBillingAddressCountryController = require('./controllers/settings/default-billing-address-country.controller')
const webhooksController = require('./controllers/webhooks/webhooks.controller')
const kycOrganisationUrlController = require('./controllers/kyc/organisation-url')

// Assignments
const {
  allServiceTransactions,
  index,
  inviteValidation,
  policyPage,
  payouts,
  registerUser,
  selfCreateService,
  serviceSwitcher,
  staticPaths,
  user
} = paths
const {
  apiKeys,
  credentials,
  dashboard,
  defaultBillingAddressCountry,
  digitalWallet,
  emailNotifications,
  notificationCredentials,
  paymentLinks,
  paymentTypes,
  prototyping,
  settings,
  stripe,
  toggle3ds,
  toggleBillingAddress,
  toggleMotoMaskCardNumberAndSecurityCode,
  transactions,
  yourPsp,
  switchPSP,
  kyc
} = paths.account
const {
  webhooks
} = paths.futureAccountStrategy
const {
  editServiceName,
  organisationDetails,
  redirects,
  requestPspTestAccount,
  requestToGoLive,
  teamMembers
} = paths.service

// Exports
module.exports.generateRoute = generateRoute
module.exports.paths = paths

module.exports.bind = function (app) {
  const account = new Router({ mergeParams: true })
  account.use(getServiceAndAccount, userIsAuthorised)

  const futureAccountStrategy = new Router({ mergeParams: true })
  futureAccountStrategy.use(getServiceAndAccount, userIsAuthorised)

  const service = new Router({ mergeParams: true })
  service.use(getServiceAndAccount, userIsAuthorised)

  app.get('/style-guide', (req, res) => response(req, res, 'style_guide'))

  // APPLY CORRELATION MIDDLEWARE
  app.use('*', correlationIdMiddleware, getRequestContext)

  app.all(lockOutDisabledUsers) // On all requests, if there is a user, and its disabled, lock out.

  // ----------------------
  // UNAUTHENTICATED ROUTES
  // ----------------------

  // STATIC
  app.all(staticPaths.naxsiError, staticController.naxsiError)

  // VALIDATE INVITE
  app.get(inviteValidation.validateInvite, inviteValidationController.validateInvite)

  // REGISTER USER
  app.get(registerUser.registration, registerController.showRegistration)
  app.post(registerUser.registration, registerController.submitRegistration)
  app.get(registerUser.otpVerify, registerController.showOtpVerify)
  app.post(registerUser.otpVerify, registerController.submitOtpVerify)
  app.get(registerUser.reVerifyPhone, registerController.showReVerifyPhone)
  app.post(registerUser.reVerifyPhone, registerController.submitReVerifyPhone)
  app.get(registerUser.logUserIn, loginController.loginAfterRegister, userIsAuthorised, rootController.get)

  // LOGIN
  app.get(user.logIn, redirectLoggedInUser, loginController.loginGet)
  app.post(user.logIn, trimUsername, loginController.loginUser, loginController.postLogin)
  app.get(user.noAccess, loginController.noAccess)
  app.get(user.logOut, loginController.logout)
  app.get(user.otpSendAgain, enforceUserFirstFactor, loginController.sendAgainGet)
  app.post(user.otpSendAgain, enforceUserFirstFactor, loginController.sendAgainPost)
  app.get(user.otpLogIn, enforceUserFirstFactor, loginController.otpLogin)
  app.post(user.otpLogIn, loginController.loginUserOTP, loginController.afterOTPLogin)

  // FORGOTTEN PASSWORD
  app.get(user.forgottenPassword, forgotPasswordController.emailGet)
  app.post(user.forgottenPassword, trimUsername, forgotPasswordController.emailPost)
  app.get(user.passwordRequested, forgotPasswordController.passwordRequested)
  app.get(user.forgottenPasswordReset, forgotPasswordController.newPasswordGet)
  app.post(user.forgottenPasswordReset, forgotPasswordController.newPasswordPost)

  // SELF CREATE SERVICE
  app.get(selfCreateService.register, selfCreateServiceController.showRegistration)
  app.post(selfCreateService.register, trimUsername, selfCreateServiceController.submitRegistration)
  app.get(selfCreateService.confirm, selfCreateServiceController.showConfirmation)
  app.get(selfCreateService.otpVerify, selfCreateServiceController.showOtpVerify)
  app.post(selfCreateService.otpVerify, selfCreateServiceController.createPopulatedService)
  app.get(selfCreateService.otpResend, selfCreateServiceController.showOtpResend)
  app.post(selfCreateService.otpResend, selfCreateServiceController.submitOtpResend)
  app.get(selfCreateService.logUserIn, loginController.loginAfterRegister, userIsAuthorised, selfCreateServiceController.loggedIn)
  app.get(selfCreateService.serviceNaming, userIsAuthorised, selfCreateServiceController.showNameYourService)
  app.post(selfCreateService.serviceNaming, userIsAuthorised, selfCreateServiceController.submitYourServiceName)

  // ----------------------
  // AUTHENTICATED ROUTES
  // ----------------------

  // Site index
  app.get(index, userIsAuthorised, rootController.get)

  // -------------------------
  // OUTSIDE OF SERVICE ROUTES
  // -------------------------

  // Complete invite for existing user
  app.get(registerUser.subscribeService, userIsAuthorised, registerController.subscribeService)

  // Service switcher
  app.get(serviceSwitcher.index, userIsAuthorised, myServicesController.getIndex)
  app.post(serviceSwitcher.switch, userIsAuthorised, myServicesController.postIndex)
  app.get(serviceSwitcher.create, userIsAuthorised, createServiceController.get)
  app.post(serviceSwitcher.create, userIsAuthorised, createServiceController.post)

  // All service transactions
  app.get(allServiceTransactions.index, userIsAuthorised, allTransactionsController.getController)
  app.get(allServiceTransactions.indexStatusFilter, userIsAuthorised, allTransactionsController.getController)
  app.get(allServiceTransactions.download, userIsAuthorised, allTransactionsController.downloadTransactions)
  app.get(allServiceTransactions.downloadStatusFilter, userIsAuthorised, allTransactionsController.downloadTransactions)
  app.get(allServiceTransactions.redirectDetail, userIsAuthorised, transactionDetailRedirectController)

  // Payouts
  app.get(payouts.list, userIsAuthorised, payoutsController.listAllServicesPayouts)
  app.get(payouts.listStatusFilter, userIsAuthorised, payoutsController.listAllServicesPayouts)

  // Policy document downloads
  app.get(policyPage, userIsAuthorised, policyDocumentsController.get)

  // Feedback
  app.get(paths.feedback, userIsAuthorised, feedbackController.getIndex)
  app.post(paths.feedback, userIsAuthorised, feedbackController.postIndex)

  // User profile
  app.get(user.profile.index, userIsAuthorised, serviceUsersController.profile)
  app.get(user.profile.phoneNumber, userIsAuthorised, userPhoneNumberController.get)
  app.post(user.profile.phoneNumber, userIsAuthorised, userPhoneNumberController.post)

  // Configure 2FA
  app.get(user.profile.twoFactorAuth.index, userIsAuthorised, twoFactorAuthController.getIndex)
  app.post(user.profile.twoFactorAuth.index, userIsAuthorised, twoFactorAuthController.postIndex)
  app.get(user.profile.twoFactorAuth.configure, userIsAuthorised, twoFactorAuthController.getConfigure)
  app.post(user.profile.twoFactorAuth.configure, userIsAuthorised, twoFactorAuthController.postConfigure)
  app.post(user.profile.twoFactorAuth.resend, userIsAuthorised, twoFactorAuthController.postResend)

  // --------------------
  // SERVICE LEVEL ROUTES
  // --------------------

  // Edit service name
  service.get(editServiceName.index, permission('service-name:update'), editServiceNameController.get)
  service.post(editServiceName.update, permission('service-name:update'), editServiceNameController.post)

  // Team members
  service.get(teamMembers.index, serviceUsersController.index)
  service.get(teamMembers.show, permission('users-service:read'), serviceUsersController.show)
  service.get(teamMembers.permissions, permission('users-service:create'), serviceRolesUpdateController.index)
  service.post(teamMembers.permissions, permission('users-service:create'), serviceRolesUpdateController.update)
  service.post(teamMembers.delete, permission('users-service:delete'), serviceUsersController.remove)

  // Invite team member
  service.get(teamMembers.invite, permission('users-service:create'), inviteUserController.index)
  service.post(teamMembers.invite, permission('users-service:create'), inviteUserController.invite)

  // Merchant details
  service.get(organisationDetails.index, permission('merchant-details:read'), organisationDetailsController.showOrganisationDetails)
  service.get(organisationDetails.edit, permission('merchant-details:update'), requestToGoLiveOrganisationAddressController.get)
  service.post(organisationDetails.edit, permission('merchant-details:update'), requestToGoLiveOrganisationAddressController.post)

  // Request to go live
  service.get(requestToGoLive.index, permission('go-live-stage:read'), requestToGoLiveIndexController.get)
  service.post(requestToGoLive.index, permission('go-live-stage:update'), requestToGoLiveIndexController.post)
  service.get(requestToGoLive.organisationName, permission('go-live-stage:update'), requestToGoLiveOrganisationNameController.get)
  service.post(requestToGoLive.organisationName, permission('go-live-stage:update'), requestToGoLiveOrganisationNameController.post)
  service.get(requestToGoLive.organisationAddress, permission('go-live-stage:update'), requestToGoLiveOrganisationAddressController.get)
  service.post(requestToGoLive.organisationAddress, permission('go-live-stage:update'), requestToGoLiveOrganisationAddressController.post)
  service.get(requestToGoLive.chooseHowToProcessPayments, permission('go-live-stage:update'), requestToGoLiveChooseHowToProcessPaymentsController.get)
  service.post(requestToGoLive.chooseHowToProcessPayments, permission('go-live-stage:update'), requestToGoLiveChooseHowToProcessPaymentsController.post)
  service.get(requestToGoLive.agreement, permission('go-live-stage:update'), requestToGoLiveAgreementController.get)
  service.post(requestToGoLive.agreement, permission('go-live-stage:update'), requestToGoLiveAgreementController.post)

  // Service live account dashboard link
  service.get(redirects.stripeSetupLiveDashboardRedirect, stripeSetupDashboardRedirectController.get)

  // Request Stripe test account
  service.get(requestPspTestAccount, permission('psp-test-account-stage:update'), requestPspTestAccountController.get)
  service.post(requestPspTestAccount, permission('psp-test-account-stage:update'), requestPspTestAccountController.post)

  // ----------------------------
  // GATEWAY ACCOUNT LEVEL ROUTES
  // ----------------------------

  // Dashboard
  account.get(dashboard.index, dashboardController.dashboardActivity)

  // Transactions
  account.get(transactions.index, permission('transactions:read'), transactionsListController)
  account.get(transactions.download, permission('transactions-download:read'), transactionsDownloadController)
  account.get(transactions.detail, permission('transactions-details:read'), transactionDetailController)
  account.post(transactions.refund, permission('refunds:create'), transactionRefundController)

  // Settings
  account.get(settings.index, permission('transactions-details:read'), settingsController.index)

  // Your PSP
  account.get(yourPsp.index, permission('gateway-credentials:read'), yourPspController.getIndex)
  account.post(yourPsp.worldpay3dsFlex, permission('toggle-3ds:update'), yourPspController.postToggleWorldpay3dsFlex)
  account.get(yourPsp.flex, permission('gateway-credentials:update'), yourPspController.getFlex)
  account.post(yourPsp.flex, permission('gateway-credentials:update'), yourPspController.postFlex)

  account.get(switchPSP.index, restrictToSwitchingAccount, permission('gateway-credentials:update'), switchPSPController.switchPSPPage)
  account.post(switchPSP.index, restrictToSwitchingAccount, permission('gateway-credentials:update'), switchPSPController.submitSwitchPSP)
  account.get(switchPSP.verifyPSPIntegrationPayment, restrictToSwitchingAccount, permission('gateway-credentials:update'), verifyPSPIntegrationController.verifyPSPIntegrationPaymentPage)
  account.post(switchPSP.verifyPSPIntegrationPayment, restrictToSwitchingAccount, permission('gateway-credentials:update'), verifyPSPIntegrationController.startPaymentJourney)
  account.get(switchPSP.receiveVerifyPSPIntegrationPayment, restrictToSwitchingAccount, permission('gateway-credentials:update'), verifyPSPIntegrationController.completePaymentJourney)

  // Credentials
  account.get(yourPsp.credentialsWithGatewayCheck, permission('gateway-credentials:read'), worldpayCredentialsController.showWorldpayCredentialsPage)
  account.post(yourPsp.credentialsWithGatewayCheck, permission('gateway-credentials:read'), worldpayCredentialsController.updateWorldpayCredentials)
  account.get(switchPSP.credentialsWithGatewayCheck, permission('gateway-credentials:read'), worldpayCredentialsController.showWorldpayCredentialsPage)
  account.post(switchPSP.credentialsWithGatewayCheck, permission('gateway-credentials:read'), worldpayCredentialsController.updateWorldpayCredentials)

  account.get(credentials.edit, permission('gateway-credentials:update'), credentialsController.editCredentials)
  account.post(credentials.index, permission('gateway-credentials:update'), credentialsController.update)
  account.get(notificationCredentials.edit, permission('gateway-credentials:update'), credentialsController.editNotificationCredentials)
  account.post(notificationCredentials.update, permission('gateway-credentials:update'), credentialsController.updateNotificationCredentials)

  // API keys
  account.get(apiKeys.index, permission('tokens-active:read'), apiKeysController.getIndex)
  account.get(apiKeys.revoked, permission('tokens-revoked:read'), apiKeysController.getRevoked)
  account.get(apiKeys.create, permission('tokens:create'), apiKeysController.getCreate)
  account.post(apiKeys.create, permission('tokens:create'), apiKeysController.postCreate)
  account.post(apiKeys.revoke, permission('tokens:delete'), apiKeysController.postRevoke)
  account.post(apiKeys.update, permission('tokens:update'), apiKeysController.postUpdate)

  // Payment types
  account.get(paymentTypes.index, permission('payment-types:read'), paymentTypesController.getIndex)
  account.post(paymentTypes.index, permission('payment-types:update'), paymentTypesController.postIndex)

  // Digital wallet
  account.get(digitalWallet.applePay, permission('payment-types:update'), digitalWalletController.getApplePay)
  account.post(digitalWallet.applePay, permission('payment-types:update'), digitalWalletController.postApplePay)
  account.get(digitalWallet.googlePay, permission('payment-types:update'), digitalWalletController.getGooglePay)
  account.post(digitalWallet.googlePay, permission('payment-types:update'), digitalWalletController.postGooglePay)

  // Email notifications
  account.get(emailNotifications.index, permission('email-notification-template:read'), emailNotificationsController.showConfirmationEmailTemplate)
  account.get(emailNotifications.indexRefundTabEnabled, permission('email-notification-template:read'), emailNotificationsController.showRefundEmailTemplate)
  account.get(emailNotifications.edit, permission('email-notification-paragraph:update'), emailNotificationsController.editCustomParagraph)
  account.post(emailNotifications.confirm, permission('email-notification-paragraph:update'), emailNotificationsController.confirmCustomParagraph)
  account.post(emailNotifications.update, permission('email-notification-paragraph:update'), emailNotificationsController.updateCustomParagraph)
  account.get(emailNotifications.collection, permission('email-notification-template:read'), emailNotificationsController.collectionEmailIndex)
  account.post(emailNotifications.collection, permission('email-notification-toggle:update'), emailNotificationsController.collectionEmailUpdate)
  account.get(emailNotifications.confirmation, permission('email-notification-template:read'), emailNotificationsController.confirmationEmailIndex)
  account.post(emailNotifications.confirmation, permission('email-notification-toggle:update'), emailNotificationsController.confirmationEmailUpdate)
  account.post(emailNotifications.off, permission('email-notification-toggle:update'), emailNotificationsController.confirmationEmailOff)
  account.get(emailNotifications.refund, permission('email-notification-template:read'), emailNotificationsController.refundEmailIndex)
  account.post(emailNotifications.refund, permission('email-notification-toggle:update'), emailNotificationsController.refundEmailUpdate)

  // 3D secure
  account.get(toggle3ds.index, permission('toggle-3ds:read'), toggle3dsController.get)
  account.post(toggle3ds.index, permission('toggle-3ds:update'), toggle3dsController.post)

  // MOTO mask card number & security code
  account.get(toggleMotoMaskCardNumberAndSecurityCode.cardNumber, permission('moto-mask-input:read'), toggleMotoMaskCardNumber.get)
  account.post(toggleMotoMaskCardNumberAndSecurityCode.cardNumber, permission('moto-mask-input:update'), toggleMotoMaskCardNumber.post)
  account.get(toggleMotoMaskCardNumberAndSecurityCode.securityCode, permission('moto-mask-input:read'), toggleMotoMaskSecurityCode.get)
  account.post(toggleMotoMaskCardNumberAndSecurityCode.securityCode, permission('moto-mask-input:update'), toggleMotoMaskSecurityCode.post)

  account.get(toggleBillingAddress.index, permission('toggle-billing-address:read'), toggleBillingAddressController.getIndex)
  account.post(toggleBillingAddress.index, permission('toggle-billing-address:update'), toggleBillingAddressController.postIndex)

  account.get(defaultBillingAddressCountry.index, permission('toggle-billing-address:read'), defaultBillingAddressCountryController.showDefaultBillingAddressCountry)
  account.post(defaultBillingAddressCountry.index, permission('toggle-billing-address:update'), defaultBillingAddressCountryController.updateDefaultBillingAddressCountry)

  // Prototype links
  account.get(prototyping.demoService.index, permission('transactions:read'), restrictToSandboxOrStripeTestAccount, testWithYourUsersController.index)
  account.get(prototyping.demoService.links, permission('transactions:read'), restrictToSandboxOrStripeTestAccount, testWithYourUsersController.links)
  account.get(prototyping.demoService.create, permission('transactions:read'), restrictToSandboxOrStripeTestAccount, testWithYourUsersController.create)
  account.post(prototyping.demoService.confirm, permission('transactions:read'), restrictToSandboxOrStripeTestAccount, testWithYourUsersController.submit)
  account.get(prototyping.demoService.disable, permission('transactions:read'), restrictToSandboxOrStripeTestAccount, testWithYourUsersController.disable)

  // Demo payment
  account.get(prototyping.demoPayment.index, permission('transactions:read'), restrictToSandboxOrStripeTestAccount, makeADemoPaymentController.index)
  account.get(prototyping.demoPayment.editDescription, permission('transactions:read'), restrictToSandboxOrStripeTestAccount, makeADemoPaymentController.edit.getEditDescription)
  account.post(prototyping.demoPayment.editDescription, permission('transactions:read'), restrictToSandboxOrStripeTestAccount, makeADemoPaymentController.edit.updateDescription)
  account.get(prototyping.demoPayment.editAmount, permission('transactions:read'), restrictToSandboxOrStripeTestAccount, makeADemoPaymentController.edit.getEditAmount)
  account.post(prototyping.demoPayment.editAmount, permission('transactions:read'), restrictToSandboxOrStripeTestAccount, makeADemoPaymentController.edit.updateAmount)
  account.get(prototyping.demoPayment.mockCardDetails, permission('transactions:read'), restrictToSandboxOrStripeTestAccount, makeADemoPaymentController.mockCardDetails)
  account.post(prototyping.demoPayment.goToPaymentScreens, permission('transactions:read'), restrictToSandboxOrStripeTestAccount, makeADemoPaymentController.goToPayment)

  // Create payment link
  account.get(paymentLinks.start, permission('tokens:create'), paymentLinksController.getStart)
  account.get(paymentLinks.information, permission('tokens:create'), paymentLinksController.getInformation)
  account.post(paymentLinks.information, permission('tokens:create'), paymentLinksController.postInformation)
  account.get(paymentLinks.webAddress, permission('tokens:create'), paymentLinksController.getWebAddress)
  account.post(paymentLinks.webAddress, permission('tokens:create'), paymentLinksController.postWebAddress)
  account.get(paymentLinks.reference, permission('tokens:create'), paymentLinksController.getReference)
  account.post(paymentLinks.reference, permission('tokens:create'), paymentLinksController.postReference)
  account.get(paymentLinks.amount, permission('tokens:create'), paymentLinksController.getAmount)
  account.post(paymentLinks.amount, permission('tokens:create'), paymentLinksController.postAmount)
  account.get(paymentLinks.review, permission('tokens:create'), paymentLinksController.getReview)
  account.post(paymentLinks.review, permission('tokens:create'), paymentLinksController.postReview)
  account.get(paymentLinks.addMetadata, permission('tokens:create'), paymentLinksController.getAddReportingColumn.showAddMetadataPage)
  account.get(paymentLinks.editMetadata, permission('tokens:create'), paymentLinksController.getAddReportingColumn.showEditMetadataPage)
  account.post(paymentLinks.addMetadata, permission('tokens:create'), paymentLinksController.postUpdateReportingColumn.addMetadata)
  account.post(paymentLinks.editMetadata, permission('tokens:create'), paymentLinksController.postUpdateReportingColumn.editMetadata)
  account.post(paymentLinks.deleteMetadata, permission('tokens:create'), paymentLinksController.postUpdateReportingColumn.deleteMetadata)

  account.get(paymentLinks.manage.index, permission('transactions:read'), paymentLinksController.getManage)
  account.get(paymentLinks.manage.disable, permission('tokens:create'), paymentLinksController.getDisable)
  account.get(paymentLinks.manage.delete, permission('tokens:create'), paymentLinksController.getDelete)
  account.get(paymentLinks.manage.edit, permission('tokens:create'), paymentLinksController.getEdit)
  account.post(paymentLinks.manage.edit, permission('tokens:create'), paymentLinksController.postEdit)
  account.get(paymentLinks.manage.editInformation, permission('tokens:create'), paymentLinksController.getEditInformation)
  account.post(paymentLinks.manage.editInformation, permission('tokens:create'), paymentLinksController.postEditInformation)
  account.get(paymentLinks.manage.editReference, permission('tokens:create'), paymentLinksController.getEditReference)
  account.post(paymentLinks.manage.editReference, permission('tokens:create'), paymentLinksController.postEditReference)
  account.get(paymentLinks.manage.editAmount, permission('tokens:create'), paymentLinksController.getEditAmount)
  account.post(paymentLinks.manage.editAmount, permission('tokens:create'), paymentLinksController.postEditAmount)
  account.get(paymentLinks.manage.addMetadata, permission('tokens:create'), paymentLinksController.getAddReportingColumn.showAddMetadataPage)
  account.post(paymentLinks.manage.addMetadata, permission('tokens:create'), paymentLinksController.postUpdateReportingColumn.addMetadata)
  account.get(paymentLinks.manage.editMetadata, permission('tokens:create'), paymentLinksController.getAddReportingColumn.showEditMetadataPage)
  account.post(paymentLinks.manage.editMetadata, permission('tokens:create'), paymentLinksController.postUpdateReportingColumn.editMetadata)
  account.post(paymentLinks.manage.deleteMetadata, permission('tokens:create'), paymentLinksController.postUpdateReportingColumn.deleteMetadata)

  account.get(kyc.organisationUrl, permission('merchant-details:update'), restrictToStripeAccountContext, kycOrganisationUrlController.get)
  account.post(kyc.organisationUrl, permission('merchant-details:update'), restrictToStripeAccountContext, kycOrganisationUrlController.post)

  // Stripe setup
  account.get([ yourPsp.stripeSetup.bankDetails, switchPSP.stripeSetup.bankDetails ], permission('stripe-bank-details:update'), restrictToStripeAccountContext, stripeSetupBankDetailsController.get)
  account.post([ yourPsp.stripeSetup.bankDetails, switchPSP.stripeSetup.bankDetails ], permission('stripe-bank-details:update'), restrictToStripeAccountContext, stripeSetupBankDetailsController.post)
  account.get([ yourPsp.stripeSetup.responsiblePerson, switchPSP.stripeSetup.responsiblePerson, kyc.changeResponsiblePerson ], permission('stripe-responsible-person:update'), restrictToStripeAccountContext, stripeSetupResponsiblePersonController.get)
  account.post([ yourPsp.stripeSetup.responsiblePerson, switchPSP.stripeSetup.responsiblePerson, kyc.changeResponsiblePerson ], permission('stripe-responsible-person:update'), restrictToStripeAccountContext, stripeSetupResponsiblePersonController.post)
  account.get(kyc.responsiblePerson, permission('stripe-responsible-person:update'), restrictToStripeAccountContext, stripeSetupResponsiblePersonController.getAdditionalDetails)
  account.post(kyc.responsiblePerson, permission('stripe-responsible-person:update'), restrictToStripeAccountContext, stripeSetupResponsiblePersonController.postAdditionalDetails)
  account.get([yourPsp.stripeSetup.director, switchPSP.stripeSetup.director, kyc.director], permission('stripe-director:update'), restrictToStripeAccountContext, stripeSetupDirectorController.get)
  account.post([ yourPsp.stripeSetup.director, switchPSP.stripeSetup.director, kyc.director ], permission('stripe-director:update'), restrictToStripeAccountContext, stripeSetupDirectorController.post)
  account.get([ yourPsp.stripeSetup.vatNumber, switchPSP.stripeSetup.vatNumber ], permission('stripe-vat-number-company-number:update'), restrictToStripeAccountContext, stripeSetupVatNumberController.get)
  account.post([ yourPsp.stripeSetup.vatNumber, switchPSP.stripeSetup.vatNumber ], permission('stripe-vat-number-company-number:update'), restrictToStripeAccountContext, stripeSetupVatNumberController.post)
  account.get([ yourPsp.stripeSetup.companyNumber, switchPSP.stripeSetup.companyNumber ], permission('stripe-vat-number-company-number:update'), restrictToStripeAccountContext, stripeSetupCompanyNumberController.get)
  account.post([ yourPsp.stripeSetup.companyNumber, switchPSP.stripeSetup.companyNumber ], permission('stripe-vat-number-company-number:update'), restrictToStripeAccountContext, stripeSetupCompanyNumberController.post)
  account.get(stripe.addPspAccountDetails, permission('stripe-account-details:update'), restrictToStripeAccountContext, stripeSetupAddPspAccountDetailsController.get)

  futureAccountStrategy.get(webhooks.index, permission('webhooks:read'), webhooksController.listWebhooksPage)

  app.use(paths.account.root, account)
  app.use(paths.service.root, service)
  app.use(paths.futureAccountStrategy.root, futureAccountStrategy)

  // security.txt — https://gds-way.cloudapps.digital/standards/vulnerability-disclosure.html
  const securitytxt = 'https://vdp.cabinetoffice.gov.uk/.well-known/security.txt'
  app.get('/.well-known/security.txt', (req, res) => res.redirect(securitytxt))
  app.get('/security.txt', (req, res) => res.redirect(securitytxt))

  app.all('*', (req, res, next) => {
    if (accountUrls.isLegacyAccountsUrl(req.url)) {
      if (!req.user) {
        if (req.session) {
          req.session.last_url = req.url
        }
        res.redirect(user.logIn)
        return
      }

      const currentSessionAccountExternalId = req.gateway_account && req.gateway_account.currentGatewayAccountExternalId
      if (currentSessionAccountExternalId) {
        const upgradedPath = accountUrls.getUpgradedAccountStructureUrl(req.url, currentSessionAccountExternalId)
        logger.info('Accounts URL utility upgraded a request to a legacy account URL', {
          url: req.originalUrl,
          redirected_url: upgradedPath,
          session_has_user: !!req.user
        })
        res.redirect(upgradedPath)
        return
      }

      res.redirect(serviceSwitcher.index)
      return
    }
    logger.info('Page not found', {
      url: req.originalUrl
    })
    next(new NotFoundError('Route not found'))
  })
}
