const { Router } = require('express')

const {
  simplifiedAccountStrategy,
  simplifiedAccountOptIn,
  enforceEmailCollectionModeNotOff,
  enforceLiveAccountOnly,
  enforcePaymentProviderType
} = require('./middleware/simplified-account')
const userIsAuthorised = require('./middleware/user-is-authorised')
const permission = require('./middleware/permission')
const paths = require('./paths')
const serviceSettingsController = require('./controllers/simplified-account/settings')
const { STRIPE } = require('./models/payment-providers')

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
simplifiedAccount.get(paths.simplifiedAccount.settings.teamMembers.delete, permission('transactions:read'), serviceSettingsController.teamMembers.getRemoveUser)
simplifiedAccount.get(paths.simplifiedAccount.settings.teamMembers.permission, permission('transactions:read'), serviceSettingsController.teamMembers.getChangePermission)

// email notifications
simplifiedAccount.get(paths.simplifiedAccount.settings.emailNotifications.index, permission('transactions:read'), serviceSettingsController.emailNotifications.getEmailNotificationsSettingsPage)
simplifiedAccount.get(paths.simplifiedAccount.settings.emailNotifications.emailCollectionMode, permission('email-notification-template:read'), serviceSettingsController.emailNotifications.getEditEmailCollectionModePage)
simplifiedAccount.post(paths.simplifiedAccount.settings.emailNotifications.emailCollectionMode, permission('email-notification-template:read'), serviceSettingsController.emailNotifications.postEditEmailCollectionMode)
simplifiedAccount.get(paths.simplifiedAccount.settings.emailNotifications.refundEmailToggle, enforceEmailCollectionModeNotOff, permission('email-notification-template:read'), serviceSettingsController.emailNotifications.refundEmails.get)
simplifiedAccount.post(paths.simplifiedAccount.settings.emailNotifications.refundEmailToggle, enforceEmailCollectionModeNotOff, permission('email-notification-template:read'), serviceSettingsController.emailNotifications.refundEmails.post)
simplifiedAccount.get(paths.simplifiedAccount.settings.emailNotifications.paymentConfirmationEmailToggle, enforceEmailCollectionModeNotOff, permission('email-notification-template:read'), serviceSettingsController.emailNotifications.paymentConfirmationEmails.get)
simplifiedAccount.post(paths.simplifiedAccount.settings.emailNotifications.paymentConfirmationEmailToggle, enforceEmailCollectionModeNotOff, permission('email-notification-template:read'), serviceSettingsController.emailNotifications.paymentConfirmationEmails.post)

// stripe details
const stripeDetailsPath = paths.simplifiedAccount.settings.stripeDetails
const stripeDetailsRouter = new Router({ mergeParams: true })
  .use(enforcePaymentProviderType(STRIPE), permission('stripe-account-details:update'))
stripeDetailsRouter.get(stripeDetailsPath.index, serviceSettingsController.stripeDetails.get)
stripeDetailsRouter.get(stripeDetailsPath.bankAccount, serviceSettingsController.stripeDetails.bankAccount.get)
stripeDetailsRouter.post(stripeDetailsPath.bankAccount, serviceSettingsController.stripeDetails.bankAccount.post)
// -- new stuff
stripeDetailsRouter.get(stripeDetailsPath.companyNumber, serviceSettingsController.stripeDetails.companyNumber.get)
stripeDetailsRouter.get(stripeDetailsPath.organisationDetails, serviceSettingsController.stripeDetails.organisationDetails.get)
stripeDetailsRouter.get(stripeDetailsPath.responsiblePerson, serviceSettingsController.stripeDetails.responsiblePerson.get)
stripeDetailsRouter.get(stripeDetailsPath.governmentEntityDocument, serviceSettingsController.stripeDetails.governmentEntityDocument.get)
stripeDetailsRouter.get(stripeDetailsPath.vatNumber, serviceSettingsController.stripeDetails.vatNumber.get)
stripeDetailsRouter.get(stripeDetailsPath.director, serviceSettingsController.stripeDetails.director.get)
simplifiedAccount.use(stripeDetailsRouter)

module.exports = simplifiedAccount
