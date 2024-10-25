const { Router } = require('express')

const {
  simplifiedAccountStrategy,
  simplifiedAccountOptIn,
  enforceLiveAccountOnly
} = require('./middleware/simplified-account')
const userIsAuthorised = require('./middleware/user-is-authorised')
const permission = require('./middleware/permission')
const paths = require('./paths')
const serviceSettingsController = require('./controllers/simplified-account/settings')

const simplifiedAccount = new Router({ mergeParams: true })

simplifiedAccount.use(simplifiedAccountOptIn, simplifiedAccountStrategy, userIsAuthorised)

simplifiedAccount.get(paths.simplifiedAccount.settings.index, serviceSettingsController.index.get)

// service name
simplifiedAccount.get(paths.simplifiedAccount.settings.serviceName.index, enforceLiveAccountOnly, permission('service-name:update'), serviceSettingsController.serviceName.get)
simplifiedAccount.get(paths.simplifiedAccount.settings.serviceName.edit, enforceLiveAccountOnly, permission('service-name:update'), serviceSettingsController.serviceName.getEditServiceName)
simplifiedAccount.post(paths.simplifiedAccount.settings.serviceName.removeCy, enforceLiveAccountOnly, permission('service-name:update'), serviceSettingsController.serviceName.postRemoveWelshServiceName)
simplifiedAccount.post(paths.simplifiedAccount.settings.serviceName.edit, enforceLiveAccountOnly, permission('service-name:update'), serviceSettingsController.serviceName.postEditServiceName)

// email notifications
simplifiedAccount.get(paths.simplifiedAccount.settings.emailNotifications.index, permission('transactions:read'), serviceSettingsController.emailNotifications.get)

// stripe details
simplifiedAccount.get(paths.simplifiedAccount.settings.stripeDetails.index, permission('stripe-account-details:update'), serviceSettingsController.stripeDetails.get)
simplifiedAccount.get(paths.simplifiedAccount.settings.stripeDetails.bankAccount, permission('stripe-account-details:update'), serviceSettingsController.stripeDetails.bankAccount.get)
simplifiedAccount.post(paths.simplifiedAccount.settings.stripeDetails.bankAccount, permission('stripe-account-details:update'), serviceSettingsController.stripeDetails.bankAccount.post)

module.exports = simplifiedAccount
