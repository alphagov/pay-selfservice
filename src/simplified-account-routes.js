const multer = require('multer')
const { Router } = require('express')
const {
  simplifiedAccountStrategy,
  stripeAccountSetupStrategy,
  enforceEmailCollectionModeNotOff,
  enforceLiveAccountOnly,
  enforcePaymentProviderType,
  enforceMotoAccountOnly,
  defaultViewDecider,
  pspSwitchRedirect,
  canStartPspPaymentVerificationTask
} = require('@middleware/simplified-account')
const restrictToSwitchingAccount = require('@middleware/restrict-to-switching-account')
const userIsAuthorised = require('@middleware/user-is-authorised')
const permission = require('@middleware/permission')
const paths = require('./paths')
const serviceSettingsController = require('@controllers/simplified-account/settings')
const { STRIPE, WORLDPAY } = require('@models/constants/payment-providers')
const {
  GOV_ENTITY_DOC_FORM_FIELD_NAME,
} = require('@controllers/simplified-account/settings/stripe-details/government-entity-document/constants')
const formatServiceAndAccountPathsFor = require('@utils/simplified-account/format/format-service-and-account-paths-for')

const upload = multer({ storage: multer.memoryStorage() })
const simplifiedAccount = new Router({ mergeParams: true })

simplifiedAccount.use(simplifiedAccountStrategy, userIsAuthorised)

// settings index
simplifiedAccount.get(paths.simplifiedAccount.settings.index, defaultViewDecider)

// service name
simplifiedAccount.get(
  paths.simplifiedAccount.settings.serviceName.index,
  enforceLiveAccountOnly,
  permission('service-name:update'),
  serviceSettingsController.serviceName.get
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.serviceName.edit,
  enforceLiveAccountOnly,
  permission('service-name:update'),
  serviceSettingsController.serviceName.edit.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.serviceName.edit,
  enforceLiveAccountOnly,
  permission('service-name:update'),
  serviceSettingsController.serviceName.edit.post
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.serviceName.removeCy,
  enforceLiveAccountOnly,
  permission('service-name:update'),
  serviceSettingsController.serviceName.removeWelshServiceName.post
)

// team members
simplifiedAccount.get(
  paths.simplifiedAccount.settings.teamMembers.index,
  permission('transactions:read'),
  serviceSettingsController.teamMembers.get
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.teamMembers.delete,
  permission('users-service:delete'),
  serviceSettingsController.teamMembers.removeUser.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.teamMembers.delete,
  permission('users-service:delete'),
  serviceSettingsController.teamMembers.removeUser.post
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.teamMembers.permission,
  permission('users-service:create'),
  serviceSettingsController.teamMembers.changePermission.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.teamMembers.permission,
  permission('users-service:create'),
  serviceSettingsController.teamMembers.changePermission.post
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.teamMembers.invite,
  permission('users-service:create'),
  serviceSettingsController.teamMembers.invite.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.teamMembers.invite,
  permission('users-service:create'),
  serviceSettingsController.teamMembers.invite.post
)

// email notifications
simplifiedAccount.get(
  paths.simplifiedAccount.settings.emailNotifications.index,
  permission('transactions:read'),
  serviceSettingsController.emailNotifications.get
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.emailNotifications.emailCollectionMode,
  permission('email-notification-toggle:update'),
  serviceSettingsController.emailNotifications.emailCollectionMode.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.emailNotifications.emailCollectionMode,
  permission('email-notification-toggle:update'),
  serviceSettingsController.emailNotifications.emailCollectionMode.post
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.emailNotifications.refundEmailToggle,
  enforceEmailCollectionModeNotOff,
  permission('email-notification-toggle:update'),
  serviceSettingsController.emailNotifications.refundEmails.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.emailNotifications.refundEmailToggle,
  enforceEmailCollectionModeNotOff,
  permission('email-notification-toggle:update'),
  serviceSettingsController.emailNotifications.refundEmails.post
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.emailNotifications.paymentConfirmationEmailToggle,
  enforceEmailCollectionModeNotOff,
  permission('email-notification-toggle:update'),
  serviceSettingsController.emailNotifications.paymentConfirmationEmails.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.emailNotifications.paymentConfirmationEmailToggle,
  enforceEmailCollectionModeNotOff,
  permission('email-notification-toggle:update'),
  serviceSettingsController.emailNotifications.paymentConfirmationEmails.post
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.emailNotifications.templates,
  permission('email-notification-template:read'),
  serviceSettingsController.emailNotifications.templates.get
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.emailNotifications.customParagraph,
  permission('email-notification-paragraph:update'),
  serviceSettingsController.emailNotifications.customParagraph.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.emailNotifications.customParagraph,
  permission('email-notification-paragraph:update'),
  serviceSettingsController.emailNotifications.customParagraph.postEditCustomParagraph
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.emailNotifications.removeCustomParagraph,
  permission('email-notification-paragraph:update'),
  serviceSettingsController.emailNotifications.customParagraph.postRemoveCustomParagraph
)

// organisation details
simplifiedAccount.get(
  paths.simplifiedAccount.settings.organisationDetails.index,
  enforceLiveAccountOnly,
  permission('merchant-details:read'),
  serviceSettingsController.organisationDetails.get
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.organisationDetails.edit,
  enforceLiveAccountOnly,
  permission('merchant-details:update'),
  serviceSettingsController.organisationDetails.edit.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.organisationDetails.edit,
  enforceLiveAccountOnly,
  permission('merchant-details:update'),
  serviceSettingsController.organisationDetails.edit.post
)

// card types
simplifiedAccount.get(
  paths.simplifiedAccount.settings.cardTypes.index,
  permission('transactions:read'),
  serviceSettingsController.cardTypes.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.cardTypes.index,
  permission('payment-types:update'),
  serviceSettingsController.cardTypes.post
)

// card payments
simplifiedAccount.get(
  paths.simplifiedAccount.settings.cardPayments.index,
  permission('payment-types:read'),
  serviceSettingsController.cardPayments.get
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.cardPayments.collectBillingAddress,
  permission('payment-types:update'),
  serviceSettingsController.cardPayments.collectBillingAddress.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.cardPayments.collectBillingAddress,
  permission('payment-types:update'),
  serviceSettingsController.cardPayments.collectBillingAddress.post
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.cardPayments.defaultBillingAddressCountry,
  permission('payment-types:update'),
  serviceSettingsController.cardPayments.defaultBillingAddressCountry.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.cardPayments.defaultBillingAddressCountry,
  permission('payment-types:update'),
  serviceSettingsController.cardPayments.defaultBillingAddressCountry.post
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.cardPayments.applePay,
  permission('payment-types:update'),
  serviceSettingsController.cardPayments.applePay.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.cardPayments.applePay,
  permission('payment-types:update'),
  serviceSettingsController.cardPayments.applePay.post
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.cardPayments.googlePay,
  permission('payment-types:update'),
  serviceSettingsController.cardPayments.googlePay.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.cardPayments.googlePay,
  permission('payment-types:update'),
  serviceSettingsController.cardPayments.googlePay.post
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.cardPayments.motoSecurity.hideCardNumber,
  enforceMotoAccountOnly,
  permission('payment-types:update'),
  serviceSettingsController.cardPayments.motoSecurity.hideCardNumber.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.cardPayments.motoSecurity.hideCardNumber,
  enforceMotoAccountOnly,
  permission('payment-types:update'),
  serviceSettingsController.cardPayments.motoSecurity.hideCardNumber.post
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.cardPayments.motoSecurity.hideCardSecurityCode,
  enforceMotoAccountOnly,
  permission('payment-types:update'),
  serviceSettingsController.cardPayments.motoSecurity.hideCardSecurityCode.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.cardPayments.motoSecurity.hideCardSecurityCode,
  enforceMotoAccountOnly,
  permission('payment-types:update'),
  serviceSettingsController.cardPayments.motoSecurity.hideCardSecurityCode.post
)

// worldpay details
simplifiedAccount.get(
  paths.simplifiedAccount.settings.worldpayDetails.index,
  enforcePaymentProviderType(WORLDPAY),
  permission('gateway-credentials:read'),
  serviceSettingsController.worldpayDetails.get
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.worldpayDetails.oneOffCustomerInitiated,
  enforcePaymentProviderType(WORLDPAY),
  permission('gateway-credentials:update'),
  serviceSettingsController.worldpayDetails.oneOffCustomerInitiatedCredentials.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.worldpayDetails.oneOffCustomerInitiated,
  enforcePaymentProviderType(WORLDPAY),
  permission('gateway-credentials:update'),
  serviceSettingsController.worldpayDetails.oneOffCustomerInitiatedCredentials.post
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.worldpayDetails.flexCredentials,
  enforcePaymentProviderType(WORLDPAY),
  permission('gateway-credentials:update'),
  serviceSettingsController.worldpayDetails.flexCredentials.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.worldpayDetails.flexCredentials,
  enforcePaymentProviderType(WORLDPAY),
  permission('gateway-credentials:update'),
  serviceSettingsController.worldpayDetails.flexCredentials.post
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.worldpayDetails.recurringCustomerInitiated,
  enforcePaymentProviderType(WORLDPAY),
  permission('gateway-credentials:update'),
  serviceSettingsController.worldpayDetails.recurringCustomerInitiatedCredentials.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.worldpayDetails.recurringCustomerInitiated,
  enforcePaymentProviderType(WORLDPAY),
  permission('gateway-credentials:update'),
  serviceSettingsController.worldpayDetails.recurringCustomerInitiatedCredentials.post
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.worldpayDetails.recurringMerchantInitiated,
  enforcePaymentProviderType(WORLDPAY),
  permission('gateway-credentials:update'),
  serviceSettingsController.worldpayDetails.recurringMerchantInitiatedCredentials.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.worldpayDetails.recurringMerchantInitiated,
  enforcePaymentProviderType(WORLDPAY),
  permission('gateway-credentials:update'),
  serviceSettingsController.worldpayDetails.recurringMerchantInitiatedCredentials.post
)

// card types
simplifiedAccount.get(
  paths.simplifiedAccount.settings.cardTypes.index,
  permission('transactions:read'),
  serviceSettingsController.cardTypes.get
)

// api keys
simplifiedAccount.get(
  paths.simplifiedAccount.settings.apiKeys.index,
  permission('tokens-active:read'),
  serviceSettingsController.apiKeys.get
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.apiKeys.create.index,
  permission('tokens:create'),
  serviceSettingsController.apiKeys.create.createKey.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.apiKeys.create.index,
  permission('tokens:create'),
  serviceSettingsController.apiKeys.create.createKey.post
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.apiKeys.create.newKeyDetails,
  permission('tokens:create'),
  serviceSettingsController.apiKeys.create.newKeyDetails.get
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.apiKeys.edit.changeName,
  permission('tokens:update'),
  serviceSettingsController.apiKeys.edit.changeName.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.apiKeys.edit.changeName,
  permission('tokens:update'),
  serviceSettingsController.apiKeys.edit.changeName.post
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.apiKeys.revoke.index,
  permission('tokens:delete'),
  serviceSettingsController.apiKeys.revoke.revokeKey.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.apiKeys.revoke.index,
  permission('tokens:delete'),
  serviceSettingsController.apiKeys.revoke.revokeKey.post
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.apiKeys.revoke.revokedKeys,
  permission('tokens-revoked:read'),
  serviceSettingsController.apiKeys.revoke.revokedKeys.get
)

// webhooks
simplifiedAccount.get(
  paths.simplifiedAccount.settings.webhooks.index,
  permission('webhooks:read'),
  serviceSettingsController.webhooks.get
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.webhooks.create,
  permission('webhooks:update'),
  serviceSettingsController.webhooks.create.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.webhooks.create,
  permission('webhooks:update'),
  serviceSettingsController.webhooks.create.post
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.webhooks.detail,
  permission('webhooks:read'),
  serviceSettingsController.webhooks.detail.get
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.webhooks.event,
  permission('webhooks:read'),
  serviceSettingsController.webhooks.event.get
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.webhooks.update,
  permission('webhooks:update'),
  serviceSettingsController.webhooks.update.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.webhooks.update,
  permission('webhooks:update'),
  serviceSettingsController.webhooks.update.post
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.webhooks.toggle,
  permission('webhooks:update'),
  serviceSettingsController.webhooks.toggle.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.webhooks.toggle,
  permission('webhooks:update'),
  serviceSettingsController.webhooks.toggle.post
)

// switch psp
simplifiedAccount.get(
  paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index,
  restrictToSwitchingAccount,
  permission('gateway-credentials:update'),
  serviceSettingsController.switchPsp.switchToWorldpay.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index,
  restrictToSwitchingAccount,
  permission('gateway-credentials:update'),
  serviceSettingsController.switchPsp.switchToWorldpay.post
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.oneOffCustomerInitiated,
  restrictToSwitchingAccount,
  permission('gateway-credentials:update'),
  serviceSettingsController.switchPsp.switchToWorldpay.oneOffCustomerInitiated.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.oneOffCustomerInitiated,
  restrictToSwitchingAccount,
  permission('gateway-credentials:update'),
  serviceSettingsController.switchPsp.switchToWorldpay.oneOffCustomerInitiated.post
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.flexCredentials,
  restrictToSwitchingAccount,
  permission('gateway-credentials:update'),
  serviceSettingsController.switchPsp.switchToWorldpay.flexCredentials.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.flexCredentials,
  restrictToSwitchingAccount,
  permission('gateway-credentials:update'),
  serviceSettingsController.switchPsp.switchToWorldpay.flexCredentials.post
)

simplifiedAccount.get(
  paths.simplifiedAccount.settings.switchPsp.switchToStripe.index,
  restrictToSwitchingAccount,
  permission('gateway-credentials:update'),
  serviceSettingsController.switchPsp.switchToStripe.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.switchPsp.switchToStripe.index,
  restrictToSwitchingAccount,
  permission('gateway-credentials:update'),
  serviceSettingsController.switchPsp.switchToStripe.post
)

simplifiedAccount.get(
  paths.simplifiedAccount.settings.switchPsp.makeTestPayment.outbound,
  restrictToSwitchingAccount,
  permission('gateway-credentials:update'),
  canStartPspPaymentVerificationTask,
  serviceSettingsController.switchPsp.makeTestPayment.get
)
simplifiedAccount.post(
  paths.simplifiedAccount.settings.switchPsp.makeTestPayment.outbound,
  restrictToSwitchingAccount,
  permission('gateway-credentials:update'),
  canStartPspPaymentVerificationTask,
  serviceSettingsController.switchPsp.makeTestPayment.post
)
simplifiedAccount.get(
  paths.simplifiedAccount.settings.switchPsp.makeTestPayment.inbound,
  restrictToSwitchingAccount,
  permission('gateway-credentials:update'),
  canStartPspPaymentVerificationTask,
  serviceSettingsController.switchPsp.makeTestPayment.getInbound,
  pspSwitchRedirect
)

// stripe details
const stripeDetailsPath = paths.simplifiedAccount.settings.stripeDetails
const switchToStripePath = paths.simplifiedAccount.settings.switchPsp.switchToStripe
const stripeDetailsRouter = new Router({ mergeParams: true }).use(
  enforceLiveAccountOnly,
  enforcePaymentProviderType(STRIPE),
  permission('stripe-account-details:update'),
  stripeAccountSetupStrategy
)
stripeDetailsRouter.get(stripeDetailsPath.index, ((req, res, next) => {
  // only in the case of Stripe do we reuse the details routes when switching PSP, however we still want to return to the switching page
  if (req.account.isSwitchingToProvider(STRIPE)) {
    return res.redirect(formatServiceAndAccountPathsFor(paths.simplifiedAccount.settings.switchPsp.switchToStripe.index, req.service.externalId, req.account.type))
  }
  next()
}), serviceSettingsController.stripeDetails.get)
stripeDetailsRouter.get(stripeDetailsPath.accountDetails, serviceSettingsController.stripeDetails.getAccountDetails)

stripeDetailsRouter.get(stripeDetailsPath.bankDetails, serviceSettingsController.stripeDetails.bankDetails.get)
stripeDetailsRouter.post(stripeDetailsPath.bankDetails, serviceSettingsController.stripeDetails.bankDetails.post)

stripeDetailsRouter.get(stripeDetailsPath.companyNumber, serviceSettingsController.stripeDetails.companyNumber.get)
stripeDetailsRouter.post(stripeDetailsPath.companyNumber, serviceSettingsController.stripeDetails.companyNumber.post)

stripeDetailsRouter.get(
  stripeDetailsPath.organisationDetails.index,
  serviceSettingsController.stripeDetails.organisationDetails.get
)
stripeDetailsRouter.post(
  stripeDetailsPath.organisationDetails.index,
  serviceSettingsController.stripeDetails.organisationDetails.post
)
stripeDetailsRouter.get(
  stripeDetailsPath.organisationDetails.update,
  serviceSettingsController.stripeDetails.organisationDetails.update.get
)
stripeDetailsRouter.post(
  stripeDetailsPath.organisationDetails.update,
  serviceSettingsController.stripeDetails.organisationDetails.update.post
)

stripeDetailsRouter.get(
  stripeDetailsPath.responsiblePerson.index,
  serviceSettingsController.stripeDetails.responsiblePerson.get
)
stripeDetailsRouter.post(
  stripeDetailsPath.responsiblePerson.index,
  serviceSettingsController.stripeDetails.responsiblePerson.post
)
stripeDetailsRouter.get(
  stripeDetailsPath.responsiblePerson.homeAddress,
  serviceSettingsController.stripeDetails.responsiblePerson.homeAddress.get
)
stripeDetailsRouter.post(
  stripeDetailsPath.responsiblePerson.homeAddress,
  serviceSettingsController.stripeDetails.responsiblePerson.homeAddress.post
)
stripeDetailsRouter.get(
  stripeDetailsPath.responsiblePerson.contactDetails,
  serviceSettingsController.stripeDetails.responsiblePerson.contactDetails.get
)
stripeDetailsRouter.post(
  stripeDetailsPath.responsiblePerson.contactDetails,
  serviceSettingsController.stripeDetails.responsiblePerson.contactDetails.post
)
stripeDetailsRouter.get(
  stripeDetailsPath.responsiblePerson.checkYourAnswers,
  serviceSettingsController.stripeDetails.responsiblePerson.checkYourAnswers.get
)
stripeDetailsRouter.post(
  stripeDetailsPath.responsiblePerson.checkYourAnswers,
  serviceSettingsController.stripeDetails.responsiblePerson.checkYourAnswers.post
)

stripeDetailsRouter.get(stripeDetailsPath.vatNumber, serviceSettingsController.stripeDetails.vatNumber.get)
stripeDetailsRouter.post(stripeDetailsPath.vatNumber, serviceSettingsController.stripeDetails.vatNumber.post)

stripeDetailsRouter.get(stripeDetailsPath.director, serviceSettingsController.stripeDetails.director.get)
stripeDetailsRouter.post(stripeDetailsPath.director, serviceSettingsController.stripeDetails.director.post)

stripeDetailsRouter.get(
  stripeDetailsPath.governmentEntityDocument,
  serviceSettingsController.stripeDetails.governmentEntityDocument.get
)
stripeDetailsRouter.post(stripeDetailsPath.governmentEntityDocument, [
  upload.single(GOV_ENTITY_DOC_FORM_FIELD_NAME),
  ...serviceSettingsController.stripeDetails.governmentEntityDocument.post,
])

simplifiedAccount.use(stripeDetailsRouter)

module.exports = simplifiedAccount
