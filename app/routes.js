'use strict'

const { Router } = require('express')
const passport = require('passport')

const logger = require('./utils/logger')(__filename)
const response = require('./utils/response.js').response
const generateRoute = require('./utils/generate-route')
const paths = require('./paths.js')
const accountUrls = require('./utils/gateway-account-urls')

const userIsAuthorised = require('./middleware/user-is-authorised')
const getServiceAndAccount = require('./middleware/get-service-and-gateway-account.middleware')
const { NotFoundError } = require('./errors')

// Middleware
const { enforceUserFirstFactor, redirectLoggedInUser } = require('./services/auth.service')
const trimUsername = require('./middleware/trim-username')
const permission = require('./middleware/permission')
const restrictToSandboxOrStripeTestAccount = require('./middleware/restrict-to-sandbox-or-stripe-test-account')
const restrictToStripeAccountContext = require('./middleware/stripe-setup/restrict-to-stripe-account-context')
const restrictToSwitchingAccount = require('./middleware/restrict-to-switching-account')
const uploadGovernmentEntityDocument = require('./middleware/multer-middleware')
const inviteCookieIsPresent = require('./middleware/invite-cookie-is-present')

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
const editServiceNameController = require('./controllers/edit-service-name/edit-service-name.controller')
const serviceUsersController = require('./controllers/service-users.controller')
const organisationDetailsController = require('./controllers/organisation-details.controller')
const inviteUserController = require('./controllers/invite-user.controller')
const registerController = require('./controllers/subscribe-service.controller')
const serviceRolesUpdateController = require('./controllers/service-roles-update.controller')
const toggleMotoMaskCardNumber = require('./controllers/toggle-moto-mask-card-number')
const toggleMotoMaskSecurityCode = require('./controllers/toggle-moto-mask-security-code')
const createServiceController = require('./controllers/create-service/create-service.controller')
const selectOrgTypeController = require('./controllers/create-service/select-organisation-type/select-organisation-type.controller')
const inviteValidationController = require('./controllers/invite-validation.controller')
const testWithYourUsersController = require('./controllers/test-with-your-users')
const makeADemoPaymentController = require('./controllers/make-a-demo-payment')
const paymentLinksController = require('./controllers/payment-links')
const twoFactorAuthController = require('./controllers/user/two-factor-auth')
const feedbackController = require('./controllers/feedback')
const toggleBillingAddressController = require('./controllers/billing-address/toggle-billing-address.controller')
const requestToGoLiveIndexController = require('./controllers/request-to-go-live/index')
const requestToGoLiveOrganisationNameController = require('./controllers/request-to-go-live/organisation-name')
const requestToGoLiveOrganisationAddressController = require('./controllers/request-to-go-live/organisation-address')
const requestToGoLiveChooseHowToProcessPaymentsController = require('./controllers/request-to-go-live/choose-how-to-process-payments')
const requestToGoLiveChooseTakesPaymentsOverPhoneController = require('./controllers/request-to-go-live/choose-takes-payments-over-phone')
const requestToGoLiveAgreementController = require('./controllers/request-to-go-live/agreement')
const stripeTermsAndConditionsController = require('./controllers/stripeTermsAndConditions.controller.js')
const policyDocumentsController = require('./controllers/policy')
const stripeSetupBankDetailsController = require('./controllers/stripe-setup/bank-details')
const stripeSetupCheckOrgDetailsController = require('./controllers/stripe-setup/check-org-details')
const stripeSetupResponsiblePersonController = require('./controllers/stripe-setup/responsible-person')
const stripeSetupVatNumberController = require('./controllers/stripe-setup/vat-number')
const stripeSetupCompanyNumberController = require('./controllers/stripe-setup/company-number')
const stripeSetupDirectorController = require('./controllers/stripe-setup/director')
const stripeSetupGovernmentEntityDocument = require('./controllers/stripe-setup/government-entity-document')
const stripeSetupAddPspAccountDetailsController = require('./controllers/stripe-setup/add-psp-account-details')
const paymentTypesController = require('./controllers/payment-types')
const settingsController = require('./controllers/settings')
const userPhoneNumberController = require('./controllers/user/phone-number')
const userDegatewayController = require('./controllers/user/degateway')
const yourPspController = require('./controllers/your-psp')
const switchPSPController = require('./controllers/switch-psp/switch-psp.controller')
const verifyPSPIntegrationController = require('./controllers/switch-psp/verify-psp-integration.controller')
const allTransactionsController = require('./controllers/all-service-transactions/index')
const payoutsController = require('./controllers/payouts/payout-list.controller')
const stripeSetupDashboardRedirectController = require('./controllers/stripe-setup/stripe-setup-link')
const requestPspTestAccountController = require('./controllers/request-psp-test-account')
const defaultBillingAddressCountryController = require('./controllers/settings/default-billing-address-country.controller')
const webhooksController = require('./controllers/webhooks/webhooks.controller')
const agreementsController = require('./controllers/agreements/agreements.controller')
const organisationUrlController = require('./controllers/switch-psp/organisation-url')
const registrationController = require('./controllers/registration/registration.controller')
const privacyController = require('./controllers/privacy/privacy.controller')

// Assignments
const {
  allServiceTransactions,
  demoPaymentFwd,
  index,
  invite,
  stripeTermsAndConditions,
  policyPage,
  payouts,
  register,
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
  toggleBillingAddress,
  toggleMotoMaskCardNumberAndSecurityCode,
  transactions,
  yourPsp,
  switchPSP
} = paths.account
const {
  webhooks,
  agreements
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

  // ----------------------
  // UNAUTHENTICATED ROUTES
  // ----------------------

  // STATIC
  app.all(staticPaths.naxsiError, staticController.naxsiError)

  // VALIDATE INVITE
  app.get(invite.validateInvite, inviteValidationController.validateInvite)

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

  // Complete invite for existing user
  app.get(invite.subscribeService, userIsAuthorised, inviteCookieIsPresent, registerController.subscribeService)

  // REGISTRATION
  app.get(register.email, registrationController.showEmailPage)
  app.post(register.email, registrationController.submitEmailPage)
  app.get(register.checkEmail, registrationController.showCheckEmailPage)
  app.get(register.password, inviteCookieIsPresent, registrationController.showPasswordPage)
  app.post(register.password, inviteCookieIsPresent, registrationController.submitPasswordPage)
  app.get(register.securityCodes, inviteCookieIsPresent, registrationController.showChooseSignInMethodPage)
  app.post(register.securityCodes, inviteCookieIsPresent, registrationController.submitChooseSignInMethodPage)
  app.get(register.authenticatorApp, inviteCookieIsPresent, registrationController.showAuthenticatorAppPage)
  app.post(register.authenticatorApp, inviteCookieIsPresent, registrationController.submitAuthenticatorAppPage)
  app.get(register.phoneNumber, inviteCookieIsPresent, registrationController.showPhoneNumberPage)
  app.post(register.phoneNumber, inviteCookieIsPresent, registrationController.submitPhoneNumberPage)
  app.get(register.smsCode, inviteCookieIsPresent, registrationController.showSmsSecurityCodePage)
  app.post(register.smsCode, inviteCookieIsPresent, registrationController.submitSmsSecurityCodePage)
  app.get(register.resendCode, inviteCookieIsPresent, registrationController.showResendSecurityCodePage)
  app.post(register.resendCode, inviteCookieIsPresent, registrationController.submitResendSecurityCodePage)
  app.get(
    register.success,
    passport.authenticate('localStrategyLoginDirectAfterRegistration', { failureRedirect: user.logIn }),
    userIsAuthorised,
    registrationController.showSuccessPage
  )

  // Privacy page
  app.get(paths.privacy, privacyController.getPage)

  // ----------------------
  // AUTHENTICATED ROUTES
  // ----------------------

  // Site index
  app.get(index, userIsAuthorised, rootController.get)

  // -------------------------
  // OUTSIDE OF SERVICE ROUTES
  // -------------------------

  // Service switcher
  app.get(serviceSwitcher.index, userIsAuthorised, myServicesController.getIndex)
  app.post(serviceSwitcher.switch, userIsAuthorised, myServicesController.postIndex)
  app.get(serviceSwitcher.create.index, userIsAuthorised, createServiceController.get)
  app.post(serviceSwitcher.create.index, userIsAuthorised, createServiceController.post)
  app.post(serviceSwitcher.create.selectOrgType, userIsAuthorised, selectOrgTypeController.post)
  app.get(serviceSwitcher.create.selectOrgType, userIsAuthorised, selectOrgTypeController.get)

  // All service transactions
  app.get(allServiceTransactions.index, userIsAuthorised, allTransactionsController.getController)
  app.get(allServiceTransactions.indexStatusFilter, userIsAuthorised, allTransactionsController.getController)
  app.get(allServiceTransactions.indexStatusFilterWithoutSearch, userIsAuthorised, allTransactionsController.noAutosearchTransactions)
  app.get(allServiceTransactions.download, userIsAuthorised, allTransactionsController.downloadTransactions)
  app.get(allServiceTransactions.downloadStatusFilter, userIsAuthorised, allTransactionsController.downloadTransactions)
  app.get(allServiceTransactions.redirectDetail, userIsAuthorised, transactionDetailRedirectController)

  // demo payment  return route
  app.get(demoPaymentFwd.goToTransaction, userIsAuthorised, makeADemoPaymentController.goToTransaction)

  // Payouts
  app.get(payouts.list, userIsAuthorised, payoutsController.listAllServicesPayouts)
  app.get(payouts.listStatusFilter, userIsAuthorised, payoutsController.listAllServicesPayouts)

  // Stripe terms and conditions
  app.get(stripeTermsAndConditions, userIsAuthorised, stripeTermsAndConditionsController.get)

  // Policy document downloads
  app.get(policyPage, userIsAuthorised, policyDocumentsController.get)

  // Feedback
  app.get(paths.feedback, userIsAuthorised, feedbackController.getIndex)
  app.post(paths.feedback, userIsAuthorised, feedbackController.postIndex)

  // User profile
  app.get(user.profile.index, userIsAuthorised, serviceUsersController.profile)
  app.get(user.profile.phoneNumber, userIsAuthorised, userPhoneNumberController.get)
  app.post(user.profile.phoneNumber, userIsAuthorised, userPhoneNumberController.post)

  // Degateway
  app.get(user.profile.degateway, userIsAuthorised, userDegatewayController.get)
  app.post(user.profile.degateway, userIsAuthorised, userDegatewayController.post)

  // Configure 2FA
  app.get(user.profile.twoFactorAuth.index, userIsAuthorised, twoFactorAuthController.getIndex)
  app.post(user.profile.twoFactorAuth.index, userIsAuthorised, twoFactorAuthController.postIndex)
  app.get(user.profile.twoFactorAuth.phoneNumber, userIsAuthorised, twoFactorAuthController.getPhoneNumber)
  app.post(user.profile.twoFactorAuth.phoneNumber, userIsAuthorised, twoFactorAuthController.postPhoneNumber)
  app.get(user.profile.twoFactorAuth.configure, userIsAuthorised, twoFactorAuthController.getConfigure)
  app.post(user.profile.twoFactorAuth.configure, userIsAuthorised, twoFactorAuthController.postConfigure)
  app.get(user.profile.twoFactorAuth.resend, userIsAuthorised, twoFactorAuthController.getResend)
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
  service.get(requestToGoLive.chooseTakesPaymentsOverPhone, permission('go-live-stage:update'), requestToGoLiveChooseTakesPaymentsOverPhoneController.get)
  service.post(requestToGoLive.chooseTakesPaymentsOverPhone, permission('go-live-stage:update'), requestToGoLiveChooseTakesPaymentsOverPhoneController.post)
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
  account.get([yourPsp.flex, switchPSP.flex], permission('gateway-credentials:update'), yourPspController.getFlex)
  account.post([yourPsp.flex, switchPSP.flex], permission('gateway-credentials:update'), yourPspController.postFlex)

  account.get(switchPSP.index, restrictToSwitchingAccount, permission('gateway-credentials:update'), switchPSPController.switchPSPPage)
  account.post(switchPSP.index, restrictToSwitchingAccount, permission('gateway-credentials:update'), switchPSPController.submitSwitchPSP)
  account.get(switchPSP.verifyPSPIntegrationPayment, restrictToSwitchingAccount, permission('gateway-credentials:update'), verifyPSPIntegrationController.verifyPSPIntegrationPaymentPage)
  account.post(switchPSP.verifyPSPIntegrationPayment, restrictToSwitchingAccount, permission('gateway-credentials:update'), verifyPSPIntegrationController.startPaymentJourney)
  account.get(switchPSP.receiveVerifyPSPIntegrationPayment, restrictToSwitchingAccount, permission('gateway-credentials:update'), verifyPSPIntegrationController.completePaymentJourney)

  // Credentials
  account.get(yourPsp.worldpayCredentialsWithGatewayCheck, permission('gateway-credentials:read'), worldpayCredentialsController.showWorldpayCredentialsPage)
  account.post(yourPsp.worldpayCredentialsWithGatewayCheck, permission('gateway-credentials:read'), worldpayCredentialsController.updateWorldpayCredentials)
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

  account.get(switchPSP.organisationUrl, permission('merchant-details:update'), restrictToStripeAccountContext, organisationUrlController.get)
  account.post(switchPSP.organisationUrl, permission('merchant-details:update'), restrictToStripeAccountContext, organisationUrlController.post)

  // Stripe setup
  account.get([yourPsp.stripeSetup.bankDetails, switchPSP.stripeSetup.bankDetails], permission('stripe-bank-details:update'), restrictToStripeAccountContext, stripeSetupBankDetailsController.get)
  account.post([yourPsp.stripeSetup.bankDetails, switchPSP.stripeSetup.bankDetails], permission('stripe-bank-details:update'), restrictToStripeAccountContext, stripeSetupBankDetailsController.post)
  account.get([yourPsp.stripeSetup.responsiblePerson, switchPSP.stripeSetup.responsiblePerson], permission('stripe-responsible-person:update'), restrictToStripeAccountContext, stripeSetupResponsiblePersonController.get)
  account.post([yourPsp.stripeSetup.responsiblePerson, switchPSP.stripeSetup.responsiblePerson], permission('stripe-responsible-person:update'), restrictToStripeAccountContext, stripeSetupResponsiblePersonController.post)
  account.get([yourPsp.stripeSetup.director, switchPSP.stripeSetup.director], permission('stripe-director:update'), restrictToStripeAccountContext, stripeSetupDirectorController.get)
  account.post([yourPsp.stripeSetup.director, switchPSP.stripeSetup.director], permission('stripe-director:update'), restrictToStripeAccountContext, stripeSetupDirectorController.post)
  account.get([yourPsp.stripeSetup.vatNumber, switchPSP.stripeSetup.vatNumber], permission('stripe-vat-number-company-number:update'), restrictToStripeAccountContext, stripeSetupVatNumberController.get)
  account.post([yourPsp.stripeSetup.vatNumber, switchPSP.stripeSetup.vatNumber], permission('stripe-vat-number-company-number:update'), restrictToStripeAccountContext, stripeSetupVatNumberController.post)
  account.get([yourPsp.stripeSetup.companyNumber, switchPSP.stripeSetup.companyNumber], permission('stripe-vat-number-company-number:update'), restrictToStripeAccountContext, stripeSetupCompanyNumberController.get)
  account.post([yourPsp.stripeSetup.companyNumber, switchPSP.stripeSetup.companyNumber], permission('stripe-vat-number-company-number:update'), restrictToStripeAccountContext, stripeSetupCompanyNumberController.post)
  account.get([yourPsp.stripeSetup.governmentEntityDocument, switchPSP.stripeSetup.governmentEntityDocument], permission('stripe-government-entity-document:update'), restrictToStripeAccountContext, stripeSetupGovernmentEntityDocument.get)
  account.post([yourPsp.stripeSetup.governmentEntityDocument, switchPSP.stripeSetup.governmentEntityDocument], permission('stripe-government-entity-document:update'), restrictToStripeAccountContext, uploadGovernmentEntityDocument, stripeSetupGovernmentEntityDocument.post)
  account.get([yourPsp.stripeSetup.checkOrgDetails, switchPSP.stripeSetup.checkOrgDetails], permission('stripe-organisation-details:update'), restrictToStripeAccountContext, stripeSetupCheckOrgDetailsController.get)
  account.post([yourPsp.stripeSetup.checkOrgDetails, switchPSP.stripeSetup.checkOrgDetails], permission('stripe-organisation-details:update'), restrictToStripeAccountContext, stripeSetupCheckOrgDetailsController.post)
  account.get([yourPsp.stripeSetup.updateOrgDetails, switchPSP.stripeSetup.updateOrgDetails], permission('stripe-organisation-details:update'), restrictToStripeAccountContext, requestToGoLiveOrganisationAddressController.get)
  account.post([yourPsp.stripeSetup.updateOrgDetails, switchPSP.stripeSetup.updateOrgDetails], permission('stripe-organisation-details:update'), restrictToStripeAccountContext, requestToGoLiveOrganisationAddressController.post)

  account.get(stripe.addPspAccountDetails, permission('stripe-account-details:update'), restrictToStripeAccountContext, stripeSetupAddPspAccountDetailsController.get)

  futureAccountStrategy.get(agreements.index, permission('agreements:read'), agreementsController.listAgreements)
  futureAccountStrategy.get(agreements.detail, permission('agreements:read'), agreementsController.agreementDetail)
  futureAccountStrategy.post(agreements.cancel, permission('agreements:update'), agreementsController.cancelAgreement)

  futureAccountStrategy.get(webhooks.index, permission('webhooks:read'), webhooksController.listWebhooksPage)
  futureAccountStrategy.get(webhooks.create, permission('webhooks:update'), webhooksController.createWebhookPage)
  futureAccountStrategy.post(webhooks.create, permission('webhooks:update'), webhooksController.createWebhook)
  futureAccountStrategy.get(webhooks.update, permission('webhooks:update'), webhooksController.updateWebhookPage)
  futureAccountStrategy.post(webhooks.update, permission('webhooks:update'), webhooksController.updateWebhook)
  futureAccountStrategy.get(webhooks.detail, permission('webhooks:read'), webhooksController.webhookDetailPage)
  futureAccountStrategy.get(webhooks.message, permission('webhooks:read'), webhooksController.webhookMessageDetailPage)
  futureAccountStrategy.post(webhooks.resendMessage, permission('webhooks:update'), webhooksController.resendWebhookMessage)
  futureAccountStrategy.get(webhooks.signingSecret, permission('webhooks:update'), webhooksController.signingSecretPage)
  futureAccountStrategy.get(webhooks.toggleActive, permission('webhooks:update'), webhooksController.toggleActivePage)
  futureAccountStrategy.post(webhooks.toggleActive, permission('webhooks:update'), webhooksController.toggleActiveWebhook)

  app.use(paths.account.root, account)
  app.use(paths.service.root, service)
  app.use(paths.futureAccountStrategy.root, futureAccountStrategy)

  // security.txt — https://gds-way.cloudapps.digital/standards/vulnerability-disclosure.html
  const securitytxt = 'https://vdp.cabinetoffice.gov.uk/.well-known/security.txt'
  app.get('/.well-known/security.txt', (req, res) => res.redirect(securitytxt))
  app.get('/security.txt', (req, res) => res.redirect(securitytxt))

  app.all('*', (req, res, next) => {
    if (accountUrls.isLegacyAccountsUrl(req.url)) {
      logger.info('Accounts URL utility forwarding a legacy account URL', {
        url: req.originalUrl,
        session_has_user: !!req.user
      })
      if (!req.user) {
        if (req.session) {
          req.session.last_url = req.url
        }
        res.redirect(user.logIn)
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
