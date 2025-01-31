const multer = require('multer')
const { Router } = require('express')
const {
  simplifiedAccountStrategy,
  simplifiedAccountOptIn,
  enforceEmailCollectionModeNotOff,
  enforceLiveAccountOnly,
  enforcePaymentProviderType,
  defaultViewDecider
} = require('@middleware/simplified-account')
const userIsAuthorised = require('@middleware/user-is-authorised')
const permission = require('@middleware/permission')
const paths = require('./paths')
const serviceSettingsController = require('@controllers/simplified-account/settings')
const { STRIPE, WORLDPAY } = require('@models/payment-providers')
const { GOV_ENTITY_DOC_FORM_FIELD_NAME } = require('@controllers/simplified-account/settings/stripe-details/government-entity-document/constants')

const upload = multer({ storage: multer.memoryStorage() })
const simplifiedAccount = new Router({ mergeParams: true })

simplifiedAccount.use(simplifiedAccountOptIn, simplifiedAccountStrategy, userIsAuthorised)

// settings index
simplifiedAccount.get(paths.simplifiedAccount.settings.index, defaultViewDecider, (req, res) => {
  req.selectedController(req, res)
})

// service name
simplifiedAccount.get(paths.simplifiedAccount.settings.serviceName.index, enforceLiveAccountOnly, permission('service-name:update'), serviceSettingsController.serviceName.get)
simplifiedAccount.get(paths.simplifiedAccount.settings.serviceName.edit, enforceLiveAccountOnly, permission('service-name:update'), serviceSettingsController.serviceName.getEditServiceName)
simplifiedAccount.post(paths.simplifiedAccount.settings.serviceName.removeCy, enforceLiveAccountOnly, permission('service-name:update'), serviceSettingsController.serviceName.postRemoveWelshServiceName)
simplifiedAccount.post(paths.simplifiedAccount.settings.serviceName.edit, enforceLiveAccountOnly, permission('service-name:update'), serviceSettingsController.serviceName.postEditServiceName)

// team members
simplifiedAccount.get(paths.simplifiedAccount.settings.teamMembers.index, permission('transactions:read'), serviceSettingsController.teamMembers.get)
simplifiedAccount.get(paths.simplifiedAccount.settings.teamMembers.delete, permission('users-service:delete'), serviceSettingsController.teamMembers.removeUser.get)
simplifiedAccount.post(paths.simplifiedAccount.settings.teamMembers.delete, permission('users-service:delete'), serviceSettingsController.teamMembers.removeUser.post)
simplifiedAccount.get(paths.simplifiedAccount.settings.teamMembers.permission, permission('users-service:create'), serviceSettingsController.teamMembers.changePermission.get)
simplifiedAccount.post(paths.simplifiedAccount.settings.teamMembers.permission, permission('users-service:create'), serviceSettingsController.teamMembers.changePermission.post)
simplifiedAccount.get(paths.simplifiedAccount.settings.teamMembers.invite, permission('users-service:create'), serviceSettingsController.teamMembers.invite.get)
simplifiedAccount.post(paths.simplifiedAccount.settings.teamMembers.invite, permission('users-service:create'), serviceSettingsController.teamMembers.invite.post)

// email notifications
simplifiedAccount.get(paths.simplifiedAccount.settings.emailNotifications.index, permission('transactions:read'), serviceSettingsController.emailNotifications.getEmailNotificationsSettingsPage)
simplifiedAccount.get(paths.simplifiedAccount.settings.emailNotifications.emailCollectionMode, permission('email-notification-template:read'), serviceSettingsController.emailNotifications.getEditEmailCollectionModePage)
simplifiedAccount.post(paths.simplifiedAccount.settings.emailNotifications.emailCollectionMode, permission('email-notification-toggle:update'), serviceSettingsController.emailNotifications.postEditEmailCollectionMode)
simplifiedAccount.get(paths.simplifiedAccount.settings.emailNotifications.refundEmailToggle, enforceEmailCollectionModeNotOff, permission('email-notification-template:read'), serviceSettingsController.emailNotifications.refundEmails.get)
simplifiedAccount.post(paths.simplifiedAccount.settings.emailNotifications.refundEmailToggle, enforceEmailCollectionModeNotOff, permission('email-notification-toggle:update'), serviceSettingsController.emailNotifications.refundEmails.post)
simplifiedAccount.get(paths.simplifiedAccount.settings.emailNotifications.paymentConfirmationEmailToggle, enforceEmailCollectionModeNotOff, permission('email-notification-template:read'), serviceSettingsController.emailNotifications.paymentConfirmationEmails.get)
simplifiedAccount.post(paths.simplifiedAccount.settings.emailNotifications.paymentConfirmationEmailToggle, enforceEmailCollectionModeNotOff, permission('email-notification-toggle:update'), serviceSettingsController.emailNotifications.paymentConfirmationEmails.post)
simplifiedAccount.get(paths.simplifiedAccount.settings.emailNotifications.templates, permission('email-notification-template:read'), serviceSettingsController.emailNotifications.templates.get)
simplifiedAccount.get(paths.simplifiedAccount.settings.emailNotifications.customParagraph, permission('email-notification-paragraph:update'), serviceSettingsController.emailNotifications.customParagraph.get)
simplifiedAccount.post(paths.simplifiedAccount.settings.emailNotifications.customParagraph, permission('email-notification-paragraph:update'), serviceSettingsController.emailNotifications.customParagraph.postEditCustomParagraph)
simplifiedAccount.post(paths.simplifiedAccount.settings.emailNotifications.removeCustomParagraph, permission('email-notification-paragraph:update'), serviceSettingsController.emailNotifications.customParagraph.postRemoveCustomParagraph)

// organisation details
simplifiedAccount.get(paths.simplifiedAccount.settings.organisationDetails.index, enforceLiveAccountOnly, permission('merchant-details:read'), serviceSettingsController.organisationDetails.get)
simplifiedAccount.get(paths.simplifiedAccount.settings.organisationDetails.edit, enforceLiveAccountOnly, permission('merchant-details:update'), serviceSettingsController.organisationDetails.edit.get)
simplifiedAccount.post(paths.simplifiedAccount.settings.organisationDetails.edit, enforceLiveAccountOnly, permission('merchant-details:update'), serviceSettingsController.organisationDetails.edit.post)

// card types
simplifiedAccount.get(paths.simplifiedAccount.settings.cardTypes.index, permission('transactions:read'), serviceSettingsController.cardTypes.get)
simplifiedAccount.post(paths.simplifiedAccount.settings.cardTypes.index, permission('payment-types:update'), serviceSettingsController.cardTypes.post)

// card payments
simplifiedAccount.get(paths.simplifiedAccount.settings.cardPayments.index, permission('payment-types:read'), serviceSettingsController.cardPayments.get)

// worldpay details
simplifiedAccount.get(paths.simplifiedAccount.settings.worldpayDetails.index, enforcePaymentProviderType(WORLDPAY), permission('gateway-credentials:read'), serviceSettingsController.worldpayDetails.get)
simplifiedAccount.get(paths.simplifiedAccount.settings.worldpayDetails.oneOffCustomerInitiated, enforcePaymentProviderType(WORLDPAY), permission('gateway-credentials:update'), serviceSettingsController.worldpayDetails.oneOffCustomerInitiatedCredentials.get)
simplifiedAccount.post(paths.simplifiedAccount.settings.worldpayDetails.oneOffCustomerInitiated, enforcePaymentProviderType(WORLDPAY), permission('gateway-credentials:update'), serviceSettingsController.worldpayDetails.oneOffCustomerInitiatedCredentials.post)
simplifiedAccount.get(paths.simplifiedAccount.settings.worldpayDetails.flexCredentials, enforcePaymentProviderType(WORLDPAY), permission('gateway-credentials:update'), serviceSettingsController.worldpayDetails.flexCredentials.get)
simplifiedAccount.post(paths.simplifiedAccount.settings.worldpayDetails.flexCredentials, enforcePaymentProviderType(WORLDPAY), permission('gateway-credentials:update'), serviceSettingsController.worldpayDetails.flexCredentials.post)

// card types
simplifiedAccount.get(paths.simplifiedAccount.settings.cardTypes.index, permission('transactions:read'), serviceSettingsController.cardTypes.get)

// api keys
simplifiedAccount.get(paths.simplifiedAccount.settings.apiKeys.index, permission('tokens-active:read'), serviceSettingsController.apiKeys.get)
simplifiedAccount.get(paths.simplifiedAccount.settings.apiKeys.create, permission('tokens:create'), serviceSettingsController.apiKeys.createApiKey.get)
simplifiedAccount.post(paths.simplifiedAccount.settings.apiKeys.create, permission('tokens:create'), serviceSettingsController.apiKeys.createApiKey.post)
simplifiedAccount.get(paths.simplifiedAccount.settings.apiKeys.changeName, permission('tokens:update'), serviceSettingsController.apiKeys.changeName.get)
simplifiedAccount.post(paths.simplifiedAccount.settings.apiKeys.changeName, permission('tokens:update'), serviceSettingsController.apiKeys.changeName.post)
simplifiedAccount.get(paths.simplifiedAccount.settings.apiKeys.revoke, permission('tokens:delete'), serviceSettingsController.apiKeys.revoke.get)
simplifiedAccount.post(paths.simplifiedAccount.settings.apiKeys.revoke, permission('tokens:delete'), serviceSettingsController.apiKeys.revoke.post)
simplifiedAccount.get(paths.simplifiedAccount.settings.apiKeys.revokedKeys, permission('tokens-revoked:read'), serviceSettingsController.apiKeys.revokedKeys.get)

// webhooks
simplifiedAccount.get(paths.simplifiedAccount.settings.webhooks.index, permission('webhooks:read'), serviceSettingsController.webhooks.get)
simplifiedAccount.get(paths.simplifiedAccount.settings.webhooks.create, permission('webhooks:read'), serviceSettingsController.webhooks.create.get)
simplifiedAccount.post(paths.simplifiedAccount.settings.webhooks.create, permission('webhooks:update'), serviceSettingsController.webhooks.create.post)

// stripe details
const stripeDetailsPath = paths.simplifiedAccount.settings.stripeDetails
const stripeDetailsRouter = new Router({ mergeParams: true })
  .use(enforceLiveAccountOnly, enforcePaymentProviderType(STRIPE), permission('stripe-account-details:update'))
stripeDetailsRouter.get(stripeDetailsPath.index, serviceSettingsController.stripeDetails.get)
stripeDetailsRouter.get(stripeDetailsPath.accountDetails, serviceSettingsController.stripeDetails.getAccountDetails)

stripeDetailsRouter.get(stripeDetailsPath.bankDetails, serviceSettingsController.stripeDetails.bankDetails.get)
stripeDetailsRouter.post(stripeDetailsPath.bankDetails, serviceSettingsController.stripeDetails.bankDetails.post)

stripeDetailsRouter.get(stripeDetailsPath.companyNumber, serviceSettingsController.stripeDetails.companyNumber.get)
stripeDetailsRouter.post(stripeDetailsPath.companyNumber, serviceSettingsController.stripeDetails.companyNumber.post)

stripeDetailsRouter.get(stripeDetailsPath.organisationDetails.index, serviceSettingsController.stripeDetails.organisationDetails.get)
stripeDetailsRouter.post(stripeDetailsPath.organisationDetails.index, serviceSettingsController.stripeDetails.organisationDetails.post)
stripeDetailsRouter.get(stripeDetailsPath.organisationDetails.update, serviceSettingsController.stripeDetails.organisationDetails.update.get)
stripeDetailsRouter.post(stripeDetailsPath.organisationDetails.update, serviceSettingsController.stripeDetails.organisationDetails.update.post)

stripeDetailsRouter.get(stripeDetailsPath.responsiblePerson.index, serviceSettingsController.stripeDetails.responsiblePerson.get)
stripeDetailsRouter.post(stripeDetailsPath.responsiblePerson.index, serviceSettingsController.stripeDetails.responsiblePerson.post)
stripeDetailsRouter.get(stripeDetailsPath.responsiblePerson.homeAddress, serviceSettingsController.stripeDetails.responsiblePerson.homeAddress.get)
stripeDetailsRouter.post(stripeDetailsPath.responsiblePerson.homeAddress, serviceSettingsController.stripeDetails.responsiblePerson.homeAddress.post)
stripeDetailsRouter.get(stripeDetailsPath.responsiblePerson.contactDetails, serviceSettingsController.stripeDetails.responsiblePerson.contactDetails.get)
stripeDetailsRouter.post(stripeDetailsPath.responsiblePerson.contactDetails, serviceSettingsController.stripeDetails.responsiblePerson.contactDetails.post)
stripeDetailsRouter.get(stripeDetailsPath.responsiblePerson.checkYourAnswers, serviceSettingsController.stripeDetails.responsiblePerson.checkYourAnswers.get)
stripeDetailsRouter.post(stripeDetailsPath.responsiblePerson.checkYourAnswers, serviceSettingsController.stripeDetails.responsiblePerson.checkYourAnswers.post)

stripeDetailsRouter.get(stripeDetailsPath.vatNumber, serviceSettingsController.stripeDetails.vatNumber.get)
stripeDetailsRouter.post(stripeDetailsPath.vatNumber, serviceSettingsController.stripeDetails.vatNumber.post)

stripeDetailsRouter.get(stripeDetailsPath.director, serviceSettingsController.stripeDetails.director.get)
stripeDetailsRouter.post(stripeDetailsPath.director, serviceSettingsController.stripeDetails.director.post)

stripeDetailsRouter.get(stripeDetailsPath.governmentEntityDocument, serviceSettingsController.stripeDetails.governmentEntityDocument.get)
stripeDetailsRouter.post(stripeDetailsPath.governmentEntityDocument, [upload.single(GOV_ENTITY_DOC_FORM_FIELD_NAME), ...serviceSettingsController.stripeDetails.governmentEntityDocument.post])

simplifiedAccount.use(stripeDetailsRouter)

module.exports = simplifiedAccount
