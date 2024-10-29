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

// team members
simplifiedAccount.get(paths.simplifiedAccount.settings.teamMembers.index, permission('transactions:read'), serviceSettingsController.teamMembers.get)
simplifiedAccount.get(paths.simplifiedAccount.settings.teamMembers.delete, permission('transactions:read'), serviceSettingsController.teamMembers.getRemoveUser)
simplifiedAccount.post(paths.simplifiedAccount.settings.teamMembers.delete, permission('transactions:read'), serviceSettingsController.teamMembers.postRemoveUser)
simplifiedAccount.get(paths.simplifiedAccount.settings.teamMembers.permission, permission('transactions:read'), serviceSettingsController.teamMembers.getChangePermission)

// email notifications
simplifiedAccount.get(paths.simplifiedAccount.settings.emailNotifications.index, permission('transactions:read'), serviceSettingsController.emailNotifications.get)

// stripe details
simplifiedAccount.get(paths.simplifiedAccount.settings.stripeDetails.index, permission('stripe-account-details:update'), serviceSettingsController.stripeDetails.get)

module.exports = simplifiedAccount
