const { Router } = require('express')

const getSimplifiedAccount = require('./middleware/simplified-account/simplified-account-strategy.middleware')
const isOptedInToSimplifiedAccounts = require('./middleware/simplified-account/simplified-account-opt-in.middleware')
const userIsAuthorised = require('./middleware/user-is-authorised')
const paths = require('./paths')
const serviceSettingsController = require('./controllers/simplified-account/settings')
const permission = require('./middleware/permission')

const simplifiedAccount = new Router({ mergeParams: true })

simplifiedAccount.use(isOptedInToSimplifiedAccounts, getSimplifiedAccount, userIsAuthorised)

simplifiedAccount.get(paths.simplifiedAccount.settings.index, serviceSettingsController.index.get)

// service name
simplifiedAccount.get(paths.simplifiedAccount.settings.serviceName.index, permission('service-name:update'), serviceSettingsController.serviceName.get)
simplifiedAccount.get(paths.simplifiedAccount.settings.serviceName.edit, permission('service-name:update'), serviceSettingsController.serviceName.getEditServiceName)
simplifiedAccount.post(paths.simplifiedAccount.settings.serviceName.removeCy, permission('service-name:update'), serviceSettingsController.serviceName.postRemoveWelshServiceName)
simplifiedAccount.post(paths.simplifiedAccount.settings.serviceName.edit, permission('service-name:update'), serviceSettingsController.serviceName.postEditServiceName)

// email notifications
simplifiedAccount.get(paths.simplifiedAccount.settings.emailNotifications.index, permission('transactions:read'), serviceSettingsController.emailNotifications.get)

module.exports = simplifiedAccount
