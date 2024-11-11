const { Router } = require('express')

const {
  simplifiedAccountStrategy,
  simplifiedAccountOptIn,
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

// email notifications
simplifiedAccount.get(paths.simplifiedAccount.settings.emailNotifications.index, permission('transactions:read'), serviceSettingsController.emailNotifications.getEmailNotificationsSettingsPage)
simplifiedAccount.get(paths.simplifiedAccount.settings.emailNotifications.collectionSettings, permission('email-notification-template:read'), serviceSettingsController.emailNotifications.getEditEmailCollectionModePage)
simplifiedAccount.post(paths.simplifiedAccount.settings.emailNotifications.collectionSettings, permission('email-notification-template:read'), serviceSettingsController.emailNotifications.postEditEmailCollectionMode)

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
stripeDetailsRouter.get(stripeDetailsPath.governmentEntityDocument, serviceSettingsController.stripeDetails.governmentEntityDocument.get)
stripeDetailsRouter.get(stripeDetailsPath.vatNumber, serviceSettingsController.stripeDetails.vatNumber.get)
stripeDetailsRouter.get(stripeDetailsPath.director, serviceSettingsController.stripeDetails.director.get)
simplifiedAccount.use(stripeDetailsRouter)

module.exports = simplifiedAccount
