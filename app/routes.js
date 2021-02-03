'use strict'

const { Router } = require('express')
const lodash = require('lodash')

const logger = require('./utils/logger')(__filename)
const response = require('./utils/response.js').response
const generateRoute = require('./utils/generate-route')
const paths = require('./paths.js')
const accountUrls = require('./utils/gateway-account-urls')

const userIsAuthorised = require('./middleware/user-is-authorised')
const getServiceAndAccount = require('./middleware/get-service-and-gateway-account.middleware')

// Middleware
const { lockOutDisabledUsers, enforceUserAuthenticated, enforceUserFirstFactor, redirectLoggedInUser } = require('./services/auth.service')
const getAccount = require('./middleware/get-gateway-account')
const hasServices = require('./middleware/has-services')
const resolveService = require('./middleware/resolve-service')
const trimUsername = require('./middleware/trim-username')
const permission = require('./middleware/permission')
const correlationIdMiddleware = require('./middleware/correlation-id')
const getRequestContext = require('./middleware/get-request-context').middleware
const restrictToSandbox = require('./middleware/restrict-to-sandbox')
const restrictToLiveStripeAccount = require('./middleware/stripe-setup/restrict-to-live-stripe-account')

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
const yourPspController = require('./controllers/your-psp')
const allTransactionsController = require('./controllers/all-service-transactions/index')
const payoutsController = require('./controllers/payouts/payout-list.controller')
const stripeSetupDashboardRedirectController = require('./controllers/stripe-setup/stripe-setup-link')

// Assignments
const {
  registerUser, user, selfCreateService,
  serviceSwitcher, teamMembers, staticPaths, inviteValidation, editServiceName, merchantDetails,
  requestToGoLive, policyPages,
  allServiceTransactions, payouts, redirects, index
} = paths
const {
  apiKeys,
  credentials,
  dashboard,
  digitalWallet,
  emailNotifications,
  notificationCredentials,
  paymentLinks,
  paymentTypes,
  prototyping,
  settings,
  stripe,
  stripeSetup,
  toggle3ds,
  toggleBillingAddress,
  toggleMotoMaskCardNumberAndSecurityCode,
  transactions,
  yourPsp
} = paths.account

// Exports
module.exports.generateRoute = generateRoute
module.exports.paths = paths

module.exports.bind = function (app) {
  const account = new Router({ mergeParams: true })
  account.use(getServiceAndAccount, userIsAuthorised)

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
  app.get(registerUser.subscribeService, registerController.subscribeService)
  app.post(registerUser.registration, registerController.submitRegistration)
  app.get(registerUser.otpVerify, registerController.showOtpVerify)
  app.post(registerUser.otpVerify, registerController.submitOtpVerify)
  app.get(registerUser.reVerifyPhone, registerController.showReVerifyPhone)
  app.post(registerUser.reVerifyPhone, registerController.submitReVerifyPhone)
  app.get(registerUser.logUserIn, loginController.loginAfterRegister, enforceUserAuthenticated, hasServices, resolveService, getAccount, dashboardController.dashboardActivity)

  // LOGIN
  app.get(user.logIn, redirectLoggedInUser, loginController.loginGet)
  app.post(user.logIn, trimUsername, loginController.loginUser, hasServices, resolveService, getAccount, loginController.postLogin)
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
  app.get(selfCreateService.logUserIn, loginController.loginAfterRegister, enforceUserAuthenticated, getAccount, selfCreateServiceController.loggedIn)
  app.get(selfCreateService.serviceNaming, enforceUserAuthenticated, hasServices, getAccount, selfCreateServiceController.showNameYourService)
  app.post(selfCreateService.serviceNaming, enforceUserAuthenticated, hasServices, getAccount, selfCreateServiceController.submitYourServiceName)

  // ----------------------
  // AUTHENTICATED ROUTES
  // ----------------------

  const authenticatedPaths = [
    ...lodash.values(allServiceTransactions),
    ...lodash.values(editServiceName),
    ...lodash.values(serviceSwitcher),
    ...lodash.values(teamMembers),
    ...lodash.values(merchantDetails),
    ...lodash.values(user.profile),
    ...lodash.values(requestToGoLive),
    ...lodash.values(policyPages),
    ...lodash.values(payouts),
    ...lodash.values(redirects),
    paths.feedback
  ] // Extract all the authenticated paths as a single array

  app.use(authenticatedPaths, enforceUserAuthenticated) // Enforce authentication on all get requests
  app.use(authenticatedPaths.filter(item => !lodash.values(serviceSwitcher).includes(item)), hasServices) // Require services everywhere but the switcher page

  // Site index - redirect to dashboard for last visited account
  app.get(index, enforceUserAuthenticated, hasServices, resolveService, getAccount, dashboardController.redirectToDashboard)

  // -------------------------
  // OUTSIDE OF SERVICE ROUTES
  // -------------------------

  // Service switcher
  app.get(serviceSwitcher.index, myServicesController.getIndex)
  app.post(serviceSwitcher.switch, myServicesController.postIndex)
  app.get(serviceSwitcher.create, createServiceController.get)
  app.post(serviceSwitcher.create, createServiceController.post)

  // All service transactions
  app.get(allServiceTransactions.index, allTransactionsController.getController)
  app.get(allServiceTransactions.download, allTransactionsController.downloadTransactions)
  app.get(allServiceTransactions.redirectDetail, transactionDetailRedirectController)

  // Payouts
  app.get(payouts.list, payoutsController.listAllServicesPayouts)

  // Policy document downloads
  app.get(policyPages.download, policyDocumentsController.download)

  // Feedback
  app.get(paths.feedback, feedbackController.getIndex)
  app.post(paths.feedback, feedbackController.postIndex)

  // User profile
  app.get(user.profile.index, enforceUserAuthenticated, serviceUsersController.profile)
  app.get(user.profile.phoneNumber, userPhoneNumberController.get)
  app.post(user.profile.phoneNumber, userPhoneNumberController.post)

  // Configure 2FA
  app.get(user.profile.twoFactorAuth.index, twoFactorAuthController.getIndex)
  app.post(user.profile.twoFactorAuth.index, twoFactorAuthController.postIndex)
  app.get(user.profile.twoFactorAuth.configure, twoFactorAuthController.getConfigure)
  app.post(user.profile.twoFactorAuth.configure, twoFactorAuthController.postConfigure)
  app.post(user.profile.twoFactorAuth.resend, twoFactorAuthController.postResend)

  // --------------------
  // SERVICE LEVEL ROUTES
  // --------------------

  // Edit service name
  app.get(editServiceName.index, permission('service-name:update'), editServiceNameController.get)
  app.post(editServiceName.update, permission('service-name:update'), editServiceNameController.post)

  // Team members
  app.get(teamMembers.index, resolveService, serviceUsersController.index)
  app.get(teamMembers.show, permission('users-service:read'), serviceUsersController.show)
  app.get(teamMembers.permissions, permission('users-service:create'), serviceRolesUpdateController.index)
  app.post(teamMembers.permissions, permission('users-service:create'), serviceRolesUpdateController.update)
  app.post(teamMembers.delete, permission('users-service:delete'), serviceUsersController.delete)

  // Invite team member
  app.get(teamMembers.invite, permission('users-service:create'), inviteUserController.index)
  app.post(teamMembers.invite, permission('users-service:create'), inviteUserController.invite)

  // Merchant details
  app.get(merchantDetails.index, permission('merchant-details:read'), merchantDetailsController.getIndex)
  app.get(merchantDetails.edit, permission('merchant-details:update'), merchantDetailsController.getEdit)
  app.post(merchantDetails.edit, permission('merchant-details:update'), merchantDetailsController.postEdit)

  // Request to go live
  app.get(requestToGoLive.index, permission('go-live-stage:read'), requestToGoLiveIndexController.get)
  app.post(requestToGoLive.index, permission('go-live-stage:update'), requestToGoLiveIndexController.post)
  app.get(requestToGoLive.organisationName, permission('go-live-stage:update'), requestToGoLiveOrganisationNameController.get)
  app.post(requestToGoLive.organisationName, permission('go-live-stage:update'), requestToGoLiveOrganisationNameController.post)
  app.get(requestToGoLive.organisationAddress, permission('go-live-stage:update'), requestToGoLiveOrganisationAddressController.get)
  app.post(requestToGoLive.organisationAddress, permission('go-live-stage:update'), requestToGoLiveOrganisationAddressController.post)
  app.get(requestToGoLive.chooseHowToProcessPayments, permission('go-live-stage:update'), requestToGoLiveChooseHowToProcessPaymentsController.get)
  app.post(requestToGoLive.chooseHowToProcessPayments, permission('go-live-stage:update'), requestToGoLiveChooseHowToProcessPaymentsController.post)
  app.get(requestToGoLive.agreement, permission('go-live-stage:update'), requestToGoLiveAgreementController.get)
  app.post(requestToGoLive.agreement, permission('go-live-stage:update'), requestToGoLiveAgreementController.post)

  // Service live account dashboard link
  app.get(redirects.stripeSetupLiveDashboardRedirect, stripeSetupDashboardRedirectController.get)

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

  // Credentials
  account.get(credentials.index, permission('gateway-credentials:read'), credentialsController.index)
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
  account.get(emailNotifications.index, permission('email-notification-template:read'), emailNotificationsController.index)
  account.get(emailNotifications.indexRefundTabEnabled, permission('email-notification-template:read'), emailNotificationsController.indexRefundTabEnabled)
  account.get(emailNotifications.edit, permission('email-notification-paragraph:update'), emailNotificationsController.edit)
  account.post(emailNotifications.confirm, permission('email-notification-paragraph:update'), emailNotificationsController.confirm)
  account.post(emailNotifications.update, permission('email-notification-paragraph:update'), emailNotificationsController.update)
  account.get(emailNotifications.collection, permission('email-notification-template:read'), emailNotificationsController.collectionEmailIndex)
  account.post(emailNotifications.collection, permission('email-notification-toggle:update'), emailNotificationsController.collectionEmailUpdate)
  account.get(emailNotifications.confirmation, permission('email-notification-template:read'), emailNotificationsController.confirmationEmailIndex)
  account.post(emailNotifications.confirmation, permission('email-notification-toggle:update'), emailNotificationsController.confirmationEmailUpdate)
  account.post(emailNotifications.off, permission('email-notification-toggle:update'), emailNotificationsController.confirmationEmailOff)
  account.post(emailNotifications.on, permission('email-notification-toggle:update'), emailNotificationsController.confirmationEmailOn)
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

  // Prototype links
  account.get(prototyping.demoService.index, permission('transactions:read'), restrictToSandbox, testWithYourUsersController.index)
  account.get(prototyping.demoService.links, permission('transactions:read'), restrictToSandbox, testWithYourUsersController.links)
  account.get(prototyping.demoService.create, permission('transactions:read'), restrictToSandbox, testWithYourUsersController.create)
  account.post(prototyping.demoService.confirm, permission('transactions:read'), restrictToSandbox, testWithYourUsersController.submit)
  account.get(prototyping.demoService.disable, permission('transactions:read'), restrictToSandbox, testWithYourUsersController.disable)

  account.get(prototyping.demoPayment.index, permission('transactions:read'), restrictToSandbox, makeADemoPaymentController.index)
  account.post(prototyping.demoPayment.index, permission('transactions:read'), restrictToSandbox, makeADemoPaymentController.index)
  account.get(prototyping.demoPayment.editDescription, permission('transactions:read'), restrictToSandbox, makeADemoPaymentController.edit)
  account.get(prototyping.demoPayment.editAmount, permission('transactions:read'), restrictToSandbox, makeADemoPaymentController.edit)
  account.get(prototyping.demoPayment.mockCardDetails, permission('transactions:read'), restrictToSandbox, makeADemoPaymentController.mockCardDetails)
  account.post(prototyping.demoPayment.goToPaymentScreens, permission('transactions:read'), restrictToSandbox, makeADemoPaymentController.goToPayment)

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

  // Stripe setup
  account.get(stripeSetup.bankDetails, permission('stripe-bank-details:update'), restrictToLiveStripeAccount, stripeSetupBankDetailsController.get)
  account.post(stripeSetup.bankDetails, permission('stripe-bank-details:update'), restrictToLiveStripeAccount, stripeSetupBankDetailsController.post)
  account.get(stripeSetup.responsiblePerson, permission('stripe-responsible-person:update'), restrictToLiveStripeAccount, stripeSetupResponsiblePersonController.get)
  account.post(stripeSetup.responsiblePerson, permission('stripe-responsible-person:update'), restrictToLiveStripeAccount, stripeSetupResponsiblePersonController.post)
  account.get(stripeSetup.vatNumber, permission('stripe-vat-number-company-number:update'), restrictToLiveStripeAccount, stripeSetupVatNumberController.get)
  account.post(stripeSetup.vatNumber, permission('stripe-vat-number-company-number:update'), restrictToLiveStripeAccount, stripeSetupVatNumberController.post)
  account.get(stripeSetup.companyNumber, permission('stripe-vat-number-company-number:update'), restrictToLiveStripeAccount, stripeSetupCompanyNumberController.get)
  account.post(stripeSetup.companyNumber, permission('stripe-vat-number-company-number:update'), restrictToLiveStripeAccount, stripeSetupCompanyNumberController.post)
  account.get(stripe.addPspAccountDetails, permission('stripe-account-details:update'), restrictToLiveStripeAccount, stripeSetupAddPspAccountDetailsController.get)

  app.use(paths.account.root, account)

  app.all('*', (req, res) => {
    if (accountUrls.isLegacyAccountsUrl(req.url)) {
      if (req.user) {
        const currentSessionAccountExternalId = req.gateway_account && req.gateway_account.currentGatewayAccountExternalId
        if (currentSessionAccountExternalId) {
          const upgradedPath = accountUrls.getUpgradedAccountStructureUrl(req.url, currentSessionAccountExternalId)
          logger.info('Accounts URL utility upgraded a request to a legacy account URL', {
            url: req.originalUrl,
            redirected_url: upgradedPath,
            session_has_user: !!req.user,
            is_internal_user: req.user && req.user.internalUser
          })
          res.redirect(upgradedPath)
          return
        }
      } else {
        if (req.session) {
          req.session.last_url = req.url
        }
        res.redirect(user.logIn)
        return
      }
    }
    logger.info('Page not found', {
      url: req.originalUrl
    })
    res.status(404)
    res.render('404')
  })
}
