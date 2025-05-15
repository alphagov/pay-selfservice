// -- NOT PAYMENT LINKS RELATED
const { EXPERIMENTAL_FEATURES_FLAG } = process.env
const EXPERIMENTAL_FEATURES = EXPERIMENTAL_FEATURES_FLAG === 'true'
// --

const { Router } = require('express')
const passport = require('passport')

const logger = require('./utils/logger')(__filename)
const response = require('./utils/response.js').response
const generateRoute = require('./utils/generate-route')
const paths = require('./paths')
const accountUrls = require('./utils/gateway-account-urls')

const userIsAuthorised = require('./middleware/user-is-authorised')
const getServiceAndAccount = require('./middleware/get-service-and-gateway-account.middleware')
const { NotFoundError } = require('./errors')

// Middleware
const { enforceUserFirstFactor, redirectLoggedInUser } = require('./services/auth.service')
const trimUsername = require('./middleware/trim-username')
const permission = require('./middleware/permission')
const inviteCookieIsPresent = require('./middleware/invite-cookie-is-present')

// Controllers
const staticController = require('./controllers/static.controller')
const rootController = require('./controllers/root/index.controller')
const transactionsDownloadController = require('./controllers/transactions/transaction-download.controller')
const transactionsListController = require('./controllers/transactions/transaction-list.controller')
const transactionDetailController = require('./controllers/transactions/transaction-detail.controller')
const transactionRefundController = require('./controllers/transactions/transaction-refund.controller')
const transactionDetailRedirectController = require('./controllers/transactions/transaction-detail-redirect.controller')
const loginController = require('./controllers/login')
const forgotPasswordController = require('./controllers/forgotten-password.controller')
const myProfileController = require('@controllers/user/my-profile/my-profile.controller')
const registerController = require('./controllers/subscribe-service.controller')
const createServiceController = require('./controllers/create-service/create-service.controller')
const selectOrgTypeController = require('./controllers/create-service/select-organisation-type/select-organisation-type.controller')
const inviteValidationController = require('./controllers/invite-validation.controller')
const paymentLinksController = require('./controllers/payment-links')
const twoFactorAuthController = require('./controllers/user/two-factor-auth')
const feedbackController = require('./controllers/feedback')
const requestToGoLiveIndexController = require('./controllers/request-to-go-live/index')
const requestToGoLiveOrganisationNameController = require('./controllers/request-to-go-live/organisation-name')
const requestToGoLiveOrganisationAddressController = require('./controllers/request-to-go-live/organisation-address')
const requestToGoLiveChooseHowToProcessPaymentsController = require('./controllers/request-to-go-live/choose-how-to-process-payments')
const requestToGoLiveChooseTakesPaymentsOverPhoneController = require('./controllers/request-to-go-live/choose-takes-payments-over-phone')
const requestToGoLiveAgreementController = require('./controllers/request-to-go-live/agreement')
const stripeTermsAndConditionsController = require('./controllers/stripeTermsAndConditions.controller.js')
const policyDocumentsController = require('./controllers/policy')
const userPhoneNumberController = require('./controllers/user/phone-number')
const allTransactionsController = require('./controllers/all-service-transactions/index')
const payoutsController = require('./controllers/payouts/payout-list.controller')
const requestPspTestAccountController = require('./controllers/request-psp-test-account')
const registrationController = require('./controllers/registration/registration.controller')
const privacyController = require('./controllers/privacy/privacy.controller')
const servicesController = require('./controllers/simplified-account/services')
const homeController = require('./controllers/simplified-account/home')

const simplifiedAccountRoutes = require('./simplified-account-routes')
const { registrationSuccess } = require('@services/auth.service')
const { account: routes } = require('@root/paths')
const formatServiceAndAccountPathsFor = require('@utils/simplified-account/format/format-service-and-account-paths-for')

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
  services,
  staticPaths,
  user,
} = paths
const { dashboard, paymentLinks, prototyping, transactions } = paths.account
const { requestPspTestAccount, requestToGoLive } = paths.service

// Exports
module.exports.generateRoute = generateRoute
module.exports.paths = paths

module.exports.bind = function (app) {
  const account = new Router({ mergeParams: true })
  account.use(getServiceAndAccount, userIsAuthorised)

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
    registrationSuccess,
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

  // My services
  if (EXPERIMENTAL_FEATURES) {
    app.get(services.index, userIsAuthorised, homeController.myServices.get)
  } else {
    app.get(services.index, userIsAuthorised, servicesController.myServices.get)
  }
  app.get(services.index, userIsAuthorised, servicesController.myServices.get)
  app.get(services.create.index, userIsAuthorised, createServiceController.get)
  app.post(services.create.index, userIsAuthorised, createServiceController.post)
  app.post(services.create.selectOrgType, userIsAuthorised, selectOrgTypeController.post)
  app.get(services.create.selectOrgType, userIsAuthorised, selectOrgTypeController.get)

  // All service transactions
  app.get(allServiceTransactions.index, userIsAuthorised, allTransactionsController.getController)
  app.get(allServiceTransactions.indexStatusFilter, userIsAuthorised, allTransactionsController.getController)
  app.get(
    allServiceTransactions.indexStatusFilterWithoutSearch,
    userIsAuthorised,
    allTransactionsController.noAutosearchTransactions
  )
  app.get(allServiceTransactions.download, userIsAuthorised, allTransactionsController.downloadTransactions)
  app.get(allServiceTransactions.downloadStatusFilter, userIsAuthorised, allTransactionsController.downloadTransactions)
  app.get(allServiceTransactions.redirectDetail, userIsAuthorised, transactionDetailRedirectController)

  // demo payment return route
  app.get(demoPaymentFwd.goToTransaction, userIsAuthorised, servicesController.demoPayment.inbound.get)

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
  app.get(user.profile.index, userIsAuthorised, myProfileController.get)
  app.get(user.profile.phoneNumber, userIsAuthorised, userPhoneNumberController.get)
  app.post(user.profile.phoneNumber, userIsAuthorised, userPhoneNumberController.post)

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

  // Request to go live
  service.get(requestToGoLive.index, permission('go-live-stage:read'), requestToGoLiveIndexController.get)
  service.post(requestToGoLive.index, permission('go-live-stage:update'), requestToGoLiveIndexController.post)
  service.get(
    requestToGoLive.organisationName,
    permission('go-live-stage:update'),
    requestToGoLiveOrganisationNameController.get
  )
  service.post(
    requestToGoLive.organisationName,
    permission('go-live-stage:update'),
    requestToGoLiveOrganisationNameController.post
  )
  service.get(
    requestToGoLive.organisationAddress,
    permission('go-live-stage:update'),
    requestToGoLiveOrganisationAddressController.get
  )
  service.post(
    requestToGoLive.organisationAddress,
    permission('go-live-stage:update'),
    requestToGoLiveOrganisationAddressController.post
  )
  service.get(
    requestToGoLive.chooseHowToProcessPayments,
    permission('go-live-stage:update'),
    requestToGoLiveChooseHowToProcessPaymentsController.get
  )
  service.post(
    requestToGoLive.chooseHowToProcessPayments,
    permission('go-live-stage:update'),
    requestToGoLiveChooseHowToProcessPaymentsController.post
  )
  service.get(
    requestToGoLive.chooseTakesPaymentsOverPhone,
    permission('go-live-stage:update'),
    requestToGoLiveChooseTakesPaymentsOverPhoneController.get
  )
  service.post(
    requestToGoLive.chooseTakesPaymentsOverPhone,
    permission('go-live-stage:update'),
    requestToGoLiveChooseTakesPaymentsOverPhoneController.post
  )
  service.get(requestToGoLive.agreement, permission('go-live-stage:update'), requestToGoLiveAgreementController.get)
  service.post(requestToGoLive.agreement, permission('go-live-stage:update'), requestToGoLiveAgreementController.post)

  // Request Stripe test account
  service.get(requestPspTestAccount, permission('psp-test-account-stage:update'), requestPspTestAccountController.get)
  service.post(requestPspTestAccount, permission('psp-test-account-stage:update'), requestPspTestAccountController.post)

  // ----------------------------
  // GATEWAY ACCOUNT LEVEL ROUTES
  // ----------------------------

  // Dashboard
  // TODO: remove this redirect once all service views are migrated to service/acct model
  account.get(dashboard.index, (req, res, next) => {
    return res.redirect(
      301,
      formatServiceAndAccountPathsFor(paths.simplifiedAccount.dashboard.index, req.service.externalId, req.account.type)
    )
  })

  // Transactions
  account.get(transactions.index, permission('transactions:read'), transactionsListController)
  account.get(transactions.download, permission('transactions-download:read'), transactionsDownloadController)
  account.get(transactions.detail, permission('transactions-details:read'), transactionDetailController)
  account.post(transactions.refund, permission('refunds:create'), transactionRefundController)

  // Settings
  app.use(paths.simplifiedAccount.root, simplifiedAccountRoutes)

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
  account.get(
    paymentLinks.addMetadata,
    permission('tokens:create'),
    paymentLinksController.getAddReportingColumn.showAddMetadataPage
  )
  account.get(
    paymentLinks.editMetadata,
    permission('tokens:create'),
    paymentLinksController.getAddReportingColumn.showEditMetadataPage
  )
  account.post(
    paymentLinks.addMetadata,
    permission('tokens:create'),
    paymentLinksController.postUpdateReportingColumn.addMetadata
  )
  account.post(
    paymentLinks.editMetadata,
    permission('tokens:create'),
    paymentLinksController.postUpdateReportingColumn.editMetadata
  )
  account.post(
    paymentLinks.deleteMetadata,
    permission('tokens:create'),
    paymentLinksController.postUpdateReportingColumn.deleteMetadata
  )

  account.get(paymentLinks.manage.index, permission('transactions:read'), paymentLinksController.getManage)
  account.get(paymentLinks.manage.disable, permission('tokens:create'), paymentLinksController.getDisable)
  account.get(paymentLinks.manage.delete, permission('tokens:create'), paymentLinksController.deleteLink.get)
  account.post(paymentLinks.manage.delete, permission('tokens:create'), paymentLinksController.deleteLink.post)
  account.get(paymentLinks.manage.edit, permission('tokens:create'), paymentLinksController.getEdit)
  account.post(paymentLinks.manage.edit, permission('tokens:create'), paymentLinksController.postEdit)
  account.get(
    paymentLinks.manage.editInformation,
    permission('tokens:create'),
    paymentLinksController.getEditInformation
  )
  account.post(
    paymentLinks.manage.editInformation,
    permission('tokens:create'),
    paymentLinksController.postEditInformation
  )
  account.get(paymentLinks.manage.editReference, permission('tokens:create'), paymentLinksController.getEditReference)
  account.post(paymentLinks.manage.editReference, permission('tokens:create'), paymentLinksController.postEditReference)
  account.get(paymentLinks.manage.editAmount, permission('tokens:create'), paymentLinksController.getEditAmount)
  account.post(paymentLinks.manage.editAmount, permission('tokens:create'), paymentLinksController.postEditAmount)
  account.get(
    paymentLinks.manage.addMetadata,
    permission('tokens:create'),
    paymentLinksController.getAddReportingColumn.showAddMetadataPage
  )
  account.post(
    paymentLinks.manage.addMetadata,
    permission('tokens:create'),
    paymentLinksController.postUpdateReportingColumn.addMetadata
  )
  account.get(
    paymentLinks.manage.editMetadata,
    permission('tokens:create'),
    paymentLinksController.getAddReportingColumn.showEditMetadataPage
  )
  account.post(
    paymentLinks.manage.editMetadata,
    permission('tokens:create'),
    paymentLinksController.postUpdateReportingColumn.editMetadata
  )
  account.post(
    paymentLinks.manage.deleteMetadata,
    permission('tokens:create'),
    paymentLinksController.postUpdateReportingColumn.deleteMetadata
  )

  app.use(paths.account.root, account)
  app.use(paths.service.root, service)

  // security.txt — https://gds-way.cloudapps.digital/standards/vulnerability-disclosure.html
  const securitytxt = 'https://vdp.cabinetoffice.gov.uk/.well-known/security.txt'
  app.get('/.well-known/security.txt', (req, res) => res.redirect(securitytxt))
  app.get('/security.txt', (req, res) => res.redirect(securitytxt))

  app.all('*', (req, res, next) => {
    if (accountUrls.isLegacyAccountsUrl(req.url)) {
      logger.info('Accounts URL utility forwarding a legacy account URL', {
        url: req.originalUrl,
        session_has_user: !!req.user,
      })
      if (!req.user) {
        if (req.session) {
          req.session.last_url = req.url
        }
        res.redirect(user.logIn)
        return
      }

      res.redirect(services.index)
      return
    }
    logger.info('Page not found', {
      url: req.originalUrl,
    })
    next(new NotFoundError('Route not found'))
  })
}
