const paths = require('../../../paths')
const formatSimplifiedAccountPathsFor = require('../format/format-simplified-account-paths-for')
const SettingsBuilder = require('./SettingsBuilder.class')
const { LIVE } = require('../../../models/go-live-stage')

module.exports = (account, currentUrl, goLiveStage, permissions) => {
  const settingsBuilder = new SettingsBuilder(account, currentUrl, permissions, formatSimplifiedAccountPathsFor)
  const serviceSettings = settingsBuilder
    .category('about your service')
    .add({
      id: 'service-name',
      name: 'service name',
      path: paths.simplifiedAccount.settings.serviceName.index,
      permission: 'service_name_update' // TODO find a better way of defining these
    })
    .add({
      id: 'email-notifications',
      name: 'email notifications',
      path: paths.simplifiedAccount.settings.emailNotifications.index,
      permission: true, // everyone can view email notifications settings
      alwaysViewable: true
    })
    .add({
      id: 'team-members',
      name: 'team members',
      path: paths.simplifiedAccount.settings.teamMembers.index,
      permission: true // TODO
    })
    .add({
      id: 'org-details',
      name: 'organisation details',
      path: paths.simplifiedAccount.settings.orgDetails.index,
      permission: 'merchant_details_update' // TODO find a better way of defining these
    })
    .category('payments')
    .add({
      id: 'card-paymemts',
      name: 'card payments',
      path: paths.simplifiedAccount.settings.cardPayments.index,
      permission: true, // TODO
      alwaysViewable: true
    })
    .add({
      id: 'card-types',
      name: 'card types',
      path: paths.simplifiedAccount.settings.cardTypes.index,
      permission: true, // TODO
      alwaysViewable: true
    })
    .category('developers')
    .add({
      id: 'api-keys',
      name: 'API keys',
      path: paths.simplifiedAccount.settings.apiKeys.index,
      permission: 'tokens_update', // TODO find a better way of defining these
      alwaysViewable: true
    })
    .add({
      id: 'webhooks',
      name: 'webhooks',
      path: paths.simplifiedAccount.settings.webhooks.index,
      permission: 'webhooks_update', // TODO find a better way of defining these
      alwaysViewable: true
    })
    .build()
  return getViewableSettings(serviceSettings, account, goLiveStage)
}

const shouldShowSettingForAccountTypeAndGoLiveStage = (account, goLiveStage) => {
  if (account.type === 'test') {
    // For test accounts, show setting only if the go live stage is not LIVE
    return goLiveStage !== LIVE
  } else if (account.type === 'live') {
    // Always display settings for live accounts
    return true
  }
  return false
}

const getViewableSettings = (serviceSettings, account, goLiveStage) => {
  const viewableSettings = {}

  for (const [category, settings] of Object.entries(serviceSettings)) {
    const viewableCategory = settings.filter(setting =>
      (setting.alwaysViewable || shouldShowSettingForAccountTypeAndGoLiveStage(account, goLiveStage)) && setting.permitted
    )

    if (viewableCategory.length > 0) {
      viewableSettings[category] = viewableCategory
    }
  }

  return viewableSettings
}
