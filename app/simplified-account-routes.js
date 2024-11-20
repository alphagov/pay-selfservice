const multer = require('multer')
const { Router } = require('express')
const {
  simplifiedAccountStrategy,
  simplifiedAccountOptIn,
  enforceEmailCollectionModeNotOff,
  enforceLiveAccountOnly,
<<<<<<< HEAD
  enforcePaymentProviderType,
=======
  enforcePaymentProviderType
>>>>>>> 4d04dcb6a (PP-13297 Replace adminActionOnSelf middleware)
} = require('./middleware/simplified-account')
const userIsAuthorised = require('./middleware/user-is-authorised')
const permission = require('./middleware/permission')
const paths = require('./paths')
const serviceSettingsController = require('@controllers/simplified-account/settings')
const { STRIPE } = require('@models/payment-providers')
const { GOV_ENTITY_DOC_FORM_FIELD_NAME } = require('@controllers/simplified-account/settings/stripe-details/government-entity-document/constants')

const upload = multer({ storage: multer.memoryStorage() })
const simplifiedAccount = new Router({ mergeParams: true })

simplifiedAccount.use(simplifiedAccountOptIn, simplifiedAccountStrategy, userIsAuthorised)

simplifiedAccount.get(paths.simplifiedAccount.settings.index, serviceSettingsController.index.get)

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
simplifiedAccount.post(paths.simplifiedAccount.settings.emailNotifications.customParagraph, permission('email-notification-paragraph:update'), serviceSettingsController.emailNotifications.customParagraph.post)

// organisation details
simplifiedAccount.get(paths.simplifiedAccount.settings.organisationDetails.index, serviceSettingsController.organisationDetails.get)
simplifiedAccount.get(paths.simplifiedAccount.settings.organisationDetails.edit, serviceSettingsController.organisationDetails.edit.get)
simplifiedAccount.post(paths.simplifiedAccount.settings.organisationDetails.edit, serviceSettingsController.organisationDetails.edit.post)

// stripe details
const stripeDetailsPath = paths.simplifiedAccount.settings.stripeDetails
const stripeDetailsRouter = new Router({ mergeParams: true })
  .use(enforcePaymentProviderType(STRIPE), permission('stripe-account-details:update'))
stripeDetailsRouter.get(stripeDetailsPath.index, serviceSettingsController.stripeDetails.get)
stripeDetailsRouter.get(stripeDetailsPath.bankAccount, serviceSettingsController.stripeDetails.bankAccount.get)
stripeDetailsRouter.post(stripeDetailsPath.bankAccount, serviceSettingsController.stripeDetails.bankAccount.post)
// -- new stuff
stripeDetailsRouter.get(stripeDetailsPath.companyNumber, serviceSettingsController.stripeDetails.companyNumber.get)
stripeDetailsRouter.post(stripeDetailsPath.companyNumber, serviceSettingsController.stripeDetails.companyNumber.post)
stripeDetailsRouter.get(stripeDetailsPath.organisationDetails, serviceSettingsController.stripeDetails.organisationDetails.get)
stripeDetailsRouter.post(stripeDetailsPath.organisationDetails, serviceSettingsController.stripeDetails.organisationDetails.post)
// -- responsible person
stripeDetailsRouter.get(stripeDetailsPath.responsiblePerson.index, serviceSettingsController.stripeDetails.responsiblePerson.get)
stripeDetailsRouter.post(stripeDetailsPath.responsiblePerson.index, serviceSettingsController.stripeDetails.responsiblePerson.post)
stripeDetailsRouter.get(stripeDetailsPath.responsiblePerson.homeAddress, serviceSettingsController.stripeDetails.responsiblePerson.homeAddress.get)
stripeDetailsRouter.post(stripeDetailsPath.responsiblePerson.homeAddress, serviceSettingsController.stripeDetails.responsiblePerson.homeAddress.post)
stripeDetailsRouter.get(stripeDetailsPath.responsiblePerson.contactDetails, serviceSettingsController.stripeDetails.responsiblePerson.contactDetails.get)
stripeDetailsRouter.post(stripeDetailsPath.responsiblePerson.contactDetails, serviceSettingsController.stripeDetails.responsiblePerson.contactDetails.post)
stripeDetailsRouter.get(stripeDetailsPath.responsiblePerson.checkYourAnswers, serviceSettingsController.stripeDetails.responsiblePerson.checkYourAnswers.get)
stripeDetailsRouter.post(stripeDetailsPath.responsiblePerson.checkYourAnswers, serviceSettingsController.stripeDetails.responsiblePerson.checkYourAnswers.post)
// --
stripeDetailsRouter.get(stripeDetailsPath.vatNumber, serviceSettingsController.stripeDetails.vatNumber.get)
stripeDetailsRouter.post(stripeDetailsPath.vatNumber, serviceSettingsController.stripeDetails.vatNumber.post)
stripeDetailsRouter.get(stripeDetailsPath.director, serviceSettingsController.stripeDetails.director.get)
stripeDetailsRouter.post(stripeDetailsPath.director, serviceSettingsController.stripeDetails.director.post)
stripeDetailsRouter.get(stripeDetailsPath.governmentEntityDocument, serviceSettingsController.stripeDetails.governmentEntityDocument.get)
stripeDetailsRouter.post(stripeDetailsPath.governmentEntityDocument, upload.single(GOV_ENTITY_DOC_FORM_FIELD_NAME), serviceSettingsController.stripeDetails.governmentEntityDocument.post)
simplifiedAccount.use(stripeDetailsRouter)

module.exports = simplifiedAccount
